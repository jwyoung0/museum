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
            tier.TierName;

        document.getElementById("Price").textContent =
            tier.Price;

        document.getElementById("Description").textContent =
            tier.Description;

        const benefitsList = document.getElementById("Benefits");
        benefitsList.innerHTML = "";

        if (tier.Benefits?.length) {
            tier.Benefits.forEach(benefit => {
                const li = document.createElement("li");

                li.textContent =
                    benefit.Quantity > 1
                        ? `${benefit.BenefitName} (${benefit.Quantity})`
                        : benefit.BenefitName;

                benefitsList.appendChild(li);
            });
        }

    } catch (error) {
        document.getElementById("detail-error").hidden = false;
    }
});