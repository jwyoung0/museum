let currentCollection = null;
let allArtworks = [];
let artworkRequestId = 0;
let currentModalArtwork = null;

document.addEventListener("DOMContentLoaded", async () => {
    const artworkModal = document.getElementById("artwork-detail-modal");

    document
        .getElementById("artworks-table-body")
        .addEventListener("click", handleArtworkView);
    document
        .getElementById("close-artwork-modal")
        .addEventListener("click", () => artworkModal.close());
    artworkModal.addEventListener("close", () => {
        artworkRequestId += 1;
        currentModalArtwork = null;
    });
    document
        .getElementById("set-representative-artwork")
        .addEventListener("click", setRepresentativeArtwork);

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
        
        await loadArtworks();

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
        const response = await fetch(`/api/curator/collection/${currentCollection.collectionId}/artworks`);
        if (!response.ok) {
            throw new Error(`Failed to load artworks: ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data.artworks)) {
            throw new Error("Invalid artworks response");
        }

        allArtworks = await data.artworks;
        document.getElementById("error-state").hidden = true;
        renderArtworks();
    } catch (error) {
        console.error("Unable to load collections:", error);
        document.getElementById("error-state").hidden = false;
    }

}

function renderArtworks(artworks = allArtworks) {
    const tbody = document.getElementById("artworks-table-body");
    const emptyState = document.getElementById("empty-artworks");

    tbody.innerHTML = "";

    if (artworks.length === 0) {
        emptyState.hidden = false;
        return;
    }

    emptyState.hidden = true;

    for (const artwork of artworks) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${artwork.title}</td>
            <td>${artwork.artist ?? "Unknown"}</td>
            <td>${artwork.creationDate ?? ""}</td>
            <td>
                <button
                    type="button"
                    data-artwork-id="${artwork.accessionId}"
                >
                    View
                </button>
            </td>
        `;

        tbody.appendChild(row);
    }
}

async function handleArtworkView(event) {
    const viewButton = event.target.closest("button[data-artwork-id]");
    if (!viewButton) {
        return;
    }

    const artworkId = viewButton.dataset.artworkId;
    const requestId = ++artworkRequestId;
    const artworkModal = document.getElementById("artwork-detail-modal");
    const loading = document.getElementById("modal-artwork-loading");
    const error = document.getElementById("modal-artwork-error");
    const content = document.getElementById("modal-artwork-content");

    currentModalArtwork = null;
    loading.hidden = false;
    error.hidden = true;
    content.hidden = true;
    resetRepresentativeArtworkMessages();
    artworkModal.showModal();

    try {
        const response = await fetch(`/api/curator/artwork/${artworkId}`);
        if (!response.ok) {
            throw new Error(`Failed to load artwork: ${response.status}`);
        }

        const artwork = await response.json();
        if (requestId !== artworkRequestId) {
            return;
        }

        displayArtworkDetails(artwork);
        currentModalArtwork = artwork;
        updateRepresentativeArtworkButton();
        loading.hidden = true;
        content.hidden = false;
    } catch (loadError) {
        if (requestId !== artworkRequestId) {
            return;
        }

        console.error("Unable to load artwork details:", loadError);
        loading.hidden = true;
        error.hidden = false;
    }
}

async function setRepresentativeArtwork() {
    if (!currentCollection || !currentModalArtwork) {
        return;
    }

    const artwork = currentModalArtwork;
    const button = document.getElementById("set-representative-artwork");
    const status = document.getElementById("representative-artwork-status");
    const error = document.getElementById("representative-artwork-error");

    button.disabled = true;
    status.hidden = true;
    error.hidden = true;

    try {
        const response = await fetch(
            `/api/curator/collections/${currentCollection.collectionId}/representative-artwork`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    accessionId: artwork.accessionId
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                `Unable to set representative artwork: ${response.status}`
            );
        }

        const updatedCollection = await response.json();
        currentCollection = {
            ...currentCollection,
            ...updatedCollection
        };

        if (currentModalArtwork?.accessionId === artwork.accessionId) {
            updateRepresentativeArtworkButton();
            status.textContent =
                `${artwork.title} is now the representative artwork.`;
            status.hidden = false;
        }
    } catch (requestError) {
        console.error("Unable to set representative artwork:", requestError);
        if (currentModalArtwork?.accessionId === artwork.accessionId) {
            error.textContent =
                "Unable to set representative artwork. Please try again.";
            error.hidden = false;
        }
    } finally {
        if (currentModalArtwork?.accessionId === artwork.accessionId) {
            updateRepresentativeArtworkButton();
        }
    }
}

function updateRepresentativeArtworkButton() {
    const button = document.getElementById("set-representative-artwork");
    const isRepresentative =
        currentCollection?.representativeArtwork ===
        currentModalArtwork?.accessionId;

    button.disabled = isRepresentative;
    button.textContent = isRepresentative
        ? "Representative Artwork"
        : "Make Representative Artwork";
}

function resetRepresentativeArtworkMessages() {
    document.getElementById("representative-artwork-status").hidden = true;
    document.getElementById("representative-artwork-error").hidden = true;
}

function displayArtworkDetails(artwork) {
    document.getElementById("modal-artwork-title").textContent =
        artwork.title || "Artwork Details";

    const fields = {
        "modal-artwork-name": artwork.title,
        "modal-artwork-artist": artwork.artist,
        "modal-artwork-creation-date": artwork.creationDate,
        "modal-artwork-category": artwork.category,
        "modal-artwork-medium": artwork.medium,
        "modal-artwork-dimensions": artwork.dimensions,
        "modal-artwork-collection": artwork.collection,
        "modal-artwork-style": artwork.style,
        "modal-artwork-period": artwork.period,
        "modal-artwork-image-url": artwork.imageURL
    };

    for (const [id, value] of Object.entries(fields)) {
        document.getElementById(id).textContent = value ?? "";
    }

    const image = document.getElementById("modal-artwork-image");
    if (artwork.imageURL) {
        image.src = artwork.imageURL;
        image.alt = artwork.title || "Artwork";
        image.hidden = false;
    } else {
        image.removeAttribute("src");
        image.alt = "";
        image.hidden = true;
    }
}
