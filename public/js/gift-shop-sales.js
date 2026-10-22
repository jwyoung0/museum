let allSales = [];

const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
});

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("sales-search")
        .addEventListener("input", filterSales);

    loadSales();
});

async function loadSales() {
    try {
        const response = await fetch("/api/gift-shop/sales");

        if (response.redirected) {
            window.location.href = "/auth-staff";
            return;
        }

        if (!response.ok) {
            throw new Error("Unable to load sales.");
        }

        allSales = await response.json();
        filterSales();
    } catch (error) {
        console.error(error);

        document.getElementById("sales-summary").textContent =
            "Unable to load sales.";

        showSalesMessage("Please refresh and try again.");
    }
}

function filterSales() {
    const search = document.getElementById("sales-search")
        .value.trim().toLowerCase();

    const matches = allSales.filter(sale =>
        String(sale.PurchaseID).includes(search) ||
        String(sale.VisitorID).includes(search) ||
        sale.ProductName.toLowerCase().includes(search)
    );

    displaySales(matches);
    updateSalesSummary(matches);
}

function updateSalesSummary(sales) {
    const purchaseCount = new Set(
        sales.map(sale => sale.PurchaseID)
    ).size;

    const unitsSold = sales.reduce(
        (total, sale) => total + Number(sale.Quantity),
        0
    );

    const revenue = sales.reduce(
        (total, sale) => total + Number(sale.LineTotal),
        0
    );

    document.getElementById("sales-summary").textContent =
        `Matching results: ${purchaseCount} purchases, ` +
        `${unitsSold} units sold, ` +
        `${currency.format(revenue)} in sales.`;
}

function displaySales(sales) {
    const tbody = document.getElementById("sales-table-body");
    tbody.replaceChildren();

    if (sales.length === 0) {
        showSalesMessage(
            allSales.length === 0
                ? "No sales recorded yet."
                : "No sales match your search."
        );
        return;
    }

    for (const sale of sales) {
        const row = document.createElement("tr");

        const values = [
            sale.PurchaseID,
            new Date(sale.PurchaseDate).toLocaleString(),
            sale.VisitorID,
            sale.ProductName,
            sale.Quantity,
            currency.format(Number(sale.UnitPrice)),
            currency.format(Number(sale.LineTotal))
        ];

        for (const value of values) {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        }

        tbody.appendChild(row);
    }
}

function showSalesMessage(message) {
    const tbody = document.getElementById("sales-table-body");
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 7;
    cell.textContent = message;

    row.appendChild(cell);
    tbody.replaceChildren(row);
}