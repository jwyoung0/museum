import { createDrawer } from "/js/drawer.js";
import { createFormState } from "/js/form-state.js";

let allArtwork = [];

let artworkFormLoaded = false;
let formState = null;

const artworkDrawer = createDrawer({
    element: document.getElementById("artwork-form-container"),
    closeButton: document.getElementById("close-artwork-drawer"),
    initialFocus: () => document.getElementById("title"),
    canClose: () => formState === null || formState.confirmDiscard()
});

document.addEventListener("DOMContentLoaded", () => {
    loadArtwork();

    document
        .getElementById("artwork-search")
        .addEventListener("input", handleSearch);

    document
        .getElementById("add-artwork-button")
        .addEventListener("click", openArtworkDrawer);
});

window.addEventListener("beforeunload", (event) => {
    if (artworkDrawer.isOpen() && formState?.isDirty()) {
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


async function openArtworkDrawer() {
    try {
        await loadArtworkFormContainer();


        setFormMode("create");
        formState.capture();

        artworkDrawer.open();
    } catch (error) {
            console.error(error);        
    }
}

function attachArtworkFormHandler() {
    const form = document.getElementById("artwork-form");

    if (!form) {
        return;
    }

    formState = createFormState(form);

    form.addEventListener("submit", submitArtworkForm);

    document.getElementById("artwork-cancel-button")
        .addEventListener("click", artworkDrawer.close);
}

async function submitArtworkForm(event) {
    event.preventDefault();

    const form = event.target;

    const data = new FormData(form);

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
        formState.capture();
        
        await loadArtwork();
        
        artworkDrawer.close();
                
    } catch (error) {
        console.error("artwork creation failed:",error);

        alert("Unable to create artwork. Please try again.");
    }
}
    
async function openArtworkDrawerForEdit(id) {
    try {
        await loadArtworkFormContainer();

        const form = document.getElementById("artwork-form");

        setFormMode("edit", id);

        await loadArtworkIntoForm(id);

        artworkDrawer.open();
    } catch (error) {
        console.error("Unable to open artwork for editing:", error);
        alert("Unable to load artwork");
    }
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
    document.getElementById("artistId").value = artwork.artistId ?? "";
    document.getElementById("styleID").value = artwork.styleID ?? "";
    document.getElementById("periodID").value = artwork.periodID ?? "";

    formState.capture();
    
    submitButton.disabled = false;
}

async function loadArtworkLookups() {
    const response = await fetch("/api/curator/artwork-lookup");

    if (!response.ok) {
        throw new Error(`Failed to load artwork lookups: ${response.status}`);
    }

    const { styles, periods, collections, artists } = await response.json();

    fillLookupSelect("artistId", artists, "artistId", "fullName");
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
