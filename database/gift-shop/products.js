const { sql, getPool } = require("../connection");

async function listProducts() {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT
            ProductID,
            ProductName,
            Category,
            Price,
            QuantityInStock
        FROM dbo.PRODUCTS
        ORDER BY ProductName;
    `);

    return result.recordset;
}

function validateProduct(product) {
    const {
        ProductID,
        ProductName,
        Category,
        Price,
        QuantityInStock
    } = product;

    if (
        !Number.isInteger(ProductID) ||
        ProductID < 1 ||
        ProductID > 2147483647
    ) {
        throw new TypeError("Product ID must be a positive whole number.");
    }

    if (
        typeof ProductName !== "string" ||
        !ProductName.trim() ||
        ProductName.trim().length > 100
    ) {
        throw new TypeError("Product name must contain 1–100 characters.");
    }

    if (
        typeof Category !== "string" ||
        !Category.trim() ||
        Category.trim().length > 50
    ) {
        throw new TypeError("Category must contain 1–50 characters.");
    }

    if (
        typeof Price !== "number" ||
        !Number.isFinite(Price) ||
        Price < 0 ||
        Price > 99999999.99 ||
        Math.abs(Price * 100 - Math.round(Price * 100)) > 0.000001
    ) {
        throw new TypeError(
            "Price must be between 0 and 99999999.99, with at most two decimal places."
        );
    }

    if (
        !Number.isInteger(QuantityInStock) ||
        QuantityInStock < 0 ||
        QuantityInStock > 2147483647
    ) {
        throw new TypeError("Stock must be a nonnegative whole number.");
    }
}

async function createProduct(product) {
    validateProduct(product);

    const {
        ProductID,
        ProductName,
        Category,
        Price,
        QuantityInStock
    } = product;

    const pool = await getPool();

    try {
        const result = await pool.request()
            .input("ProductID", sql.Int, ProductID)
            .input("ProductName", sql.NVarChar(100), ProductName.trim())
            .input("Category", sql.NVarChar(50), Category.trim())
            .input("Price", sql.Decimal(10, 2), Price)
            .input("QuantityInStock", sql.Int, QuantityInStock)
            .query(`
                INSERT INTO dbo.PRODUCTS (
                    ProductID,
                    ProductName,
                    Category,
                    Price,
                    QuantityInStock
                )
                OUTPUT INSERTED.*
                VALUES (
                    @ProductID,
                    @ProductName,
                    @Category,
                    @Price,
                    @QuantityInStock
                );
            `);

        return result.recordset[0];
    } catch (error) {
        if (error.number === 2627 || error.number === 2601) {
            const duplicateError = new Error(
                "That Product ID already exists. Choose a different ID."
            );

            duplicateError.statusCode = 409;
            throw duplicateError;
        }

        throw error;
    }
}

async function updateProduct(product) {
    validateProduct(product);

    const {
        ProductID,
        ProductName,
        Category,
        Price,
        QuantityInStock
    } = product;

    const pool = await getPool();

    const result = await pool.request()
        .input("ProductID", sql.Int, ProductID)
        .input("ProductName", sql.NVarChar(100), ProductName.trim())
        .input("Category", sql.NVarChar(50), Category.trim())
        .input("Price", sql.Decimal(10, 2), Price)
        .input("QuantityInStock", sql.Int, QuantityInStock)
        .query(`
            UPDATE dbo.PRODUCTS
            SET
                ProductName = @ProductName,
                Category = @Category,
                Price = @Price,
                QuantityInStock = @QuantityInStock
            OUTPUT INSERTED.*
            WHERE ProductID = @ProductID;
        `);

    return result.recordset[0] || null;
}

module.exports = {
    listProducts,
    createProduct,
    updateProduct
};