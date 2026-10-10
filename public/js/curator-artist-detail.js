document.addEventListener("DOMContentLoaded", async () => {
    const artistId = window.location.pathname.split("/").pop();

    try {    
        const response = await fetch(`/api/curator/artists/${artistId}`);

        if (!response.ok) {
            throw new Error("Failed to load artist");
        }

        const artist = await response.json();

        document.getElementById("artist-name").textContent = 
            artist.fullName;

        document.getElementById("birth-year").textContent =
            artist.birthYear ?? "";

        document.getElementById("death-year").textContent =
            artist.deathYear ?? "";

        document.getElementById("period").textContent =
            artist.period ?? "";

        document.getElementById("sex").textContent =
            artist.sex ?? ""
    } catch (error) {
        document.getElementById("detail-error").hidden = false;
    }
});