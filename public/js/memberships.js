const container = document.querySelector("#membership-tiers");

function addTextElement(parent, tag, text) {
    const element = document.createElement(tag);
    element.textContent = text;
    parent.appendChild(element);
    return element;
}

async function loadMembershipTiers() {
    try {
        const response = await fetch("/api/memberships/tiers");
        if (!response.ok) {
            throw new Error("Could not load membership tiers.");
        }

        const rows = await response.json();
        const tiers = new Map();

        for (const row of rows) {
            if (!tiers.has(row.TierID)) {
                tiers.set(row.TierID, {
                    TierID: row.TierID,
                    name: row.TierName,
                    price: row.Price,
                    description: row.Description
                });
            }
        }

        container.replaceChildren();

        if (tiers.size === 0) {
            addTextElement(container, "p", "No membership tiers are available.");
            return;
        }

        for (const tier of tiers.values()) {
            const card = document.createElement("article");
            card.className = "membership-card";

            const heading = document.createElement("h3");

            const link = document.createElement("a");
            link.href = `/membership/${tier.TierID}`;
            link.textContent = tier.name;

            heading.appendChild(link);
            card.appendChild(heading);

            addTextElement(card, "p", `$${Number(tier.price).toFixed(2)}`);

            if (tier.description) {
                addTextElement(card, "p", tier.description);
            }

            container.appendChild(card);
        }
    } catch (error) {
        container.replaceChildren();
        addTextElement(container, "p", error.message);
    }
}

loadMembershipTiers();