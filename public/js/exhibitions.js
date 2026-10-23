let allExhibitions = [];
const pageSize = 10;
let currentPage = 1;
let visibleExhibitions = [];

document.addEventListener("DOMContentLoaded", () => {
    loadExhibitions();

    document.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            handleSearch();
        }
    });

    document
        .getElementById("search-exhibition-button")
        .addEventListener("click", handleSearch);

    document
        .getElementById("previous-page-button")
        .addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage -= 1;
                displayExhibitionsPage();
            }
        });

    document
        .getElementById("next-page-button")
        .addEventListener("click", () => {
            const pageCount = Math.ceil(
                visibleExhibitions.length / pageSize
            );

            if (currentPage < pageCount) {
                currentPage += 1;
                displayExhibitionsPage();
            }
        });
});

async function loadExhibitions() {
    try {
        const response = await fetch("/api/exhibitions");
        allExhibitions = await response.json();

        visibleExhibitions = allExhibitions;
        currentPage = 1;

        displayExhibitionsPage();
    } catch (error) {
        console.error("Failed to load exhibitions.", error);
    }
}

function displayExhibitionsPage() {
    const startIndex = (currentPage - 1) * pageSize;

    const pageExhibitions = visibleExhibitions.slice(
        startIndex,
        startIndex + pageSize
    );

    displayExhibitions(pageExhibitions);
    updatePaginationControls();
}

function updatePaginationControls() {
    const pageCount = Math.ceil(
        visibleExhibitions.length / pageSize
    );

    const previousButton =
        document.getElementById("previous-page-button");

    const nextButton =
        document.getElementById("next-page-button");

    const pageStatus =
        document.getElementById("page-status");

    previousButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= pageCount;

    pageStatus.textContent =
        pageCount === 0
            ? "Page 0 of 0"
            : `Page ${currentPage} of ${pageCount}`;
}

function displayExhibitions(exhibitions) {
    const results =
        document.getElementById("exhibitions-results");

    results.replaceChildren();

    for (const exhibition of exhibitions) {
        const card = document.createElement("article");
        card.className = "exhibition-card";

        if (exhibition.imageURL) {
            const image = document.createElement("img");
            image.src = exhibition.imageURL;
            image.alt = exhibition.title || "Exhibition";
            image.loading = "lazy";
            card.append(image);
        }

        const link = document.createElement("a");
        link.href = exhibition.url;

        const title = document.createElement("h3");
        title.textContent =
            exhibition.exhibitionName || "Untitled Exhibition";

        link.appendChild(title);

        const dates = document.createElement("p");
        if (exhibition.startDate && exhibition.endDate) {
            const startDate = new Date(exhibition.startDate).toLocaleDateString();
            const endDate = new Date(exhibition.endDate).toLocaleDateString();
            dates.textContent = `${startDate} - ${endDate}`;
        }
            
        const status = document.createElement("p");
        status.textContent =
            exhibition.status || "Status unavailable";

        card.append(link, dates, status);

        results.append(card);
    }
}

function handleSearch() {
    const query = document
        .getElementById("visitor-exhibition-search")
        .value
        .trim()
        .toLowerCase();

    const selectedField = document
        .getElementById("search-exhibition-field")
        .value
        .toLowerCase();

    const filteredExhibitions = allExhibitions.filter(
        (exhibition) => {
            const matchesQuery =
                !query ||
                exhibition.title
                    ?.toLowerCase()
                    .includes(query);

            const matchesField =
                !selectedField ||
                exhibition.status
                    ?.toLowerCase() === selectedField;

            return matchesQuery && matchesField;
        }
    );

    const searchEmptyState =
        document.getElementById("search-empty-state");

    searchEmptyState.hidden =
        !(query || selectedField) ||
        filteredExhibitions.length > 0;

    visibleExhibitions = filteredExhibitions;
    currentPage = 1;

    displayExhibitionsPage();
}