const { getPool, sql } = require("../connection");

async function getSalesReport({ from, until, productId = null }) {
    const pool = await getPool();

    const { recordsets: [totals, details] } = await pool.request()
        .input("FromDate", sql.Date, from)
        .input("UntilDate", sql.Date, until)
        .input("ProductID", sql.Int, productId)
        .query(`
            SET NOCOUNT ON;

            -- Use the same filtered purchase lines for the totals and details.
            SELECT
                purchase.PURCHASEID AS PurchaseID,
                purchase.VISITORID AS VisitorID,
                purchase.[DateTime] AS PurchaseDate,
                product.ProductID,
                product.ProductName,
                detail.Quantity,
                detail.UnitPrice,
                detail.Quantity * detail.UnitPrice AS LineTotal
            INTO #ReportLines
            FROM dbo.SHOP_PURCHASE AS purchase
            INNER JOIN dbo.SHOP_PURCHASE_DETAILS AS detail
                ON detail.PURCHASEID = purchase.PURCHASEID
            INNER JOIN dbo.PRODUCTS AS product
                ON product.ProductID = detail.PRODUCTID
            WHERE purchase.[DateTime] >= @FromDate
              AND purchase.[DateTime] < @UntilDate
              AND (@ProductID IS NULL OR detail.PRODUCTID = @ProductID);

            SELECT
                COUNT_BIG(DISTINCT PurchaseID) AS PurchaseCount,
                COALESCE(SUM(CONVERT(bigint, Quantity)), 0) AS UnitsSold,
                COALESCE(SUM(LineTotal), 0) AS Revenue
            FROM #ReportLines;

            SELECT PurchaseID, PurchaseDate, VisitorID, ProductID, ProductName,
                   Quantity, UnitPrice, LineTotal
            FROM #ReportLines
            ORDER BY PurchaseDate DESC, PurchaseID DESC, ProductID;
        `);

    const [grandTotal] = totals;

    return {
        summary: {
            PurchaseCount: grandTotal?.PurchaseCount ?? 0,
            UnitsSold: grandTotal?.UnitsSold ?? 0,
            Revenue: grandTotal?.Revenue ?? 0
        },
        details
    };
}

module.exports = { getSalesReport };