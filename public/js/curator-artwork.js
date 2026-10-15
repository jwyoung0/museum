let allArtwork = [];
let availableArtists = [];

let artworkFormLoaded = false;
let lastFocusedElement = null;
let initialFormState = "";
let formDirty = false;

document.addEventListener("DOMContentLoaded", () => {
    loadArtwork();

    document
        .getElementById("artwork-search")
        .addEventListener("input", handleSearch);

    document
        .getElementById("add-artwork-button")
        .addEventListener("click", openArtworkDrawer);

    document
        .getElementById("close-artwork-drawer")
        .addEventListener("click", closeArtworkDrawer);
});

document.addEventListener("keydown", (event) => {
        if (
            event.key === "Escape" &&
            !document.getElementById("artwork-form-container").hidden
        ) {
            closeArtworkDrawer();
        }
});

window.addEventListener("beforeunload", (event) => {
    const drawerOpen = !document.getElementById("artwork-form-container").hidden;

    if (drawerOpen && formDirty) {
        event.preventDefault();
        event.returnValue = "";
    }
});

async function loadArtwork() {
    try{
        const response = await fetch("/api/curator/artwork");

        allArtwork = await response.json();

        renderArtwork(allArtwork);
    } catch (error) {
        document.getElementById("error-state").hidden = false;
    }
}

function renderArtwork(artworks) {
    const tableBody = document.getElementById("artwork-table-body");

    const searchEmptyState = document.getElementById("search-empty-state");
    
    tableBody.querySelectorAll("tr:not(#search-empty-state):not(#error-state)")
        .forEach((row) => row.remove());

    searchEmptyState.hidden = true;

    if (artworks.length === 0) {
        searchEmptyState.hidden = false;
        return;
    }

    artworks.forEach((artwork) => {
        tableBody.insertAdjacentHTML(
            "beforeend",
            `
            <tr>
                <td>
                    <a href="/curator/artwork/${artwork.accessionId}">
                        ${artwork.title}
                    </a>
                </td>
                <td>${artwork.artist}</td>
                <td>${artwork.creationDate}</td>
                <td>
                    <button
                        type="button"
                        class="view-artwork-button"
                        data-accession-Id="${artwork.accessionId}"
                    >
                        View
                    </button>

                    <button
                        class="edit-artwork-button"
                        data-accession-Id="${artwork.accessionId}">
                        Edit
                    </button>
                </td>
            </tr>
            `
        );
    });

    document
        .querySelectorAll(".view-artwork-button")
        .forEach((button) => {
            button.addEventListener("click", () => {
                window.location.assign(
                    `/curator/artwork/${button.dataset.accessionId}`
                );
            });
        });

    document
        .querySelectorAll(".edit-artwork-button")
        .forEach((button) => {
            button.addEventListener("click", 
                () => openArtworkDrawerForEdit(
                    button.dataset.accessionId
                )
            );
        });
}

function handleSearch(event) {
    const query = 
        event.target.value
            .trim()
            .toLowerCase();

    const filteredArtwork =
        allArtwork.filter((artwork) =>
            artwork.title?.toLowerCase().includes(query) ||
            artwork.artist?.toLowerCase().includes(query)
        );

    const searchEmptyState =
        document.getElementById("search-empty-state");

    if (query && filteredArtwork.length === 0) {
        searchEmptyState.hidden = false;
    } else {
        searchEmptyState.hidden = true;
    }

    renderArtwork(filteredArtwork);
}

async function loadArtworkFormContainer() {
    if (artworkFormLoaded) {
        return;
    }

    const response = await fetch("/components/artwork-form.html");

    if (!response.ok) {
        throw new Error(`Failed to load form: ${response.status}`);
    }

    const html = await response.text();

    document.getElementById("artwork-form-content").innerHTML = html;

    await loadArtworkLookups();

    attachArtworkFormHandler();

    artworkFormLoaded = true;
}

async function loadAvailableArtists() {
    const response = await fetch("/api/curator/artists");

    if (!response.ok) {
        throw new Error(`Failed to load artists: ${response.status}`);
    }

    const artists = await response.json();

    if (!Array.isArray(artists)) {
        throw new Error("Artist response was not a list.");
    }

    availableArtists = artists;
}

