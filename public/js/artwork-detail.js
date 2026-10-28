let currentArtwork = null;

document.addEventListener("DOMContentLoaded", async () => {
    const accessionId = window.location.pathname.split("/").pop();

    try {    
        const key = "artworkAnalyticsSessionId";
        let analyticsSessionId = sessionStorage.getItem(key);

        if (!analyticsSessionId) {
            analyticsSessionId = crypto.randomUUID();
            sessionStorage.setItem(key, analyticsSessionId);
        }

        const response = await fetch(`/api/artwork-detail/${accessionId}`, {
            headers: {
                "X-Analytics-Session-Id": analyticsSessionId
            }
        });

        if (!response.ok) {
            throw new Error("Failed to load artwork");
        }

        const artwork = await response.json();

        currentArtwork = artwork;

        document.getElementById("artwork-name").textContent = artwork.title;

        document.getElementById("artworkName").textContent = 
            artwork.title;

        document.getElementById("artist").textContent =
            artwork.artist;

        document.getElementById("creationDate").textContent = 
            artwork.creationDate;

        document.getElementById("category").textContent =
            artwork.category;

        document.getElementById("medium").textContent = 
            artwork.medium;

        document.getElementById("dimensions").textContent =
            artwork.dimensions ?? "";

        document.getElementById("collection").textContent =
            artwork.collection;

        const image = document.getElementById("artwork-image");
        if (artwork.imageURL) {
            image.src = artwork.imageURL;
            image.alt = artwork.title || "Artwork";
            image.hidden = false;
        }
    } catch (error) {
        document.getElementById("detail-error").hidden = false;
    }
});