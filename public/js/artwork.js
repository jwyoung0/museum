document.addEventListener("DOMContentLoaded", () => {
    document
        .getElementById("public-search-artwork")
        .addEventListener("input", handleSearch);

    document
        .getElementById("add-artwork-button")
        .addEventListener("click", openArtworkDrawer);
});