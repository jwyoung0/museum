let currentTier = null;

document.addEventListener("DOMContentLoaded", async () => {
    const TierId = window.location.pathname.split("/").pop();

    try {    
        const response = await fetch(`/api/membership-detail/${TierId}`);

        if (!response.ok) {
            throw new Error("Failed to load membership tier details.");
        }

        const tier = await response.json();

        currentTier = tier;

        document.getElementById("TierName").textContent = 
            tier.name;

        document.getElementById("Price").textContent =
            tier.price;

        document.getElementById("Description").textContent =
            tier.description;

    } catch (error) {
        document.getElementById("detail-error").hidden = false;
    }
});