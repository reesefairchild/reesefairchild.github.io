const publicationRoot = document.querySelector("[data-publication-browser]");

if (publicationRoot) {
    const publications = window.RESEARCH_PUBLICATIONS;

    if (!Array.isArray(publications)) {
        throw new Error("Publication data is missing. Run `python build_research.py`.");
    }

    const createElement = (tagName, className, text) => {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    };

    const createLink = (url, label) => {
        const link = createElement("a", "paper-link", label);
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener";
        return link;
    };

    const controls = createElement("div", "publication-controls");
    const authorInput = createElement("input", "form-control");
    const venueSelect = createElement("select", "form-select");
    const yearSelect = createElement("select", "form-select");
    const typeSelect = createElement("select", "form-select");
    const tagSelect = createElement("select", "form-select");
    const list = document.createElement("div");
    const emptyMessage = createElement("p", "", "No publications match these filters.");
    const groups = new Map();

    list.dataset.publicationList = "";
    emptyMessage.hidden = true;

    const addControl = (label, id, control) => {
        const wrapper = createElement("div", "publication-filter");
        const labelElement = createElement("label", "form-label", label);
        labelElement.htmlFor = id;
        control.id = id;
        wrapper.append(labelElement, control);
        controls.append(wrapper);
    };

    authorInput.type = "search";
    authorInput.placeholder = "Search authors";
    authorInput.dataset.publicationAuthorFilter = "";
    venueSelect.dataset.publicationVenueFilter = "";
    yearSelect.dataset.publicationYearFilter = "";
    typeSelect.dataset.publicationTypeFilter = "";
    tagSelect.dataset.publicationTagFilter = "";

    const addOption = (select, value, label = value) => {
        const option = createElement("option", "", label);
        option.value = value;
        select.append(option);
    };

    addControl("Author", "publication-author-filter", authorInput);
    addControl("Venue", "publication-venue-filter", venueSelect);
    addControl("Year", "publication-year-filter", yearSelect);
    addControl("Type", "publication-type-filter", typeSelect);
    addControl("Tag", "publication-tag-filter", tagSelect);
    addOption(venueSelect, "", "All venues");
    addOption(yearSelect, "", "All years");
    addOption(typeSelect, "", "All types");
    addOption(tagSelect, "", "All tags");

    const sortedPublications = [...publications].sort((a, b) => {
        const yearDifference = Number(b.year) - Number(a.year);
        if (Number.isFinite(yearDifference) && yearDifference !== 0) return yearDifference;
        if (!a.year && b.year) return 1;
        if (a.year && !b.year) return -1;
        if (a.date && !b.date) return -1;
        if (!a.date && b.date) return 1;
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return a.title.localeCompare(b.title);
    });

    let detailIndex = 0;
    sortedPublications.forEach(publication => {
        const article = createElement("article", "publication-item");
        const title = createElement("h5", "publication-title", publication.title);
        const authorLine = createElement("p", "publication-authors");
        const metaLine = createElement("p", "publication-venue");
        const links = createElement("p", "publication-links");
        const hoverDetails = createElement("div", "publication-extra");
        const description = publication.description || publication.summary;
        const sortedTags = [...publication.tags].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
        const hasDetails = Boolean(description || sortedTags.length);

        article.dataset.title = publication.title.toLocaleLowerCase();
        article.dataset.authors = publication.authors.join("|").toLocaleLowerCase();
        article.dataset.venue = publication.venue_tags.join("|").toLocaleLowerCase();
        article.dataset.year = String(publication.year || "");
        article.dataset.type = publication.type.join("|").toLocaleLowerCase();
        article.dataset.tags = sortedTags.join("|").toLocaleLowerCase();

        publication.authors.forEach((author, index) => {
            if (author === "Reese Fairchild") {
                authorLine.append(createElement("b", "", author));
            } else {
                authorLine.append(document.createTextNode(author));
            }
            if (index < publication.authors.length - 1) authorLine.append(document.createTextNode(", "));
        });

        if (publication.venue) {
            const venue = publication.venue_url
                ? createLink(publication.venue_url, publication.venue)
                : document.createTextNode(publication.venue);
            const venueWrapper = createElement("i");
            venueWrapper.append(venue);
            metaLine.replaceChildren(venueWrapper);
        } else {
            metaLine.append(document.createTextNode("Under Review"));
        }

        [
            ["link", "Link"],
            ["pdf", "PDF"],
            ["code", "Code"],
            ["html", "HTML"]
        ].forEach(([field, label]) => {
            if (!publication[field]) return;
            if (links.childNodes.length) links.append(document.createTextNode(" | "));
            links.append(createLink(publication[field], label));
        });

        if (description) hoverDetails.append(createElement("p", "publication-description", description));
        if (sortedTags.length) {
            const tagsLabel = createElement("strong", "", "Tags: ");
            hoverDetails.append(tagsLabel, document.createTextNode(sortedTags.join(", ")));
        }

        article.append(title);
        if (publication.authors.length) article.append(authorLine);
        article.append(metaLine);
        if (links.childNodes.length) article.append(links);
        if (hasDetails) {
            const detailId = `publication-details-${detailIndex++}`;
            const toggle = createElement("button", "publication-details-toggle", "Details +");
            toggle.type = "button";
            toggle.setAttribute("aria-expanded", "false");
            toggle.setAttribute("aria-controls", detailId);
            toggle.setAttribute("aria-label", `Show details for ${publication.title}`);
            hoverDetails.setAttribute("role", "region");
            hoverDetails.setAttribute("aria-label", `${publication.title} details`);
            hoverDetails.id = detailId;
            article.append(toggle, hoverDetails);

            const updateDetailsState = () => {
                const isOpen = article.matches(":hover, :focus-within, .is-open");
                toggle.setAttribute("aria-expanded", String(isOpen));
                toggle.textContent = isOpen ? "Details −" : "Details +";
            };

            toggle.addEventListener("click", () => {
                article.classList.toggle("is-open");
                updateDetailsState();
                if (!article.classList.contains("is-open")) toggle.blur();
            });
            article.addEventListener("pointerenter", updateDetailsState);
            article.addEventListener("pointerleave", updateDetailsState);
            article.addEventListener("focusin", updateDetailsState);
            article.addEventListener("focusout", () => queueMicrotask(updateDetailsState));
            toggle.addEventListener("keydown", event => {
                if (event.key === "Escape") {
                    article.classList.remove("is-open");
                    toggle.blur();
                    updateDetailsState();
                }
            });
        }

        const year = String(publication.year || "Year not specified");
        if (!groups.has(year)) {
            const group = createElement("table", "info-table publication-year-block");
            group.dataset.publicationYearBlock = year === "Year not specified" ? "" : year;
            const body = document.createElement("tbody");
            const row = document.createElement("tr");
            const yearCell = createElement("td", "info-left publication-year-cell", year);
            const publicationsCell = createElement("td", "info-right publication-list-cell");
            publicationsCell.append(createElement("div", "publication-year-publications"));
            row.append(yearCell, publicationsCell);
            body.append(row);
            group.append(body);
            groups.set(year, group);
            list.append(group);
        }
        groups.get(year).querySelector(".publication-year-publications").append(article);
    });

    publicationRoot.append(controls, list, emptyMessage);

    const getLabelCounts = valuesByPublication => {
        const counts = new Map();
        valuesByPublication.forEach(values => {
            [...new Set(values.filter(Boolean))].forEach(value => {
                counts.set(value, (counts.get(value) || 0) + 1);
            });
        });
        return counts;
    };
    const addCountedOptions = (select, counts, comparator) => {
        [...counts.keys()]
            .sort(comparator)
            .forEach(value => addOption(select, value, `${value} (${counts.get(value)})`));
    };

    const compareLabels = (a, b) => a.localeCompare(b, undefined, { sensitivity: "base" });
    const compareByCount = (counts, a, b) => counts.get(b) - counts.get(a) || compareLabels(a, b);
    const yearCounts = getLabelCounts(publications.map(publication => [String(publication.year || "")]));
    addCountedOptions(
        yearSelect,
        yearCounts,
        (a, b) => Number(b) - Number(a) || compareLabels(a, b)
    );
    const venueCounts = getLabelCounts(publications.map(publication => publication.venue_tags));
    const typeCounts = getLabelCounts(publications.map(publication => publication.type));
    const tagCounts = getLabelCounts(publications.map(publication => publication.tags));
    addCountedOptions(venueSelect, venueCounts, (a, b) => compareByCount(venueCounts, a, b));
    addCountedOptions(typeSelect, typeCounts, (a, b) => compareByCount(typeCounts, a, b));
    addCountedOptions(tagSelect, tagCounts, (a, b) => compareByCount(tagCounts, a, b));

    const cards = Array.from(list.querySelectorAll(".publication-item"));
    const applyFilters = () => {
        const authorQuery = authorInput.value.trim().toLocaleLowerCase();
        let visibleCount = 0;

        cards.forEach(card => {
            const matches = card.dataset.authors.includes(authorQuery)
                && (!venueSelect.value || card.dataset.venue.split("|").includes(venueSelect.value.toLocaleLowerCase()))
                && (!yearSelect.value || card.dataset.year === yearSelect.value)
                && (!typeSelect.value || card.dataset.type.split("|").includes(typeSelect.value.toLocaleLowerCase()))
                && (!tagSelect.value || card.dataset.tags.split("|").includes(tagSelect.value.toLocaleLowerCase()));

            card.hidden = !matches;
            if (matches) visibleCount += 1;
        });

        groups.forEach(group => {
            const hasVisibleCards = group.querySelector(".publication-item:not([hidden])");
            group.hidden = !hasVisibleCards;
        });
        emptyMessage.hidden = visibleCount > 0;
    };

    authorInput.addEventListener("input", applyFilters);
    [venueSelect, yearSelect, typeSelect, tagSelect].forEach(select => select.addEventListener("change", applyFilters));
    applyFilters();
}
