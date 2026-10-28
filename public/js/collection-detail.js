let collectionArtwork = [];
let visibleArtwork = [];

document.addEventListener("DOMContentLoaded", () => {
    loadCollection();

    document
        .getElementById("search-artwork-button")
        .addEventListener("click", handleSearch);

    document
        .getElementById("collection-artwork-search")
        .addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                handleSearch();
            }
        });
});

async function loadCollection() {
    const collectionId = window.location.pathname.split("/").pop();

    try {
        const [collectionResponse, artworkResponse] = await Promise.all([
            fetch(`/api/collections/${collectionId}`),
            fetch("/api/artwork")
        ]);

        if (!collectionResponse.ok) {
            throw new Error(
                `Failed to load collection: ${collectionResponse.status}`
            );
        }
        if (!artworkResponse.ok) {
            throw new Error(
                `Failed to load artwork: ${artworkResponse.status}`
            );
        }

        const [collection, artwork] = await Promise.all([
            collectionResponse.json(),
            artworkResponse.json()
        ]);

        document.getElementById("collection-name").textContent =
            collection.collectionName || "Untitled Collection";
        document.getElementById("collection-description").textContent =
            collection.description || "";

        collectionArtwork = artwork.filter(
            (item) => String(item.collectionId) === collectionId
        );
        visibleArtwork = collectionArtwork;
        displayArtwork();
    } catch (error) {
        console.error("Failed to load collection.", error);
        document.getElementById("collection-detail-error").hidden = false;
    }
}

function handleSearch() {
    const query = document
        .getElementById("collection-artwork-search")
        .value
        .trim()
        .toLowerCase();
    const selectedField = document
        .getElementById("search-artwork-field")
        .value;

    visibleArtwork = collectionArtwork.filter((artwork) => {
        const searchableValues = selectedField
            ? [artwork[selectedField]]
            : [artwork.title, artwork.artist];

        return searchableValues.some((value) =>
            value?.toLowerCase().includes(query)
        );
    });
    displayArtwork();
}

function displayArtwork() {
    const results = document.getElementById("artwork-results");
    results.replaceChildren();

    for (const artwork of visibleArtwork) {
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
        link.append(title);

        const artist = document.createElement("p");
        artist.textContent = artwork.artist || "Unknown artist";

        const year = document.createElement("p");
        year.textContent = artwork.creationDate || "Unknown date";

        card.append(link, artist, year);
        results.append(card);
    }

    document.getElementById("collection-artwork-empty-state").hidden =
        visibleArtwork.length > 0;
}
