let currentExhibition = null;
let exhibitionId;
let allArtwork = [];
let assignedArtworkIds = new Set();
let artworkRequestId = 0;
let currentModalArtwork = null;

document.addEventListener("DOMContentLoaded", async () => {
    exhibitionId = window.location.pathname.split("/").pop();
    const artworkModal = document.getElementById("artwork-detail-modal");

    document
        .getElementById("exhibition-artworks-table-body")
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

    try {
        const response = await fetch(
            `/api/curator/exhibitions/${exhibitionId}`
        );

        if (!response.ok) {
            throw new Error(
                `Failed to load exhibition: ${response.status}`
            );
        }

        const exhibition = await response.json();
        
        currentExhibition = exhibition;

        document.getElementById("exhibitionName").textContent =
            exhibition.exhibitionName;

        document.getElementById("status").textContent =
            exhibition.status ?? "Unknown";

        document.getElementById("startDate").textContent =
            exhibition.startDate?.slice(0, 10) ?? "Unknown";

        document.getElementById("endDate").textContent =
            exhibition.endDate?.slice(0, 10) ?? "Unknown";

        document.getElementById("description").textContent =
            exhibition.description ?? "—";

        const deleteButton = document.getElementById("delete-exhibition-button");
        deleteButton.hidden = false;
        deleteButton.addEventListener("click", confirmDeleteExhibition);
    } catch (error) {
        console.error(
            "Unable to load exhibition:",
            error
        );

        document.getElementById(
            "detail-error"
        ).hidden = false;

        return;
    }

    document
        .getElementById("artwork-search")
        .addEventListener(
            "input",
            renderArtworkSearchResults
        );

    await Promise.all([
        loadArtworkOptions(),
        loadExhibitionArtworks()
    ]);
});

async function loadArtworkOptions() {
    try {
        const response = await fetch(
            "/api/curator/artwork"
        );

        if (!response.ok) {
            throw new Error(
                `Failed to load artwork: ${response.status}`
            );
        }

        allArtwork = await response.json();

        renderArtworkSearchResults();
    } catch (error) {
        console.error(
            "Unable to load artwork options:",
            error
        );

        document.getElementById(
            "artwork-message"
        ).textContent =
            "Unable to load artwork options.";
    }
}

async function loadExhibitionArtworks() {
    const errorState = document.getElementById(
        "artworks-error-state"
    );

    errorState.hidden = true;

    try {
        const response = await fetch(
            `/api/curator/exhibitions/${exhibitionId}/artworks`
        );

        if (!response.ok) {
            throw new Error(
                `Failed to load exhibition artwork: ${response.status}`
            );
        }

        const artworks = await response.json();

        assignedArtworkIds = new Set(
            artworks.map((artwork) =>
                String(artwork.accessionId)
            )
        );

        renderExhibitionArtworks(artworks);

        renderArtworkSearchResults();
    } catch (error) {
        console.error(
            "Unable to load exhibition artwork:",
            error
        );

        errorState.hidden = false;
    }
}

function renderExhibitionArtworks(artworks) {
    const tableBody = document.getElementById(
        "exhibition-artworks-table-body"
    );

    const emptyState = document.getElementById(
        "artworks-empty-state"
    );

    tableBody
        .querySelectorAll(
            "tr:not(#artworks-empty-state):not(#artworks-error-state)"
        )
        .forEach((row) => row.remove());

    emptyState.hidden = artworks.length > 0;

    for (const artwork of artworks) {
        const row = document.createElement("tr");

        for (const value of [
            artwork.title,
            artwork.artist,
            artwork.collection
        ]) {
            const cell = document.createElement("td");

            cell.textContent = value ?? "";

            row.appendChild(cell);
        }

        const actionsCell =
            document.createElement("td");

        const viewButton = document.createElement("button");
        viewButton.type = "button";
        viewButton.textContent = "View";
        viewButton.dataset.artworkView = "";
        viewButton.dataset.artworkId = artwork.accessionId;

        const removeButton =
            document.createElement("button");

        removeButton.type = "button";
        removeButton.className = "button-danger";
        removeButton.textContent = "Remove";

        removeButton.addEventListener(
            "click",
            () =>
                removeArtwork(
                    artwork.accessionId,
                    removeButton
                )
        );

        actionsCell.append(viewButton, removeButton);

        row.appendChild(actionsCell);

        tableBody.insertBefore(
            row,
            emptyState
        );
    }
}

