const { getSalesReport } = require("../../database/gift-shop/sales-report");

function parseDate(value) {
    if (value === null || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) {
        return undefined;
    }

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

    const rawProductId = searchParams.get("productId");
    const productId = rawProductId === null || rawProductId === ""
        ? null
        : Number(rawProductId);

    const headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
    };

    if (!from || !to || from > to || searchParams.get("to") === "9999-12-31") {
        res.writeHead(400, headers);
        res.end(JSON.stringify({ error: "Enter a valid start and end date." }));
        return;
    }

    if (productId !== null &&
        (!/^[1-9]\d*$/.test(rawProductId) || productId > 2147483647)) {
        res.writeHead(400, headers);
        res.end(JSON.stringify({ error: "Select a valid product." }));
        return;
    }

    // Include the full end date by using midnight the next day as the cutoff.
    const until = new Date(to.getTime() + 86400000);
    const report = await getSalesReport({ from, until, productId });

    res.writeHead(200, headers);
    res.end(JSON.stringify(report));
}

module.exports = { salesReportHandler };