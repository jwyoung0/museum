let allExhibitions = [];

document.addEventListener("DOMContentLoaded", () => {
    loadExhibitions();

    document.addEventListener("keydown", (event) => {
        if (
            event.key === "Enter"
        ) {
            handleSearch();
        }
    });

    document
        .getElementById("search-exhibitions-button")
        .addEventListener("click", handleSearch)
});


async function loadExhibitions() {
    try {
        const response = await fetch("/api/exhibitions");

        allExhibitions = await response.json();

        displayExhibitions(allExhibitions);

    } catch (error) {
        console.error("Failed to load exhibitions.", error);
    }
}

function displayExhibitions(exhibitions) {
    const results = document.getElementById("exhibition-results");
    results.replaceChildren();

    for (const exhibition of exhibitions) {
        const card = document.createElement("article");
        card.className = "exhibition-card";

        if (exhibition.imageURL) {
            const image = document.createElement("img");
            image.src = exhibition.imageURL;
            image.alt = exhibition.exhibitionName || "Exhibition";
            image.loading = "lazy";
            card.append(image);
        }

        const link = document.createElement("a");
        link.href = exhibition.url;

        const exhibitionName = document.createElement("h3");
        exhibitionName.textContent = exhibition.exhibitionName || "Untitled";

        link.appendChild(exhibitionName);

        const timeFrame = document.createElement("p");
        timeFrame.textContent = buildTimeFrame(exhibition) || "Unknown date";

        card.append(link, timeFrame);
        results.append(card);
    }
}

function handleSearch(event) {
    const query = document
        .getElementById("visitor-exhibitions-search")
        .value
        .trim()
        .toLowerCase();

    const filteredExhibitions =
        allArtwork.filter((exhibition) => 
            exhibition.current?.toLowerCase().includes(query) ||
            exhibition.upcoming?.toLowerCase().includes(query) ||
            exhibition.past?.toLowerCase().includes(query)       
        );

    const searchEmptyState = document
        .getElementById("search-empty-state");

    if (query && filteredArtwork.length === 0) {
        searchEmptyState.hidden = false;
    } else {
        searchEmptyState.hidden = true;
    }

    displayExhibitions(filteredExhibitions);
}

function buildTimeFrame(exhibition) {
    const start = exhibition.start ?? "?";
    const end = exhibition.end ?? "";

    return end
        ? `${start}-${end}`
        : `${start}-`;
}