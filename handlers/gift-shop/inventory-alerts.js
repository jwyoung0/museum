const {
    listInventoryAlerts
} = require("../../database/gift-shop/inventory-alerts");

async function listInventoryAlertsHandler(req, res) {
    const alerts = await listInventoryAlerts();

    res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
    });

    res.end(JSON.stringify(alerts));
}

module.exports = { listInventoryAlertsHandler };