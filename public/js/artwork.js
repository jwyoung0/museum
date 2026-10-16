let allArtwork = [];

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
});

async function loadArtwork() {
    try {
        const response = await fetch("/api/artwork");

        allArtwork = await response.json();

        displayArtwork(allArtwork);

    } catch (error) {
        console.error("Failed to load artwork.", error);
    }
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
        link.href = artwork.url;

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

    displayArtwork(filteredArtwork);
}
