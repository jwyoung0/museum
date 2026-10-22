const tableBody = document.getElementById("memberships-table-body");
const searchInput = document.getElementById("tier-search");
const message = document.getElementById("memberships-message");
const loadingState = document.getElementById("loading-state");
const emptyState = document.getElementById("empty-state");
const errorState = document.getElementById("error-state");

let allTiers = [];

function addCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
}

function displayTiers(tiers) {
    tableBody.querySelectorAll(".tier-row").forEach((row) => row.remove());

    const searchTerm = searchInput.value.trim().toLowerCase();
    const filteredTiers = tiers.filter((tier) =>
        [
            tier.TierName,
            tier.Description,
            tier.Price,
            tier.DiscountRate,
            tier.IsVIP ? "vip" : "non-vip"
        ].some((value) => String(value ?? "").toLowerCase().includes(searchTerm))
    );

    emptyState.hidden = filteredTiers.length > 0;

    for (const tier of filteredTiers) {
        const row = document.createElement("tr");
        row.className = "tier-row";

        const price = Number(tier.Price);
        const discount = Number(tier.DiscountRate);

        addCell(row, tier.TierName ?? "—");
        addCell(
            row,
            Number.isFinite(price)
                ? new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD"
                }).format(price)
                : "—"
        );
        addCell(
            row,
            Number.isFinite(discount)
                ? `${(discount * 100).toFixed(0)}%`
                : "—"
        );
        addCell(row, tier.IsVIP ? "Yes" : "No");
        addCell(row, tier.Description ?? "—");

        tableBody.insertBefore(row, emptyState);
    }

    message.textContent = `${filteredTiers.length} of ${allTiers.length} tier(s)`;
}

async function loadTiers() {
    loadingState.hidden = false;
    emptyState.hidden = true;
    errorState.hidden = true;
    message.textContent = "Loading membership tiers...";

    try {
        const response = await fetch("/api/director/memberships/tiers");

        if (!response.ok) {
            throw new Error(`Request failed (${response.status})`);
        }

        allTiers = await response.json();
        loadingState.hidden = true;
        displayTiers(allTiers);
    } catch (error) {
        console.error("Failed to load membership tiers.", error);
        loadingState.hidden = true;
        errorState.hidden = false;
        message.textContent = "Could not load membership tiers.";
    }
}

searchInput.addEventListener("input", () => displayTiers(allTiers));
loadTiers();