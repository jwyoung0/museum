const form = document.getElementById("sales-report-form");
const from = document.getElementById("sales-from");
const to = document.getElementById("sales-to");
const reportStatus = document.getElementById("sales-report-status");
const reportSummary = document.getElementById("sales-report-summary");
const historySearch = document.getElementById("sales-history-search");
const search = document.getElementById("sales-search");
const transactionsHeading = document.getElementById("sales-transactions-heading");
const transactionStatus = document.getElementById("sales-summary");
const tbody = document.getElementById("sales-table-body");
const controls = form.querySelectorAll("button, input");

const number = new Intl.NumberFormat("en-US");
const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const timestamp = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
});

let allSales = [];

function setBusy(busy) {
    controls.forEach(control => { control.disabled = busy; });
}

function addRow(values) {
    const row = tbody.insertRow();
    for (const value of values) row.insertCell().textContent = value;
}

function showTableMessage(message) {
    const cell = tbody.insertRow().insertCell();
    cell.colSpan = 7;
    cell.textContent = message;
}

function renderSales(lines, emptyMessage) {
    tbody.replaceChildren();
    for (const line of lines) {
        addRow([
            line.PurchaseID,
            timestamp.format(new Date(line.PurchaseDate)),
            line.VisitorID ?? "Guest",
            line.ProductName,
            number.format(line.Quantity),
            currency.format(line.UnitPrice),
            currency.format(line.LineTotal)
        ]);
    }

    if (!lines.length) showTableMessage(emptyMessage);
    transactionStatus.textContent = lines.length
        ? `${number.format(lines.length)} transaction line(s).`
        : "";
}

async function fetchSales(url) {
    const response = await fetch(url);
    if (response.redirected || response.status === 401) {
        window.location.href = "/auth-staff";
        return null;
    }
    if (!response.ok) throw new Error(`Sales request failed: ${response.status}`);
    return response.json();
}

function filterHistory() {
    if (!reportSummary.hidden) return;

    const term = search.value.trim().toLowerCase();
    const matches = allSales.filter(line =>
        [line.PurchaseID, line.VisitorID ?? "Guest", line.ProductName]
            .some(value => String(value).toLowerCase().includes(term))
    );

    renderSales(matches, term ? "No transactions match your search." : "No sales recorded yet.");
}

async function loadHistory() {
    setBusy(true);
    reportSummary.hidden = true;
    historySearch.hidden = true;
    transactionsHeading.textContent = "Transaction History";
    transactionStatus.textContent = "Loading sales...";
    tbody.replaceChildren();

    try {
        const lines = await fetchSales("/api/gift-shop/sales");
        if (!lines) return;
        allSales = lines;
        historySearch.hidden = false;
        filterHistory();
    } catch (error) {
        console.error(error);
        transactionStatus.textContent = "Unable to load sales history.";
    } finally {
        setBusy(false);
    }
}

async function generateReport() {
    const params = new URLSearchParams({ from: from.value, to: to.value });
    setBusy(true);
    reportStatus.textContent = "Generating sales report...";

    try {
        const report = await fetchSales(`/api/gift-shop/sales-report?${params}`);
        if (!report) return;

        document.getElementById("sales-report-range").textContent =
            `${params.get("from")} through ${params.get("to")} (UTC)`;
        document.getElementById("sales-purchase-count").textContent =
            number.format(report.summary.PurchaseCount);
        document.getElementById("sales-units-sold").textContent =
            number.format(report.summary.UnitsSold);
        document.getElementById("sales-revenue").textContent =
            currency.format(report.summary.Revenue);

        historySearch.hidden = true;
        transactionsHeading.textContent = "Report Transactions";
        renderSales(report.details, "No transactions in this date range.");
        reportSummary.hidden = false;
        reportStatus.textContent = "Sales report generated.";
    } catch (error) {
        console.error(error);
        reportStatus.textContent = "Unable to generate the report. Please try again.";
    } finally {
        setBusy(false);
    }
}

search.addEventListener("input", filterHistory);

form.addEventListener("submit", event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (from.value > to.value) {
        reportStatus.textContent = "The end date must be on or after the start date.";
        return;
    }
    generateReport();
});

form.addEventListener("reset", () => {
    reportStatus.textContent = "";
    search.value = "";
    loadHistory();
});

loadHistory();
