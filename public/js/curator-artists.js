let allArtists = [];

let artistFormLoaded = false;
let lastFocusedElement = null;

document.addEventListener("DOMContentLoaded", () => {
    loadArtists();

    document
        .getElementById("artist-search")
        .addEventListener("input", handleSearch);

    document
        .getElementById("add-artist-button")
        .addEventListener("click", openArtistDrawer);

    document
        .getElementById("close-artist-drawer")
        .addEventListener("click", closeArtistDrawer);
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

    tableBody.innerHTML = "";

    searchEmptyState.hidden = true;

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
                    <a href="/curator/artists/${artist.artistId}">
                        View
                    </a>
                </td>
            </tr>
            `
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

    if (
        query &&
        filteredArtists.length === 0
    ) {
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

    const response = await fetch(
        "/components/artist-form.html"
    );

    if (!response.ok) {
        throw new Error(
            `Failed to load form: ${response.status}`
        );
    }

    const html = await response.text();

    document.getElementById(
        "artist-form-content"
    ).innerHTML = html;

    attachArtistFormHandler();

    artistFormLoaded = true;
}

async function openArtistDrawer() {
    try {
        await loadArtistFormContainer();

        const drawer =
            document.getElementById(
                "artist-form-container"
            );

        lastFocusedElement =
            document.activeElement;

        drawer.hidden = false;
        drawer.setAttribute(
            "aria-hidden",
            "false"
        );

        const firstField =
            document.getElementById("fullName");

        if (firstField) {
            firstField.focus();
        } 
    } catch (error) {
            console.error(error);
        
    }
}

function closeArtistDrawer() {
    const drawer =
        document.getElementById(
            "artist-form-container"
        );

    drawer.hidden = true;

    drawer.setAttribute(
        "aria-hidden",
        "true"
    );

    document
        .getElementById("add-artist-button")
        .focus();
}

document.addEventListener(
    "keydown",
    (event) => {
        if (
            event.key === "Escape" &&
            !document
                .getElementById(
                    "artist-form-container"
                )
                .hidden
        ) {
            closeArtistDrawer();
        }
    }
);

function attachArtistFormHandler() {
    const form =
        document.querySelector(
            "#artist-form-content"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        submitArtistForm
    );
}

async function submitArtistForm(event) {
    event.preventDefault();

    const form = event.target;

    const data = new FormData(form);

    const artist = {
        fullName:
            data.get("fullName").trim(),

        birthYear:
            data.get("birthYear")
                ? Number(
                    data.get("birthYear")
                )
                : null,

        deathYear:
            data.get("deathYear")
                ? Number(
                    data.get("deathYear")
                )
                : null,

        placeOfBirth:
            data.get("placeOfBirth"),

        period:
            data.get("period"),

        sex:
            data.get("sex"),

        nationality:
            data.get("nationality")
        };

    try {
        const response =
            await fetch(
                "/api/curator/artists",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify(
                        artist
                    )
                }
            );

        if (!response.ok) {
            throw new Error(
                "Unable to create artist."
            );
        }

        form.reset();

        closeArtistDrawer();

        await loadArtists();
    } catch (error) {
        console.error(
            "Artist creation failed:",
            error
        );

        alert(
            "Unable to create artist. Please try again."
        );
    }
}
            

// Possible debounce function later