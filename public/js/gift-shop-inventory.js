let inventoryProducts = [];

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("inventory-search")
        .addEventListener("input", filterInventory);

    document.getElementById("low-stock-only")
        .addEventListener("change", filterInventory);

    loadInventory();
});

async function loadInventory() {
    try {
        const response = await fetch("/api/gift-shop/products");

        if (response.redirected) {
            window.location.href = "/auth-staff";
            return;
        }

        if (!response.ok) {
            throw new Error("Unable to load inventory.");
        }

        inventoryProducts = await response.json();

        const lowStockCount = inventoryProducts.filter(
            product => product.QuantityInStock <= 5
        ).length;

        document.getElementById("inventory-summary").textContent =
            `${inventoryProducts.length} products total. ` +
            `${lowStockCount} products have stock of 5 or fewer.`;

        filterInventory();
    } catch (error) {
        console.error(error);

        document.getElementById("inventory-summary").textContent =
            "Unable to load inventory.";

        showInventoryMessage("Please refresh and try again.");
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
            product.ProductName.toLowerCase().includes(search) ||
            product.Category.toLowerCase().includes(search);

        const matchesStock =
            !lowStockOnly || product.QuantityInStock <= 5;

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
        const stock = product.QuantityInStock;

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
            row.style.backgroundColor = "#fff3cd";

            const statusCell = row.lastElementChild;
            statusCell.style.color = "#713f12";
            statusCell.style.fontWeight = "bold";
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