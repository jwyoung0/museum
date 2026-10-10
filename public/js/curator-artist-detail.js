document.addEventListener("DOMContentLoaded", () => {
    const artistId = window.location.pathname.split("/").pop();

    fetch(`/api/curator/artists/${artistId}`)
});