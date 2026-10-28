let allCollections = [];

document.addEventListener("DOMContentLoaded", () => {
    loadCollections();
});

async function loadCollections() {
    try {
        const response = await fetch("/api/collections");
        if (!response.ok) {
            throw new Error(`Failed to load collections: ${response.status}`);
        }

        allCollections = await response.json();

        displayCollections(allCollections);
    } catch (error) {
        console.error("Failed to load collections.", error);
        document.getElementById("collections-error").hidden = false;
    }
}

function displayCollections(collections) {
    const results =
        document.getElementById("collections-results");

    results.replaceChildren();

    for (const collection of collections) {
        const card = document.createElement("article");
        card.className = "collection-card";

        if (collection.imageURL) {
            const image = document.createElement("img");
            image.src = collection.imageURL;
            image.alt = collection.collectionName || "Collection";
            image.loading = "lazy";

            card.append(image);
        }

        const link = document.createElement("a");
        link.href = `/collections/${collection.collectionId}`;

        const title = document.createElement("h3");
        title.textContent =
            collection.collectionName ||
            "Untitled Collection";

        link.appendChild(title);

        const description = document.createElement("p");
        description.textContent =
            collection.description ||
            "No description available.";

        card.append(link, description);

        results.append(card);
    }
}