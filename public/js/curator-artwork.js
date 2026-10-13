let allArtwork = [];

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
            !document.getElementById("Artwork-form-container").hidden
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
        const response = await fetch("/api/curator/Artwork");

        allArtwork = await response.json();

        renderArtwork(allArtwork);
    } catch (error) {
        document.getElementById("error-state").hidden = false;
    }
}

function renderArtwork(artwork) {
    const tableBody = document.getElementById("artwork-table-body");

    const searchEmptyState = document.getElementById("search-empty-state");
    
    tableBody.querySelectorAll("tr:not(#search-empty-state):not(#error-state)")
        .forEach((row) => row.remove());

    searchEmptyState.hidden = true;

    if (artwork.length === 0) {
        searchEmptyState.hidden = false;
        return;
    }

    artwork.forEach((artwork) => {
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
                <td>${artwork.dateCreated}</td>
                <td>
                    <a href="/curator/artwork/${artwork.accessionId}">
                        View
                    </a>

                    <button
                        class="edit-artwork-button"
                        data-artwork-id="${artwork.accessionId}">
                        Edit
                    </button>
                </td>
            </tr>
            `
        );
    });

    document
        .querySelectorAll(".edit-artwork-button")
        .forEach((button) => {
            button.addEventListener("click", 
                () => openArtworkDrawerForEdit(
                    button.dataset.artworkId
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
            artwork.fullName
                .toLowerCase()
                .includes(query)
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

    attachArtworkFormHandler();

    artworkFormLoaded = true;
}

async function openArtworkDrawer() {
    try {
        await loadArtworkFormContainer();

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

    if (!form) {
        return;
    }

    form.addEventListener("submit", submitArtworkForm);
    form.addEventListener("input", updateDirtyState);
    form.addEventListener("change", updateDirtyState);

    document.getElementById("artwork-cancel-button")
        .addEventListener("click", closeArtworkDrawer);
}

async function submitArtworkForm(event) {
    event.preventDefault();

    const form = event.target;

    const data = new FormData(form);

    const artwork = {
        title: data.get("title").trim(),
        birthYear: data.get("birthYear") ? Number(data.get("birthYear")) : null,
        deathYear: data.get("deathYear") ? Number(data.get("deathYear")) : null,
        placeOfBirth: data.get("placeOfBirth"),
        period: data.get("period"),
        sex: data.get("sex"),
        nationality: data.get("nationality")
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

        const form = document.getElementById("artwork-form");

        setFormMode("edit", id);

        await loadArtworkIntoForm(id);

        showDrawer();
    } catch (error) {
        alert("Unable to load artwork");
    }
}

function showDrawer() {
    const drawer = document.getElementById("artwork-form-container");

    lastFocusedElement = document.activeElement;

    drawer.hidden = false;

    drawer.setAttribute("aria-hidden", "false");

    document.getElementById("fullName")?.focus();
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

    document.getElementById("fullName").value = artwork.fullName ?? "";
    document.getElementById("birthYear").value = artwork.birthYear ?? "";
    document.getElementById("placeOfBirth").value = artwork.placeOfBirth ?? "";
    document.getElementById("period").value = artwork.period ?? "";
    document.getElementById("deathYear").value = artwork.deathYear ?? "";
    document.getElementById("sex").value = artwork.sex ?? "";
    document.getElementById("nationality").value = artwork.nationality ?? "";

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