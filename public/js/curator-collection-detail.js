let currentCollection = null;
let allArtworks = [];

document.addEventListener("DOMContentLoaded", async () => {
    const collectionId = window.location.pathname.split("/").pop();

    try {
        const response = await fetch(
            `/api/curator/collections/${collectionId}`
        );

        if (!response.ok) {
            throw new Error("Failed to load collection");
        }

        const collection = await response.json();

        currentCollection = collection;

        document.getElementById("collection-name").textContent =
            collection.collectionName;
        document.getElementById("collectionName").textContent =
            collection.collectionName;
        document.getElementById("description").textContent =
            collection.description ?? "";
        document.getElementById("artwork-count").textContent =
            collection.artworkCount;

        const deleteButton = document.getElementById("delete-collection-button");
        deleteButton.hidden = false;
        deleteButton.addEventListener("click", confirmDeleteCollection);
    } catch (error) {
        console.error("Unable to load collection:", error);
        document.getElementById("detail-error").hidden = false;
    }
});

async function confirmDeleteCollection() {
    if (currentCollection.artworkCount > 0) {
        window.alert(
            `${currentCollection.collectionName} is associated with ` +
            `${currentCollection.artworkCount} artworks.\n\n` +
            "Reassign or remove those artworks before deleting."
        );
        return;
    }

    const confirmed = window.confirm(
        `Delete ${currentCollection.collectionName}?`
    );

    if (!confirmed) {
        return;
    }

    await handleDeleteCollection();
}

async function handleDeleteCollection() {
    try {
        const response = await fetch(
            `/api/curator/collections/${currentCollection.collectionId}`,
            {
                method: "DELETE"
            }
        );

        if (response.status === 204) {
            window.location.href = "/curator/collections";
            return;
        }

        if (response.status === 409) {
            const error = await response.json();
            window.alert(error.error);
            await loadCollection();
            return;
        }

        if (response.status === 404) {
            window.alert("Collection not found.");
            return;
        }

        throw new Error(`Unable to delete collection: ${response.status}`);
    } catch (error) {
        console.error("Unable to delete collection:", error);
        window.alert("Unable to delete collection. Please try again.");
    }
}

async function loadCollection() {
    try {
        const response = await fetch(
            `/api/curator/collections/${currentCollection.collectionId}`
        );
        if (!response.ok) {
            throw new Error(`Failed to reload collection: ${response.status}`);
        }

        currentCollection = await response.json();
        document.getElementById("artwork-count").textContent =
            currentCollection.artworkCount;
    } catch (error) {
        console.error("Unable to refresh collection:", error);
        document.getElementById("detail-error").hidden = false;
    }
}

async function loadArtworks() {
    try {
        const response = await fetch(`/api/curator/collection-artworks/${currentCollection.collectionId}`);
        if (!response.ok) {
            throw new Error(`Failed to load artworks: ${response.status}`);
        }

        allArtworks = await response.json();
        document.getElementById("error-state").hidden = true;
        renderArtworks();
    } catch (error) {
        console.error("Unable to load collections:", error);
        document.getElementById("error-state").hidden = false;
    }

}

function renderArtworks(artworks) {

}