function renderArtworkSearchResults() {
    const searchTerm = document
        .getElementById("artwork-search")
        .value
        .trim()
        .toLowerCase();

    const container = document.getElementById(
        "artwork-search-results"
    );

    container.replaceChildren();

    if (searchTerm.length < 2) {
        document.getElementById(
            "artwork-message"
        ).textContent =
            "Type at least 2 characters.";

        return;
    }

    const results = allArtwork
        .filter(
            (artwork) =>
                !assignedArtworkIds.has(
                    String(artwork.accessionId)
                )
        )
        .filter((artwork) =>
            [
                artwork.title ?? "",
                artwork.artist ?? ""
            ].some((value) =>
                value
                    .toLowerCase()
                    .includes(searchTerm)
            )
        )
        .slice(0, 15);

    document.getElementById(
        "artwork-message"
    ).textContent =
        `${results.length} artwork found`;

    if (!results.length) {
        container.textContent =
            "No matching artwork found.";

        return;
    }

    results.forEach((artwork) => {
        const row =
            document.createElement("div");

        row.className =
            "artwork-search-result";

        row.style.display = "flex";
        row.style.justifyContent =
            "space-between";
        row.style.alignItems = "center";
        row.style.padding = "12px";
        row.style.borderBottom =
            "1px solid var(--line)";

        const info =
            document.createElement("div");

        info.innerHTML = `
            <strong>${artwork.title}</strong><br>
            ${artwork.artist ?? ""}
        `;

        const button =
            document.createElement("button");

        button.type = "button";
        button.textContent = "Add";

        button.addEventListener(
            "click",
            () => addArtwork(
                artwork.accessionId
            )
        );

        row.append(info, button);

        container.appendChild(row);
    });
}

async function addArtwork(accessionId) {
    try {
        const response = await fetch(
            `/api/curator/exhibitions/${exhibitionId}/artworks`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    accessionId
                })
            }
        );

        if (!response.ok) {
            const result =
                await response
                    .json()
                    .catch(() => ({}));

            throw new Error(
                result.error ??
                `Unable to add artwork (${response.status})`
            );
        }

        await loadExhibitionArtworks();

        renderArtworkSearchResults();
    } catch (error) {
        console.error(
            "Unable to add artwork:",
            error
        );

        window.alert(
            error.message ??
            "Unable to add artwork."
        );
    }
}

async function removeArtwork(
    accessionId,
    removeButton
) {
    removeButton.disabled = true;

    try {
        const response = await fetch(
            `/api/curator/exhibitions/${exhibitionId}/artworks/${accessionId}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            const result =
                await response
                    .json()
                    .catch(() => ({}));

            throw new Error(
                result.error ??
                `Unable to remove artwork (${response.status})`
            );
        }

        if (
            String(currentExhibition?.representativeArtwork) ===
            String(accessionId)
        ) {
            currentExhibition.representativeArtwork = null;
        }

        await loadExhibitionArtworks();
    } catch (error) {
        console.error(
            "Unable to remove artwork:",
            error
        );

        window.alert(
            error.message ??
            "Unable to remove artwork."
        );
    } finally {
        removeButton.disabled = false;
    }
}

async function handleArtworkView(event) {
    const viewButton = event.target.closest("button[data-artwork-view]");
    if (!viewButton) {
        return;
    }

    const requestId = ++artworkRequestId;
    const artworkId = viewButton.dataset.artworkId;
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
    if (!currentExhibition || !currentModalArtwork) {
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
            `/api/curator/exhibitions/${currentExhibition.exhibitionId}/representative-artwork`,
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

        const updatedExhibition = await response.json();
        currentExhibition = {
            ...currentExhibition,
            ...updatedExhibition
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
        currentExhibition?.representativeArtwork ===
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

async function confirmDeleteExhibition() {
    const confirmed = window.confirm(
        `Delete ${currentExhibition.exhibitionName}?`
    );

    if (!confirmed) {
        return;
    }

    await handleDeleteExhibition();
}

async function handleDeleteExhibition() {
    try {
        const response = await fetch(
            `/api/curator/exhibitions/${currentExhibition.exhibitionId}`,
            {
                method: "DELETE"
            }
        );

        if (response.status === 200) {
            window.location.href = "/curator/exhibitions";
            return;
        }

        if (response.status === 204) {
            window.location.href = "/curator/exhibitions";
            return;
        }

        if (response.status === 409) {
            const error = await response.json();
            window.alert(error.error);
            await loadExhibition();
            return;
        }

        if (response.status === 404) {
            window.alert("Exhibition not found.");
            return;
        }

        throw new Error(`Unable to delete exhibition: ${response.status}`);
    } catch (error) {
        console.error("Unable to delete exhibition:", error);
        window.alert("Unable to delete exhibition. Please try again.");
    }
}
