const form = document.getElementById("report-filters");
const from = document.getElementById("report-from");
const to = document.getElementById("report-to");
const message = document.getElementById("report-status");
const products = document.getElementById("report-products");

const purchasesTotal = document.getElementById("report-purchases");
const unitsTotal = document.getElementById("report-units");
const revenueTotal = document.getElementById("report-revenue");

const number = new Intl.NumberFormat("en-US");
const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
});

form.addEventListener("submit", event => {
    event.preventDefault();
    loadReport();
});

document.getElementById("report-reset").addEventListener("click", () => {
    form.reset();
    loadReport();
});

async function loadReport() {
    const params = new URLSearchParams();
    if (from.value) params.set("from", from.value);
    if (to.value) params.set("to", to.value);

    const buttons = form.querySelectorAll("button");
    buttons.forEach(button => { button.disabled = true; });

    products.replaceChildren();
    purchasesTotal.textContent = "—";
    unitsTotal.textContent = "—";
    revenueTotal.textContent = "—";
    message.textContent = "Loading sales report...";

    try {
        const query = params.toString();
        const response = await fetch(
            "/api/gift-shop/sales-report" + (query ? `?${query}` : "")
        );

        if (response.redirected || response.status === 401) {
            window.location.href = "/auth-staff";
            return;
        }

        if (response.status === 400) {
            message.textContent = "Enter a valid date range.";
            return;
        }

        if (!response.ok) {
            throw new Error(`Report request failed: ${response.status}`);
        }

        const report = await response.json();

        purchasesTotal.textContent = number.format(report.summary.PurchaseCount);
        unitsTotal.textContent = number.format(report.summary.UnitsSold);
        revenueTotal.textContent = currency.format(report.summary.Revenue);

        for (const product of report.products) {
            const row = products.insertRow();

            for (const value of [
                product.ProductName,
                number.format(product.PurchaseCount),
                number.format(product.UnitsSold),
                currency.format(product.Revenue)
            ]) {
                row.insertCell().textContent = value;
            }
        }

        message.textContent = report.products.length
            ? `Showing ${number.format(report.products.length)} products with sales.`
            : "No sales in this date range.";
    } catch (error) {
        console.error(error);
        message.textContent = "Unable to load the report. Please try again.";
    } finally {
        buttons.forEach(button => { button.disabled = false; });
    }
}

loadReport();