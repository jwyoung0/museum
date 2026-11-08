const { getMembershipRevenue } = require("../database/membership-revenue");

async function membershipRevenueHandler(req, res) {
    const url = new URL(req.url, "http://localhost");
    const period = url.searchParams.get("period") || "this-month";
    const yearValue = url.searchParams.get("year");
    const currentYear = new Date().getFullYear();
    const year = Number(yearValue);

    if (
        !["this-month", "this-year", "year"].includes(period) ||
        (period === "year" &&
            (!/^\d{4}$/.test(yearValue || "") ||
                !Number.isInteger(year) ||
                year < 1900 ||
                year > currentYear))
    ) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Choose a valid membership revenue period." }));
        return;
    }

    const report = await getMembershipRevenue({
        period,
        year: period === "year" ? year : currentYear
    });

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(report));
}

module.exports = { membershipRevenueHandler };
