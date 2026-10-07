# Research publications

Publication records live in `paper-info/` as Markdown files with YAML front matter. The site does not scan this folder in the browser: run the build script after adding or editing a record, then commit the generated data file with your changes.

## Build before pushing

From the repository folder in the VS Code terminal, run this once if PyYAML is not installed:

```powershell
py -m pip install -r requirements.txt
```

Then run this after changing a file in `paper-info/` and before pushing:

```powershell
py build_research.py
```

The script validates the metadata and updates `research-publications-data.js`. Commit that generated file along with the Markdown records; GitHub Pages serves the finished static files and does not run the build script.

To preview the publication page locally, open `research.html` in a browser (or use VS Code Live Server). The publication list uses local JavaScript files and does not fetch files from `paper-info/`, so opening the page directly does not require a server or cause local-file CORS errors.

Publications are grouped by year. The controls filter by author, venue tag, year, publication type, and topic tag; the description and alphabetized tags appear when a publication is hovered or focused.

## Record format

Create a `.md` file in `paper-info/` with `layout: publication`, a title, and the metadata you have. Authors, type, and tags are YAML lists; optional fields can be omitted. The starter `template-paper.md` is ignored by the build until you rename it.

```yaml
---
layout: publication
authors:
  - Reese Fairchild
  - Co-author Name
title: Example publication title
type:
  - Conference
venue: Example Conference
venue_tags:
  - EXCONF
year: 2026
description: A short description of the work.
link: https://example.com/project
pdf: https://example.com/paper.pdf
code: https://github.com/example/project
html: https://example.com/demo
tags:
  - Visualization
summary: A brief summary of the paper.
---
```
