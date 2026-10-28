const { getPool } = require("../connection");

async function listInventoryAlerts() {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT
            alert.AlertID,
            product.ProductID,
            product.ProductName,
            alert.QuantityInStock,
            alert.CreatedAt
        FROM dbo.INVENTORY_ALERTS AS alert
        INNER JOIN dbo.PRODUCTS AS product
            ON product.ProductID = alert.ProductID
        WHERE alert.ResolvedAt IS NULL
        ORDER BY
            alert.QuantityInStock,
            product.ProductName;
    `);

    return result.recordset;
}

module.exports = { listInventoryAlerts };