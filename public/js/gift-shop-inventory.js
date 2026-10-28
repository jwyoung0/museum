let inventoryProducts = [];

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("inventory-search")
        .addEventListener("input", filterInventory);

    document.getElementById("low-stock-only")
        .addEventListener("change", filterInventory);

    document.getElementById("refresh-inventory-button")
        .addEventListener("click", refreshInventory);

    refreshInventory();
});

async function refreshInventory() {
    const button = document.getElementById("refresh-inventory-button");
    button.disabled = true;

    try {
        await Promise.all([
            loadInventory(),
            loadInventoryAlerts()
        ]);
    } finally {
        button.disabled = false;
    }
}

async function fetchInventoryData(url) {
    const response = await fetch(url, {
        cache: "no-store"
    });

    if (response.redirected || response.status === 401) {
        window.location.href = "/auth-staff";
        throw new Error("Please sign in as a gift shop manager.");
    }

    if (!response.ok) {
        throw new Error("Unable to load data.");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
        throw new Error("Invalid server response.");
    }

    return data;
}

async function loadInventory() {
    const summary = document.getElementById("inventory-summary");
    summary.textContent = "Loading inventory...";

    try {
        inventoryProducts = await fetchInventoryData(
            "/api/gift-shop/products"
        );

        const lowStockCount = inventoryProducts.filter(
            product => Number(product.QuantityInStock) <= 5
        ).length;

        summary.textContent =
            `${inventoryProducts.length} products total. ` +
            `${lowStockCount} products have stock of 5 or fewer.`;

        filterInventory();
    } catch (error) {
        console.error(error);

        summary.textContent = "Unable to load inventory.";
        showInventoryMessage("Please click Refresh and try again.");
    }
}

async function loadInventoryAlerts() {
    const message = document.getElementById("inventory-alerts-message");
    const list = document.getElementById("inventory-alerts-list");

    message.textContent = "Loading alerts...";
    list.replaceChildren();

    try {
        const alerts = await fetchInventoryData(
            "/api/gift-shop/inventory-alerts"
        );

        if (alerts.length === 0) {
            message.textContent = "No active low-stock alerts.";
            return;
        }

        message.textContent =
            `${alerts.length} product${alerts.length === 1 ? "" : "s"} ` +
            "need restocking.";

        for (const alert of alerts) {
            const item = document.createElement("li");
            const stock = Number(alert.QuantityInStock);

            item.textContent =
                `${alert.ProductName} (ID: ${alert.ProductID}) — ` +
                (stock === 0
                    ? "Out of stock."
                    : `${stock} remaining.`);

            list.appendChild(item);
        }
    } catch (error) {
        console.error(error);

        message.textContent =
            "Unable to load alerts. Please click Refresh and try again.";
    }
}

function filterInventory() {
    const search = document.getElementById("inventory-search")
        .value.trim().toLowerCase();

    const lowStockOnly = document.getElementById("low-stock-only")
        .checked;

    const matches = inventoryProducts.filter(product => {
        const matchesSearch =
            String(product.ProductID).includes(search) ||
            String(product.ProductName).toLowerCase().includes(search) ||
            String(product.Category).toLowerCase().includes(search);

        const matchesStock =
            !lowStockOnly || Number(product.QuantityInStock) <= 5;

        return matchesSearch && matchesStock;
    });

    displayInventory(matches);
}

function displayInventory(products) {
    const tbody = document.getElementById("inventory-table-body");
    tbody.replaceChildren();

    if (products.length === 0) {
        showInventoryMessage(
            inventoryProducts.length === 0
                ? "No products found."
                : "No products match your filters."
        );
        return;
    }

    for (const product of products) {
        const row = document.createElement("tr");
        const stock = Number(product.QuantityInStock);

        const status = stock === 0
            ? "Out of stock"
            : stock <= 5
                ? "Low stock"
                : "In stock";

        const values = [
            product.ProductID,
            product.ProductName,
            product.Category,
            stock,
            status
        ];

        for (const value of values) {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        }

        if (stock <= 5) {
            row.classList.add("inventory-low-stock");
        }

        tbody.appendChild(row);
    }
}

function showInventoryMessage(message) {
    const tbody = document.getElementById("inventory-table-body");
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 5;
    cell.textContent = message;

    row.appendChild(cell);
    tbody.replaceChildren(row);
}