async function openArtworkDrawer() {
    try {
        await loadArtworkFormContainer();
        await loadAvailableArtists();

        setFormMode("create");
        captureInitialFormState();

        showDrawer();
    } catch (error) {
            console.error(error);        
    }
}

function closeArtworkDrawer() {
    if (!confirmDiscardChanges()) {
        return;
    }

    const drawer = document.getElementById("artwork-form-container");

    drawer.hidden = true;

    drawer.setAttribute("aria-hidden", "true");

    lastFocusedElement?.focus();
}

function attachArtworkFormHandler() {
    const form = document.getElementById("artwork-form");
    const artistSearch = document.getElementById("artist-search");
    const artistResults = document.getElementById("artist-search-results");

    if (!form) {
        return;
    }

    form.addEventListener("submit", submitArtworkForm);
    form.addEventListener("input", updateDirtyState);
    form.addEventListener("change", updateDirtyState);

    artistSearch.addEventListener("input", handleArtistSearch);

    artistResults.addEventListener("click", (event) => {
        const option = event.target.closest("[data-artist-id]");

        if (!option) {
            return;
        }

        selectArtist(option.dataset.artistId);
    });

    document.getElementById("artwork-cancel-button")
        .addEventListener("click", closeArtworkDrawer);
}

function handleArtistSearch(event) {
    document.getElementById("artistId").value = "";

    const query = event.target.value.trim().toLowerCase();

    const matches = availableArtists.filter((artist) =>
        artist.fullName?.toLowerCase().includes(query)
    );

    renderArtistSearchResults(matches);
}

function renderArtistSearchResults(artists) {
    const results = document.getElementById("artist-search-results");

    results.replaceChildren();

    for (const artist of artists) {
        const option = document.createElement("button");

        option.type = "button";
        option.dataset.artistId = artist.artistId;
        option.textContent = artist.fullName;

        results.appendChild(option);
    }

    const hasResults = artists.length > 0;

    results.hidden = !hasResults;
    document
        .getElementById("artist-search")
        .setAttribute("aria-expanded", String(hasResults));
}

function selectArtist(artistId) {
    const artist = availableArtists.find(
        (item) => String(item.artistId) === String(artistId)
    );

    if (!artist) {
        throw new Error(`Artist not found: ${artistId}`);
    }

    document.getElementById("artist-search").value = artist.fullName;
    document.getElementById("artistId").value = artist.artistId;

    const results = document.getElementById("artist-search-results");
    results.replaceChildren();
    results.hidden = true;

    document
        .getElementById("artist-search")
        .setAttribute("aria-expanded", "false");

    updateDirtyState();
}

async function submitArtworkForm(event) {
    event.preventDefault();

    const form = event.target;

    const data = new FormData(form);
    const artistIdValue = data.get("artistId");
    const artistId = Number(artistIdValue);

    if (
        typeof artistIdValue !== "string" ||
        artistIdValue.trim() === "" ||
        !Number.isInteger(artistId) ||
        artistId <= 0 ||
        !availableArtists.some((artist) => artist.artistId === artistId)
    ) {
        alert("Select an artist from the search results before submitting.");
        document.getElementById("artist-search").focus();
        return;
    }    

    const artwork = {
        title: data.get("artworkName").trim(),
        artistId: Number(data.get("artistId")),
        creationDate: Number(data.get("creationDate")),
        medium: data.get("medium").trim(),
        dimensions: data.get("dimensions").trim(),
        collectionId: data.get("collectionId") ? Number(data.get("collectionId")) : null,                        
        category: data.get("category").trim(),
        styleID: data.get("styleID") ? Number(data.get("styleID")) : null,
        periodID: data.get("periodID") ? Number(data.get("periodID")) : null,
        imageURL: data.get("imageURL").trim()
    };

    const mode = form.dataset.mode;
    const artworkId = form.dataset.artworkId;
    const url = mode === "edit" 
        ? `/api/curator/artwork/${artworkId}`
        : "/api/curator/artwork";
    const method = mode === "edit" ? "PUT" : "POST";

    try {
        const response =
            await fetch(url,
                {
                    method: method,
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(artwork)
                }
            );

        if (!response.ok) {
            throw new Error("Unable to create artwork.");
        }

        form.reset();
        captureInitialFormState();
        
        await loadArtwork();
        
        closeArtworkDrawer();
                
    } catch (error) {
        console.error("artwork creation failed:",error);

        alert("Unable to create artwork. Please try again.");
    }
}
    
