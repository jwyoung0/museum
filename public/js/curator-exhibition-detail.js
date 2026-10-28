let exhibitionId;
let allArtwork = [];
let assignedArtworkIds = new Set();

document.addEventListener("DOMContentLoaded", async () => {
    exhibitionId = window.location.pathname.split("/").pop();

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

        actionsCell.appendChild(removeButton);

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