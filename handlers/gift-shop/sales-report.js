const { getSalesReport } = require("../../database/gift-shop/sales-report");

function parseDate(value) {
    if (value === null || value === "") return null;
    if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return undefined;

    const date = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value) {
        return undefined;
    }

    return date;
}

async function salesReportHandler(req, res) {
    const { searchParams } = new URL(req.url, "http://localhost");
    const from = parseDate(searchParams.get("from"));
    const to = parseDate(searchParams.get("to"));

    const headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
    };

    if (from === undefined || to === undefined ||
        (from && to && from > to) ||
        searchParams.get("to") === "9999-12-31") {
        res.writeHead(400, headers);
        res.end(JSON.stringify({ error: "Enter a valid date range." }));
        return;
    }

    // Include the entire end date by stopping at midnight the next day.
    const until = to ? new Date(to.getTime() + 86400000) : null;
    const report = await getSalesReport({ from, until });

    res.writeHead(200, headers);
    res.end(JSON.stringify(report));
}

module.exports = { salesReportHandler };