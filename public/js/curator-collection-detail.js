const { deleteCollection } = require("../../database/curator/collections");

let currentCollection = null;

document.addEventListener("DOMContentLoaded", async () => {
    const collectionId = window.location.pathname.split("/").pop();

    try {
        const response = await fetch(`/api/curator/collection/${collectionId}`);

        if (!response.ok) {
            throw new Error("Failed to load collection");
        }

        const collection = await response.json();

        currentCollection = collection;

        document.getElementById("collection-name").textContent = collection.collectionName;
        document.getElementById("collectionName").textContent = collection.collectionName;
        document.getElementById("description").textContent = collection.description;

        const image = document.getElementById("collection-image");
        if (collection.imageURL) {
            image.src = collection.imageURL;
            image.alt = collection.collectionName || "Collection";
            image.hidden = false;
        }

        const deleteButton = document.getElementById("delete-collection-button");
        deleteButton.hidden = false;
        deleteButton.addEventListener("click", confirmDeleteCollection);
    } catch (error) {
        document.getElementById("detail-error").hidden = false;
    }
});

async function confirmDeleteCollection() {
    const confirmed = window.confirm(
        `Delete ${currentCollection.title}?`
    );

    if (!confirmed) {
        return;
    }

    await deleteCollection();
}

async function deleteCollection() {
    try {
        const response = await fetch(
            `/api/curator/collection/${currentCollection.collectionId}`,
            {
                method: "DELETE"
            }
        );

        if (response.status === 204) {
            window.location.href = "/curator/collection";
            return;
        }

        if (response.status === 409) {
            const error = await response.json();

            alert(error.error);
            location.reload();
            return;
        }

        if (response.status === 404) {
            alert("Collection not found");
            return;
        }
    } catch (error) {
        alert("Unable to delete collection. Please try again.");
    }
}