async function openArtworkDrawerForEdit(id) {
    try {
        await loadArtworkFormContainer();
        await loadAvailableArtists();

        const form = document.getElementById("artwork-form");

        setFormMode("edit", id);

        await loadArtworkIntoForm(id);

        showDrawer();
    } catch (error) {
        console.error("Unable to open artwork for editing:", error);
        alert("Unable to load artwork");
    }
}

function showDrawer() {
    const drawer = document.getElementById("artwork-form-container");

    lastFocusedElement = document.activeElement;

    drawer.hidden = false;

    drawer.setAttribute("aria-hidden", "false");

    document.getElementById("title")?.focus();
}

function setFormMode(mode, id = "") {
    const form = document.getElementById("artwork-form");

    const title = document.getElementById("artwork-form-title");

    const submitButton = document.getElementById("artwork-submit-button");

    form.dataset.mode = mode;
    form.dataset.artworkId = id;

    if (mode === "edit") {
        title.textContent = "Edit artwork";

        submitButton.textContent = "Save Changes";
    } else {
        title.textContent = "Create artwork";

        submitButton.textContent = "Create artwork";

        form.reset();
    }
}

async function loadArtworkIntoForm(id) {
    const submitButton = document.getElementById("artwork-submit-button");

    submitButton.disabled = true;
        
    const response = await fetch(`/api/curator/artwork/${id}`);

    if(!response.ok) {
        throw new Error("Failed to load artwork.");
    }

    const artwork = await response.json();

    document.getElementById("artworkName").value = artwork.title ?? "";
    document.getElementById("category").value = artwork.category ?? "";
    document.getElementById("medium").value = artwork.medium ?? "";
    document.getElementById("dimensions").value = artwork.dimensions ?? "";
    document.getElementById("creationDate").value = artwork.creationDate ?? "";
    document.getElementById("imageURL").value = artwork.imageURL ?? "";
    document.getElementById("collectionId").value = artwork.collectionId ?? "";
    document.getElementById("artist-search").value = artwork.artist ?? "";
    document.getElementById("artistId").value = artwork.artistId ?? "";
    document.getElementById("styleID").value = artwork.styleID ?? "";
    document.getElementById("periodID").value = artwork.periodID ?? "";

    captureInitialFormState();   
    
    submitButton.disabled = false;
}

function getFormState() {
    const form = document.getElementById("artwork-form");

    return JSON.stringify(Object.fromEntries(new FormData(form)));
}

function captureInitialFormState() {
    initialFormState = getFormState();
    
    formDirty = false;
}

function updateDirtyState() {
    formDirty = getFormState() !== initialFormState;
}

function confirmDiscardChanges() {
    if (!formDirty) {
        return true;
    }

    return window.confirm("Discard unsaved changes?");
}

async function loadArtworkLookups() {
    const response = await fetch("/api/curator/artwork-lookups");

    if (!response.ok) {
        throw new Error(`Failed to load artwork lookups: ${response.status}`);
    }

    const { styles, periods, collections } = await response.json();

    fillLookupSelect("collectionId", collections, "collectionId", "collectionName")
    fillLookupSelect("styleID", styles, "styleID", "styleName");
    fillLookupSelect("periodID", periods, "periodID", "periodName");
}

function fillLookupSelect(selectId, rows, idKey, nameKey) {
    const select = document.getElementById(selectId);

    for (const row of rows) {
        const option = document.createElement("option");
        option.value = row[idKey];
        option.textContent = row[nameKey];
        select.appendChild(option);
    }
}