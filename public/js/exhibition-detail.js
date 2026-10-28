let exhibitionArtwork = [];

document.addEventListener("DOMContentLoaded", () => {
    loadExhibition();

    document
        .getElementById("exhibition-artwork-search")
        .addEventListener("input", renderExhibitionArtwork);
});

async function loadExhibition() {
    const exhibitionId = window.location.pathname.split("/").pop();

    try {
        const [exhibitionResponse, artworkResponse] = await Promise.all([
            fetch(`/api/exhibitions/${exhibitionId}`),
            fetch(`/api/exhibitions/${exhibitionId}/artworks`)
        ]);

        if (!exhibitionResponse.ok) {
            throw new Error(
                `Failed to load exhibition: ${exhibitionResponse.status}`
            );
        }
        if (!artworkResponse.ok) {
            throw new Error(
                `Failed to load exhibition artwork: ${artworkResponse.status}`
            );
        }

        const [exhibition, artworks] = await Promise.all([
            exhibitionResponse.json(),
            artworkResponse.json()
        ]);

        document.getElementById("exhibition-name").textContent =
            exhibition.exhibitionName || "Untitled Exhibition";
        document.getElementById("exhibition-status").textContent =
            formatExhibitionStatus(exhibition.status);
        document.getElementById("exhibition-start-date").textContent =
            formatDate(exhibition.startDate);
        document.getElementById("exhibition-end-date").textContent =
            formatDate(exhibition.endDate);
        document.getElementById("exhibition-description").textContent =
            exhibition.description || "No description available.";

        exhibitionArtwork = artworks;
        renderExhibitionArtwork();
    } catch (error) {
        console.error("Unable to load exhibition details.", error);
        document.getElementById("exhibition-detail-error").hidden = false;
        document.getElementById("exhibition-artwork-error").hidden = false;
    }
}

function renderExhibitionArtwork() {
    const query = document
        .getElementById("exhibition-artwork-search")
        .value
        .trim()
        .toLowerCase();
    const filteredArtwork = exhibitionArtwork.filter((artwork) =>
        artwork.title?.toLowerCase().includes(query) ||
        artwork.artist?.toLowerCase().includes(query)
    );
    const results = document.getElementById("exhibition-artworks-results");

    results.replaceChildren();
    for (const artwork of filteredArtwork) {
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

        const creationDate = document.createElement("p");
        creationDate.textContent = artwork.creationDate || "Unknown date";

        card.append(link, artist, creationDate);
        results.append(card);
    }

    document.getElementById("exhibition-artwork-empty-state").hidden =
        filteredArtwork.length > 0;
}

function formatExhibitionStatus(status) {
    const labels = {
        active: "Current",
        upcoming: "Upcoming",
        archived: "Past"
    };
    return labels[status?.toLowerCase()] || "Status unavailable";
}

function formatDate(value) {
    if (!value) {
        return "Date unavailable";
    }

    const datePart = String(value).slice(0, 10);
    const [year, month, day] = datePart.split("-").map(Number);
    return Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)
        ? "Date unavailable"
        : new Date(year, month - 1, day).toLocaleDateString();
}
