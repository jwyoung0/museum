let allArtists = [];

document.addEventListener("DOMContentLoaded", () => {
    loadArtists();

    document
        .getElementById("artist-search")
        .addEventListener("input", handleSearch);
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

// Possible debounce function later