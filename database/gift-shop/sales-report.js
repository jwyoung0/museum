const { getPool, sql } = require("../connection");

async function getSalesReport({ from = null, until = null } = {}) {
    const pool = await getPool();

    const { recordset } = await pool.request()
        .input("FromDate", sql.Date, from)
        .input("UntilDate", sql.Date, until)
        .query(`
            SELECT
                -- 1 identifies the grand total; 0 identifies a product row.
                GROUPING(product.ProductID) AS IsSummary,
                product.ProductID,
                product.ProductName,

                -- Count each purchase once, even if it contains multiple items.
                COUNT_BIG(DISTINCT purchase.PURCHASEID) AS PurchaseCount,

                -- Add up the quantities sold. Use 0 if there are no sales.
                COALESCE(SUM(CONVERT(bigint, detail.Quantity)), 0) AS UnitsSold,

                -- Use the unit price recorded at checkout to calculate revenue.
                COALESCE(SUM(detail.Quantity * detail.UnitPrice), 0) AS Revenue

            -- Join purchases to their line items and get each product's name.
            FROM dbo.SHOP_PURCHASE AS purchase
            INNER JOIN dbo.SHOP_PURCHASE_DETAILS AS detail
                ON detail.PURCHASEID = purchase.PURCHASEID
            INNER JOIN dbo.PRODUCTS AS product
                ON product.ProductID = detail.PRODUCTID

            -- A NULL date leaves that side of the range unrestricted.
            -- UntilDate is midnight after the selected end date.
            WHERE (@FromDate IS NULL OR purchase.[DateTime] >= @FromDate)
              AND (@UntilDate IS NULL OR purchase.[DateTime] < @UntilDate)

            -- Return one row per product and one grand-total row.
            -- The empty grouping () produces the grand total.
            GROUP BY GROUPING SETS (
                (product.ProductID, product.ProductName),
                ()
            )

            -- Put the grand total first, then rank products by revenue.
            ORDER BY
                IsSummary DESC,
                Revenue DESC,
                product.ProductName,
                product.ProductID;
        `);

    // If the query returns no rows, show zero totals and an empty product list.
    const [summary = {
        PurchaseCount: 0,
        UnitsSold: 0,
        Revenue: 0
    }, ...products] = recordset;

    return {
        summary: {
            PurchaseCount: summary.PurchaseCount,
            UnitsSold: summary.UnitsSold,
            Revenue: summary.Revenue
        },
        products: products.map(({
            ProductID,
            ProductName,
            PurchaseCount,
            UnitsSold,
            Revenue
        }) => ({
            ProductID,
            ProductName,
            PurchaseCount,
            UnitsSold,
            Revenue
        }))
    };
}

module.exports = { getSalesReport };