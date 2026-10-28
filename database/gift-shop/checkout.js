const { sql, getPool } = require("../connection");

async function hasActiveMembership(visitorId) {
    const pool = await getPool();

    const result = await pool.request()
        .input("visitorId", sql.Int, visitorId)
        .query(`
            SELECT TOP (1) MembershipID
            FROM dbo.Membership
            WHERE VisitorID = @visitorId
              AND StartDate IS NOT NULL
              AND EndDate IS NOT NULL
              AND CONVERT(date, StartDate) <= CONVERT(date, GETDATE())
              AND CONVERT(date, EndDate) >= CONVERT(date, GETDATE());
        `);

    return result.recordset.length > 0;
}

async function purchaseProduct({ productId, quantity, visitorId }) {
    if (
        !Number.isInteger(productId) ||
        productId < 1 ||
        productId > 2147483647
    ) {
        throw new TypeError("Invalid product ID.");
    }

    if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 2147483647
    ) {
        throw new TypeError("Quantity must be a positive whole number.");
    }

    if (
        visitorId != null &&
        (!Number.isInteger(visitorId) ||
            visitorId < 1 ||
            visitorId > 2147483647)
    ) {
        throw new TypeError("Invalid visitor ID.");
    }

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
        const result = await new sql.Request(transaction)
            .input("productId", sql.Int, productId)
            .input("quantity", sql.Int, quantity)
            .input("visitorId", sql.Int, visitorId ?? null)
            .query(`
                DECLARE @PurchasedProduct TABLE (
                    ProductID INT,
                    ProductName NVARCHAR(100),
                    RegularPrice DECIMAL(10, 2)
                );

                -- Reduce stock only if enough is available.
                UPDATE dbo.PRODUCTS
                SET QuantityInStock = QuantityInStock - @quantity
                OUTPUT
                    INSERTED.ProductID,
                    INSERTED.ProductName,
                    INSERTED.Price
                INTO @PurchasedProduct
                WHERE ProductID = @productId
                  AND QuantityInStock >= @quantity;

                IF NOT EXISTS (SELECT 1 FROM @PurchasedProduct)
                    THROW 50001, 'Product unavailable or insufficient stock.', 1;

                DECLARE @isMember BIT = 0;

                IF @visitorId IS NOT NULL AND EXISTS (
                    SELECT 1
                    FROM dbo.Membership
                    WHERE VisitorID = @visitorId
                      AND StartDate IS NOT NULL
                      AND EndDate IS NOT NULL
                      AND CONVERT(date, StartDate) <= CONVERT(date, GETDATE())
                      AND CONVERT(date, EndDate) >= CONVERT(date, GETDATE())
                )
                    SET @isMember = 1;

                DECLARE @unitPrice DECIMAL(10, 2);

                SELECT @unitPrice = CASE
                    WHEN @isMember = 1
                        THEN ROUND(RegularPrice * 0.90, 2)
                    ELSE RegularPrice
                END
                FROM @PurchasedProduct;

                INSERT INTO dbo.SHOP_PURCHASE (VISITORID, [DateTime])
                VALUES (@visitorId, SYSUTCDATETIME());

                DECLARE @purchaseId INT = CONVERT(INT, SCOPE_IDENTITY());

                INSERT INTO dbo.SHOP_PURCHASE_DETAILS (
                    PURCHASEID,
                    PRODUCTID,
                    Quantity,
                    UnitPrice
                )
                VALUES (
                    @purchaseId,
                    @productId,
                    @quantity,
                    @unitPrice
                );

                SELECT
                    @purchaseId AS PurchaseID,
                    ProductID,
                    ProductName,
                    @quantity AS Quantity,
                    @unitPrice AS UnitPrice,
                    @isMember AS IsMember,
                    @unitPrice * @quantity AS Total
                FROM @PurchasedProduct;
            `);

        await transaction.commit();
        return result.recordset[0];
    } catch (error) {
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error("Purchase rollback failed:", rollbackError);
        }

        if (error.number === 50001) {
            error.statusCode = 409;
        }

        throw error;
    }
}

module.exports = {
    hasActiveMembership,
    purchaseProduct
};