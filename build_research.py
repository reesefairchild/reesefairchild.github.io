import json
import re
from datetime import date
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parent
PAPER_INFO = ROOT / "paper-info"
OUTPUT = ROOT / "research-publications-data.js"
FRONT_MATTER = re.compile(r"\A---\s*\r?\n(.*?)\r?\n---(?:\s*\r?\n|\Z)", re.DOTALL)
LIST_FIELDS = ("authors", "tags", "type", "venue_tags")
TEXT_FIELDS = ("title", "description", "link", "pdf", "code", "html", "summary", "venue", "venue_url", "date")
TEMPLATE_FILES = {"template-paper.md"}


def normalize_list(value, field, filename):
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
        raise ValueError(f"{filename}: '{field}' must be a string or a list of strings")
    return value


def read_publication(path):
    source = path.read_text(encoding="utf-8-sig")
    match = FRONT_MATTER.match(source)
    if not match:
        raise ValueError(f"{path.name}: missing YAML front matter")

    metadata = yaml.safe_load(match.group(1))
    if not isinstance(metadata, dict):
        raise ValueError(f"{path.name}: YAML front matter must contain a mapping")
    if metadata.get("layout") != "publication":
        raise ValueError(f"{path.name}: set 'layout: publication'")

    publication = {}
    for field in TEXT_FIELDS:
        value = metadata.get(field, "")
        if value is None:
            value = ""
        if not isinstance(value, str):
            raise ValueError(f"{path.name}: '{field}' must be a string")
        publication[field] = value

    year = metadata.get("year", "")
    if not isinstance(year, (int, str)):
        raise ValueError(f"{path.name}: 'year' must be a number or string")
    publication["year"] = year

    for field in LIST_FIELDS:
        publication[field] = normalize_list(metadata.get(field), field, path.name)

    if not publication["title"]:
        raise ValueError(f"{path.name}: 'title' is required")
    publication_date = publication["date"]
    if not re.fullmatch(r"(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])", publication_date):
        raise ValueError(f"{path.name}: 'date' must use MM-DD format")
    try:
        month, day = map(int, publication_date.split("-"))
        date(2000, month, day)
    except ValueError as error:
        raise ValueError(f"{path.name}: 'date' must be a valid MM-DD date") from error
    return publication


def main():
    if not PAPER_INFO.is_dir():
        raise FileNotFoundError(f"Publication directory not found: {PAPER_INFO}")

    sources = sorted(
        path for path in PAPER_INFO.glob("*.md") if path.name not in TEMPLATE_FILES
    )
    publications = [read_publication(path) for path in sources]
    data = json.dumps(publications, ensure_ascii=True, separators=(",", ":"))
    data = data.replace("<", "\\u003c").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    OUTPUT.write_text(f"window.RESEARCH_PUBLICATIONS = {data};\n", encoding="utf-8")
    print(f"Built {len(publications)} publications from {len(sources)} files: {OUTPUT.name}")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, yaml.YAMLError) as error:
        raise SystemExit(f"Build failed: {error}") from error
