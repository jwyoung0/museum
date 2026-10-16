let allArtwork = [];

document.addEventListener("DOMContentLoaded", () => {
    loadArtwork();
    
    document
        .getElementById("visitor-artwork-search")
        .addEventListener("input", handleSearch);

    document
        .getElementById("search-artwork-button")
        .addEventListener("click", handleSearch);
});

async function loadArtwork() {
    try {
        const response = await fetch("/api/artwork");

        allArtwork = await response.json;

        displayArtwork(allArtwork);

    } catch (error) {
        console.error("Failed to load artwork.", error);
    }
}

function displayArtwork(artworks) {

}

function handleSearch(event) {
    const query = 
        event.target.value
            .trim()
            .toLowerCase();

    const filteredArtwork =
        allArtwork.filter((artwork) => 
            artwork.title?.toLowerCaser().includes(query) ||
            artwork.artist?.toLowerCase().includes(query)        
        );
}