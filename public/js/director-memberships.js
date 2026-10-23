const tableBody = document.getElementById("memberships-table-body");
const searchInput = document.getElementById("tier-search");
const message = document.getElementById("memberships-message");
const loadingState = document.getElementById("loading-state");
const emptyState = document.getElementById("empty-state");
const errorState = document.getElementById("error-state");
const tierForm = document.getElementById("tier-form");
const formHeading = document.getElementById("tier-form-heading");
const submitButton = document.getElementById("tier-submit");
const cancelButton = document.getElementById("tier-cancel");
const addTierButton = document.getElementById("tier-add");

const tiersUrl = "/api/director/memberships/tiers";
let allTiers = [];
let editingTierId = null;

function addCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
}

function resetForm() {
    editingTierId = null;
    tierForm.reset();
    tierForm.hidden = true;
    formHeading.textContent = "Add membership tier";
    submitButton.textContent = "Add tier";
    cancelButton.hidden = true;
}

function displayTiers(tiers) {
    tableBody.querySelectorAll(".tier-row").forEach((row) => row.remove());

    const searchTerm = searchInput.value.trim().toLowerCase();
    const filteredTiers = tiers.filter((tier) =>
        [
            tier.TierName,
            tier.Description,
            tier.Price,
            tier.DiscountRate
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
        addCell(row, Number.isFinite(discount) ? `${(discount * 100).toFixed(0)}%` : "—");
        addCell(row, tier.Description ?? "—");

        const actionsCell = document.createElement("td");
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.dataset.action = "edit";
        editButton.dataset.id = tier.TierID;
        editButton.disabled == null;
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = tier.TierID;
        actionsCell.appendChild(deleteButton);

        row.appendChild(actionsCell);
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
        const response = await fetch(tiersUrl);
        if (!response.ok) throw new Error(`Request failed (${response.status})`);

        allTiers = await response.json();
        if (!Array.isArray(allTiers)) throw new Error("Unexpected response format");

        loadingState.hidden = true;
        displayTiers(allTiers);
    } catch (error) {
        console.error("Failed to load membership tiers.", error);
        loadingState.hidden = true;
        errorState.hidden = false;
        message.textContent = "Could not load membership tiers.";
    }
}

tierForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(tierForm);
    const payload = {
        TierName: formData.get("TierName").trim(),
        Price: Number(formData.get("Price")),
        DiscountRate: Number(formData.get("DiscountRate")) / 100,
        Description: formData.get("Description").trim(),
    };

    const url = editingTierId === null
        ? tiersUrl
        : `${tiersUrl}/${encodeURIComponent(editingTierId)}`;

    try {
        const response = await fetch(url, {
            method: editingTierId === null ? "POST" : "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(`Request failed (${response.status})`);

        resetForm();
        await loadTiers();
    } catch (error) {
        console.error("Failed to save membership tier.", error);
        message.textContent = "Could not save membership tier.";
    }
});

tableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const tier = allTiers.find((item) => String(item.TierID) === button.dataset.id);
    if (!tier) return;

    if (button.dataset.action === "edit") {
        editingTierId = tier.TierID;
        tierForm.hidden = false;
        cancelButton.hidden = false;

        tierForm.elements.TierName.value = tier.TierName ?? "";
        tierForm.elements.Price.value = tier.Price ?? "";
        tierForm.elements.DiscountRate.value = Number(tier.DiscountRate ?? 0) * 100;
        tierForm.elements.Description.value = tier.Description ?? "";
        formHeading.textContent = "Edit membership tier";
        submitButton.textContent = "Save changes";
        tierForm.elements.TierName.focus();
        return;
    }

    if (button.dataset.action === "delete") {
        if (!confirm(`Delete the "${tier.TierName}" membership tier?`)) return;

        try {
            const response = await fetch(
                `${tiersUrl}/${encodeURIComponent(tier.TierID)}`,
                { method: "DELETE" }
            );
            if (!response.ok) throw new Error(`Request failed (${response.status})`);

            if (String(editingTierId) === String(tier.TierID)) resetForm();
            await loadTiers();
        } catch (error) {
            console.error("Failed to delete membership tier.", error);
            message.textContent = "Could not delete membership tier.";
        }
    }
});

cancelButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", () => displayTiers(allTiers));

addTierButton.addEventListener("click", () => {
    resetForm();
    tierForm.hidden = false;
    cancelButton.hidden = false;
    tierForm.elements.TierName.focus();
});

loadTiers();
