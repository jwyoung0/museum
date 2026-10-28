const { getPool } = require("../connection");

async function listSales() {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT
            purchase.PURCHASEID AS PurchaseID,
            purchase.VISITORID AS VisitorID,
            purchase.[DateTime] AS PurchaseDate,
            details.PRODUCTID AS ProductID,
            product.ProductName,
            details.Quantity,
            details.UnitPrice,
            details.Quantity * details.UnitPrice AS LineTotal
        FROM dbo.SHOP_PURCHASE AS purchase
        INNER JOIN dbo.SHOP_PURCHASE_DETAILS AS details
            ON details.PURCHASEID = purchase.PURCHASEID
        INNER JOIN dbo.PRODUCTS AS product
            ON product.ProductID = details.PRODUCTID
        ORDER BY
            purchase.[DateTime] DESC,
            purchase.PURCHASEID DESC,
            product.ProductName;
    `);

    return result.recordset;
}

module.exports = { listSales };