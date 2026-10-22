const { listSales } = require("../../database/gift-shop/sales");

async function listSalesHandler(req, res) {
    const sales = await listSales();

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(sales));
}

module.exports = { listSalesHandler };