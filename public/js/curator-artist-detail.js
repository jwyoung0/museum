let currentArtist = null;

document.addEventListener("DOMContentLoaded", async () => {
    const artistId = window.location.pathname.split("/").pop();

    try {    
        const response = await fetch(`/api/curator/artists/${artistId}`);

        if (!response.ok) {
            throw new Error("Failed to load artist");
        }

        const artist = await response.json();

        currentArtist = artist;

        document.getElementById("artist-name").textContent = 
            artist.fullName;

        document.getElementById("birth-year").textContent =
            artist.birthYear ?? "";

        document.getElementById("place-of-birth").textContent =
            artist.placeOfBirth ?? "";

        document.getElementById("nationality").textContent = 
            artist.nationality ?? "";

        document.getElementById("death-year").textContent =
            artist.deathYear ?? "";

        document.getElementById("period").textContent =
            artist.period ?? "";

        document.getElementById("sex").textContent =
            artist.sex ?? "";

        const deleteButton = document.getElementById("delete-artist-button");
        deleteButton.hidden = false;
        deleteButton.addEventListener("click", handleDeleteArtist);
    } catch (error) {
        document.getElementById("detail-error").hidden = false;
    }
});

function handleDeleteArtist() {
    if (currentArtist.artworkCount > 0) {
        alert(
            `${currentArtist.fullName} is associated with ` + 
            `${currentArtist.artworkCount} artworks.\n\n` + 
            "Reassign or remove those artworks before deleting."
        );
        return;
    }

    confirmDeleteArtist();
}

async function confirmDeleteArtist() {
    const confirmed = window.confirm(
        `Delete ${currentArtist.fullName}?`
    );

    if (!confirmed) {
        return;
    }

    await deleteArtist();
}

async function deleteArtist() {
    try {
        const response = await fetch(
            `/api/curator/artists/${currentArtist.artistId}`,
            {
                method: "DELETE"
            } 
        );

        if (response.status === 204) {
            window.location.href = "/curator/artists";
            return;
        }

        if (response.status === 409) {
            const error = await response.json();

            alert(error.error);

            location.reload();
            return;
        }

        if (response.status === 404) {
            alert("Artist not found");
            return;   
        }
    } catch (error) {
        alert("Unable to delete artist. Please try again.");
    }
}