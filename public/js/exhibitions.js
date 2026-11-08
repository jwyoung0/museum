let allExhibitions = [];
const pageSize = 10;
let currentPage = 1;
let visibleExhibitions = [];

document.addEventListener("DOMContentLoaded", () => {
    loadExhibitions();

    document
        .getElementById("visitor-exhibition-search")
        .addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                handleSearch();
            }
        });

    document
        .getElementById("search-exhibition-button")
        .addEventListener("click", handleSearch);

    document
        .getElementById("search-exhibition-field")
        .addEventListener("change", handleSearch);

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
        if (!response.ok) {
            throw new Error(`Failed to load exhibitions: ${response.status}`);
        }

        allExhibitions = await response.json();
        visibleExhibitions = allExhibitions;
        currentPage = 1;
        document.getElementById("exhibitions-error").hidden = true;
        displayExhibitionsPage();
    } catch (error) {
        console.error("Failed to load exhibitions.", error);
        document.getElementById("exhibitions-error").hidden = false;
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
    const pageCount = Math.ceil(visibleExhibitions.length / pageSize);
    const previousButton =
        document.getElementById("previous-page-button");
    const nextButton =
        document.getElementById("next-page-button");
    const pageStatus =
        document.getElementById("page-status");

    previousButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= pageCount;
    pageStatus.textContent = pageCount === 0
        ? "Page 0 of 0"
        : `Page ${currentPage} of ${pageCount}`;
}

function displayExhibitions(exhibitions) {
    const results = document.getElementById("exhibitions-results");
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
        link.href = `/exhibition-detail/${exhibition.exhibitionId}`;

        const title = document.createElement("h3");
        title.textContent =
            exhibition.exhibitionName || "Untitled Exhibition";
        link.append(title);

        const dates = document.createElement("p");
        if (exhibition.startDate && exhibition.endDate) {
            dates.textContent =
                `${formatDate(exhibition.startDate)} - ` +
                formatDate(exhibition.endDate);
        }

        const scheduledStatus = document.createElement("p");
        scheduledStatus.textContent = getScheduledStatus(exhibition);

        card.append(link, dates, status);
        results.append(card);
    }

    document.getElementById("search-empty-state").hidden =
        visibleExhibitions.length > 0;
}

function handleSearch() {
    const query = document
        .getElementById("visitor-exhibition-search")
        .value
        .trim()
        .toLowerCase();
    const selectedField = document
        .getElementById("search-exhibition-field")
        .value;


    visibleExhibitions = allExhibitions.filter((exhibition) => {
        const matchesQuery =
            !query ||
            exhibition.exhibitionName?.toLowerCase().includes(query) ||
            exhibition.description?.toLowerCase().includes(query);
        const matchesScheduledStatus =
            !selectedField ||
            getScheduledStatus(exhibition) === selectedField;

        return matchesQuery && matchesScheduledStatus;
    });

    currentPage = 1;
    displayExhibitionsPage();
}

function formatExhibitionStatus(status) {
    const labels = {
        current: "Current",
        upcoming: "Upcoming",
        past: "Past"
    };
    return labels[status] || "Status unavailable";
}

function formatDate(value) {
    const datePart = String(value).slice(0, 10);
    const [year, month, day] = datePart.split("-").map(Number);
    return Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)
        ? "Date unavailable"
        : new Date(year, month - 1, day).toLocaleDateString();
}

function getScheduledStatus(exhibition) {
    if (exhibition.startDate && exhibition.endDate) {
            const today = new Date().toISOString().slice(0, 10);
            
            const startDate = exhibition.startDate?.slice(0, 10);
            const endDate = exhibition.endDate?.slice(0, 10);
        
            if (endDate < today ) {
                return "past";
            } else if (startDate > today ) {
                return "upcoming";
            } else {
                return "current";
            } 
        } else {
                return "—";
    }
}