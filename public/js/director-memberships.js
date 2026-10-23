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
const benefitOptions = document.getElementById("benefit-options");
const benefitsMessage = document.getElementById("benefits-message");

const tiersUrl = "/api/director/memberships/tiers";
const benefitsUrl = "/api/director/memberships/benefits";
let allTiers = [];
let allBenefits = [];
let editingTierId = null;
let benefitsLoaded = false;

function addCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
}

function resetForm() {
    editingTierId = null;
    tierForm.reset();
    renderBenefitOptions();
    tierForm.hidden = true;
    formHeading.textContent = "Add membership tier";
    submitButton.textContent = "Add tier";
    cancelButton.hidden = true;
}

function renderBenefitOptions(selectedBenefits = []) {
    const selectedById = new Map(
        selectedBenefits.map((benefit) => [String(benefit.BenefitID), benefit])
    );
    benefitOptions.replaceChildren();

    for (const benefit of allBenefits) {
        const option = document.createElement("div");
        option.className = "benefit-option";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.dataset.benefitId = benefit.BenefitID;
        checkbox.id = `benefit-${benefit.BenefitID}`;
        checkbox.checked = selectedById.has(String(benefit.BenefitID));
        checkbox.addEventListener("change", () => {
            quantity.disabled = !checkbox.checked;
        });

        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.textContent = benefit.BenefitName;

        const quantity = document.createElement("input");
        quantity.type = "number";
        quantity.min = "1";
        quantity.step = "1";
        quantity.placeholder = "No limit";
        quantity.dataset.quantityFor = benefit.BenefitID;
        quantity.setAttribute("aria-label", `${benefit.BenefitName} quantity`);
        quantity.value = selectedById.get(String(benefit.BenefitID))?.Quantity ?? "";
        quantity.disabled = !checkbox.checked;

        option.append(checkbox, label, quantity);
        benefitOptions.appendChild(option);
    }

    benefitsMessage.textContent = allBenefits.length
        ? "Select the benefits included with this tier. Leave quantity blank for no limit."
        : "No benefits are currently configured.";
}

function normalizeTiers(rows) {
    const tiersById = new Map();

    for (const row of rows) {
        let tier = tiersById.get(row.TierID);
        if (!tier) {
            tier = {
                TierID: row.TierID,
                TierName: row.TierName,
                Price: row.Price,
                DiscountRate: row.DiscountRate,
                Description: row.Description,
                Benefits: []
            };
            tiersById.set(row.TierID, tier);
        }

        if (row.BenefitID !== null && row.BenefitID !== undefined) {
            tier.Benefits.push({
                BenefitID: row.BenefitID,
                BenefitName: row.BenefitName,
                Quantity: row.Quantity
            });
        }
    }

    return Array.from(tiersById.values());
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
            ...tier.Benefits.map((benefit) => benefit.BenefitName)
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
        const benefits = tier.Benefits.map((benefit) =>
            benefit.Quantity == null
                ? benefit.BenefitName
                : `${benefit.BenefitName} (${benefit.Quantity})`
        ).join(", ");
        const benefitsCell = document.createElement("td");
        benefitsCell.className = "benefits-cell";
        benefitsCell.textContent = benefits || "—";
        row.appendChild(benefitsCell);

        const actionsCell = document.createElement("td");
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.dataset.action = "edit";
        editButton.dataset.id = tier.TierID;
        editButton.disabled = !benefitsLoaded;
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

        const rows = await response.json();
        if (!Array.isArray(rows)) throw new Error("Unexpected response format");
        allTiers = normalizeTiers(rows);

        loadingState.hidden = true;
        displayTiers(allTiers);
    } catch (error) {
        console.error("Failed to load membership tiers.", error);
        loadingState.hidden = true;
        errorState.hidden = false;
        message.textContent = "Could not load membership tiers.";
    }
}

async function loadBenefits() {
    addTierButton.disabled = true;
    benefitsMessage.textContent = "Loading benefits...";

    try {
        const response = await fetch(benefitsUrl);
        if (!response.ok) throw new Error(`Request failed (${response.status})`);

        allBenefits = await response.json();
        if (!Array.isArray(allBenefits)) throw new Error("Unexpected response format");

        benefitsLoaded = true;
        renderBenefitOptions();
        addTierButton.disabled = false;
        if (allTiers.length) displayTiers(allTiers);
    } catch (error) {
        console.error("Failed to load membership benefits.", error);
        benefitsMessage.textContent = "Could not load benefits. Try reloading the page.";
        message.textContent = "Could not load membership benefits.";
    }
}

tierForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!benefitsLoaded) {
        message.textContent = "Cannot save a tier until benefits are loaded.";
        return;
    }

    const formData = new FormData(tierForm);
    const payload = {
        TierName: formData.get("TierName").trim(),
        Price: Number(formData.get("Price")),
        DiscountRate: Number(formData.get("DiscountRate")) / 100,
        Description: formData.get("Description").trim(),
        Benefits: Array.from(benefitOptions.querySelectorAll("[data-benefit-id]:checked"))
            .map((checkbox) => {
                const quantity = checkbox.parentElement.querySelector(
                    `[data-quantity-for="${checkbox.dataset.benefitId}"]`
                ).value;
                return {
                    BenefitID: Number(checkbox.dataset.benefitId),
                    Quantity: quantity === "" ? null : Number(quantity)
                };
            })
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
        renderBenefitOptions(tier.Benefits);
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

loadBenefits();
loadTiers();
