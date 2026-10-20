let allArtwork = [];

const pageSize = 10;
let currentPage = 1;
let visibleArtwork = [];

document.addEventListener("DOMContentLoaded", () => {
    loadArtwork();
        
    document.addEventListener("keydown", (event) => {
            if (
                event.key === "Enter" 
            ) {
                handleSearch();
            }
    });

    document
        .getElementById("search-artwork-button")
        .addEventListener("click", handleSearch);

    document
        .getElementById("previous-page-button")
        .addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage -= 1;
                displayArtworkPage();
            }
        });

    document
        .getElementById("next-page-button")
        .addEventListener("click", () => {
            const pageCount = Math.ceil(visibleArtwork.length / pageSize);

            if (currentPage < pageCount) {
                currentPage += 1;
                displayArtworkPage();
            }
        });
});

async function loadArtwork() {
    try {
        const response = await fetch("/api/artwork");

        allArtwork = await response.json();

        visibleArtwork = allArtwork;
        currentPage = 1;
        displayArtworkPage();

    } catch (error) {
        console.error("Failed to load artwork.", error);
    }
}

function displayArtworkPage() {
    const startIndex = (currentPage - 1) * pageSize;
    const pageArtwork = visibleArtwork.slice(
        startIndex,
        startIndex + pageSize
    );

    displayArtwork(pageArtwork);
    updatePaginationControls();
}

function updatePaginationControls() {
    const pageCount = Math.ceil(visibleArtwork.length / pageSize);
    const previousButton = document.getElementById("previous-page-button");
    const nextButton = document.getElementById("next-page-button");
    const pageStatus = document.getElementById("page-status");

    previousButton.disabled = currentPage <= 1;
    nextButton.disabled = currentPage >= pageCount;

    pageStatus.textContent = pageCount === 0
        ? "Page 0 of 0"
        : `Page ${currentPage} of ${pageCount}`;
}

function displayArtwork(artworks) {
    const results = document.getElementById("artwork-results");
    results.replaceChildren();

    for (const artwork of artworks) {
        const card = document.createElement("article");
        card.className = "artwork-card";

        if (artwork.imageURL) {
            const image = document.createElement("img");
            image.src = artwork.imageURL;
            image.alt = artwork.title || "Artwork";
            image.loading = "lazy";
            card.append(image);
        }

        const link = document.createElement("a");
        link.href = `/artwork-detail/${artwork.accessionId}`;

        const title = document.createElement("h3");
        title.textContent = artwork.title || "Untitled";

        link.appendChild(title);

        const artist = document.createElement("p");
        artist.textContent = artwork.artist || "Unknown artist";

        const year = document.createElement("p");
        year.textContent = artwork.creationDate || "Unknown date";

        card.append(link, artist, year);
        results.append(card);
    }
}

function handleSearch(event) {
    const query = document
        .getElementById("visitor-artwork-search")
        .value
        .trim()
        .toLowerCase();

    const filteredArtwork =
        allArtwork.filter((artwork) => 
            artwork.title?.toLowerCase().includes(query) ||
            artwork.artist?.toLowerCase().includes(query)        
        );

    const searchEmptyState = document
        .getElementById("search-empty-state");

    if (query && filteredArtwork.length === 0) {
        searchEmptyState.hidden = false;
    } else {
        searchEmptyState.hidden = true;
    }

    visibleArtwork = filteredArtwork;
    currentPage = 1;
    displayArtworkPage();
}
