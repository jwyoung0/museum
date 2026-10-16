import { createDrawer } from "/js/drawer.js";
import { createFormState } from "/js/form-state.js";

let allArtists = [];

let artistFormLoaded = false;
let formState = null;

const artistDrawer = createDrawer({
    element: document.getElementById("artist-form-container"),
    closeButton: document.getElementById("close-artist-drawer"),
    initialFocus: () => document.getElementById("fullName"),
    canClose: () => formState === null || formState.confirmDiscard()
});

document.addEventListener("DOMContentLoaded", () => {
    loadArtists();

    document
        .getElementById("artist-search")
        .addEventListener("input", handleSearch);

    document
        .getElementById("add-artist-button")
        .addEventListener("click", openArtistDrawer);
});

window.addEventListener("beforeunload", (event) => {
    if (artistDrawer.isOpen() && formState?.isDirty()) {
        event.preventDefault();
        event.returnValue = "";
    }
});

async function loadArtists() {
    try{
        const response = await fetch("/api/curator/artists");

        allArtists = await response.json();

        renderArtists(allArtists);
    } catch (error) {
        document.getElementById("error-state").hidden = false;
    }
}

function buildLifespan(artist) {
    const birth = artist.birthYear ?? "?";
    const death = artist.deathYear ?? "";

    return death
        ? `${birth}-${death}`
        : `${birth}-`;
}

function renderArtists(artists) {
    const tableBody = document.getElementById("artists-table-body");

    const searchEmptyState = document.getElementById("search-empty-state");
    
    tableBody.querySelectorAll("tr:not(#search-empty-state):not(#error-state)")
        .forEach((row) => row.remove());

    searchEmptyState.hidden = true;

    if (artists.length === 0) {
        searchEmptyState.hidden = false;
        return;
    }

    artists.forEach((artist) => {
        tableBody.insertAdjacentHTML(
            "beforeend",
            `
            <tr>
                <td>
                    <a href="/curator/artists/${artist.artistId}">
                        ${artist.fullName}
                    </a>
                </td>
                <td>${buildLifespan(artist)}</td>
                <td>${artist.nationality ?? ""}</td>
                <td>
                    <button
                        type="button"
                        class="view-artist-button"
                        data-artist-id="${artist.artistId}"
                    >
                        View
                    </button>

                    <button
                        class="edit-artist-button"
                        data-artist-id="${artist.artistId}">
                        Edit
                    </button>
                </td>
            </tr>
            `
        );
    });

    document
        .querySelectorAll(".view-artist-button")
        .forEach((button) => {
            button.addEventListener("click", () => {
                window.location.assign(
                    `/curator/artists/${button.dataset.artistId}`
                );
            });
        });

    document
        .querySelectorAll(".edit-artist-button")
        .forEach((button) => {
            button.addEventListener("click", 
                () => openArtistDrawerForEdit(
                    button.dataset.artistId
                )
            );
        });
}

function handleSearch(event) {
    const query = 
        event.target.value
            .trim()
            .toLowerCase();

    const filteredArtists = 
        allArtists.filter((artist) =>
            artist.fullName
                .toLowerCase()
                .includes(query)
    );

    const searchEmptyState =
        document.getElementById("search-empty-state");

    if (query && filteredArtists.length === 0) {
        searchEmptyState.hidden = false;
    } else {
        searchEmptyState.hidden = true;
    }

    renderArtists(filteredArtists);
}

async function loadArtistFormContainer() {
    if (artistFormLoaded) {
        return;
    }

    const response = await fetch("/components/artist-form.html");

    if (!response.ok) {
        throw new Error(`Failed to load form: ${response.status}`);
    }

    const html = await response.text();

    document.getElementById("artist-form-content").innerHTML = html;

    await loadArtistLookups();

    attachArtistFormHandler();

    artistFormLoaded = true;
}

async function openArtistDrawer() {
    try {
        await loadArtistFormContainer();

        setFormMode("create");
        formState.capture();

        artistDrawer.open();
    } catch (error) {
            console.error(error);        
    }
}

function attachArtistFormHandler() {
    const form = document.getElementById("artist-form");

    if (!form) {
        return;
    }

    formState = createFormState(form);

    form.addEventListener("submit", submitArtistForm);

    document.getElementById("artist-cancel-button")
        .addEventListener("click", artistDrawer.close);
}

async function submitArtistForm(event) {
    event.preventDefault();

    const form = event.target;

    const data = new FormData(form);

    const artist = {
        fullName: data.get("fullName").trim(),
        birthYear: data.get("birthYear") ? Number(data.get("birthYear")) : null,
        deathYear: data.get("deathYear") ? Number(data.get("deathYear")) : null,
        placeOfBirth: data.get("placeOfBirth"),
        period: data.get("period"),
        sex: data.get("sex"),
        nationality: data.get("nationality")
    };

    const mode = form.dataset.mode;
    const artistId = form.dataset.artistId;
    const url = mode === "edit" 
        ? `/api/curator/artists/${artistId}`
        : "/api/curator/artists";
    const method = mode === "edit" ? "PUT" : "POST";

    try {
        const response =
            await fetch(url,
                {
                    method: method,
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(artist)
                }
            );

        if (!response.ok) {
            throw new Error("Unable to create artist.");
        }

        form.reset();
        formState.capture();
        
        await loadArtists();
        
        artistDrawer.close();
                
    } catch (error) {
        console.error("Artist creation failed:",error);

        alert("Unable to create artist. Please try again.");
    }
}
    
async function openArtistDrawerForEdit(id) {
    try {
        await loadArtistFormContainer();

        const form = document.getElementById("artist-form");

        setFormMode("edit", id);

        await loadArtistIntoForm(id);

        artistDrawer.open();
    } catch (error) {
        alert("Unable to load artist");
    }
}

function setFormMode(mode, id = "") {
    const form = document.getElementById("artist-form");

    const title = document.getElementById("artist-form-title");

    const submitButton = document.getElementById("artist-submit-button");

    form.dataset.mode = mode;
    form.dataset.artistId = id;

    if (mode === "edit") {
        title.textContent = "Edit Artist";

        submitButton.textContent = "Save Changes";
    } else {
        title.textContent = "Create Artist";

        submitButton.textContent = "Create Artist";

        form.reset();
    }
}

async function loadArtistIntoForm(id) {
    const submitButton = document.getElementById("artist-submit-button");

    submitButton.disabled = true;
        
    const response = await fetch(`/api/curator/artists/${id}`);

    if(!response.ok) {
        throw new Error("Failed to load artist.");
    }

    const artist = await response.json();

    document.getElementById("fullName").value = artist.fullName ?? "";
    document.getElementById("birthYear").value = artist.birthYear ?? "";
    document.getElementById("placeOfBirth").value = artist.placeOfBirth ?? "";
    document.getElementById("period").value = artist.period ?? "";
    document.getElementById("deathYear").value = artist.deathYear ?? "";
    document.getElementById("sex").value = artist.sex ?? "";
    document.getElementById("nationality").value = artist.nationality ?? "";

    formState.capture();
    
    submitButton.disabled = false;
}

async function loadArtistLookups() {
    const response = await fetch("/api/curator/artist-lookup");

    if(!response.ok) {
        throw new Error(`Failed to load artwork lookups: ${response.status}`);
    }

    const { periods } = await response.json();

    fillLookupSelect("period", periods, "periodName", "periodName");
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