let currentArtwork = null;

document.addEventListener("DOMContentLoaded", async () => {
    const accessionId = window.location.pathname.split("/").pop();

    try {    
        const response = await fetch(`/api/curator/artwork/${accessionId}`);

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

        document.getElementById("style").textContent = 
            artwork.style ?? "";

        document.getElementById("period").textContent =
            artwork.period ?? "";        

        document.getElementById("imageURL").textContent = 
            artwork.imageURL ?? "";

        const image = document.getElementById("artwork-image");
        if (artwork.imageURL) {
            image.src = artwork.imageURL;
            image.alt = artwork.title || "Artwork";
            image.hidden = false;
        }

        const deleteButton = document.getElementById("delete-artwork-button");
        deleteButton.hidden = false;
        deleteButton.addEventListener("click", confirmDeleteArtwork);
    } catch (error) {
        document.getElementById("detail-error").hidden = false;
    }
});

async function confirmDeleteArtwork() {
    const confirmed = window.confirm(
        `Delete ${currentArtwork.title}?`
    );

    if (!confirmed) {
        return;
    }

    await deleteArtwork();
}

async function deleteArtwork() {
    try {
        const response = await fetch(
            `/api/curator/artwork/${currentArtwork.artworkId}`,
            {
                method: "DELETE"
            } 
        );

        if (response.status === 204) {
            window.location.href = "/curator/artwork";
            return;
        }

        if (response.status === 409) {
            const error = await response.json();

            alert(error.error);

            location.reload();
            return;
        }

        if (response.status === 404) {
            alert("Artwork not found");
            return;   
        }
    } catch (error) {
        alert("Unable to delete artwork. Please try again.");
    }
}