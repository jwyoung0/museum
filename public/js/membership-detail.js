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

        document.getElementById("TierName-Header").textContent = tier.TierName;

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

        document.getElementById("continue-button").addEventListener("click", 
            async () => {
                try {
                    const response = await fetch("/api/me");

                    if(response.ok) {
                        window.location.href = `/membership-checkout?tierId=${TierId}`;
                    } else {
                        const returnTo = `/membership-checkout?tierId=${TierId}`;
                        window.location.href = `/auth-visitor?returnTo=${encodeURIComponent(returnTo)}`;
                    }
                } catch (error) {
                    console.error("Failed to check authentication status:", error);
                }
           
        });
    } catch (error) {
        document.getElementById("detail-error").hidden = false;
    }
});