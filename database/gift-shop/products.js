const { sql, getPool } = require("../connection");

async function listProducts() {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT
            ProductID,
            ProductName,
            Category,
            Price,
            QuantityInStock,
            ImageURL
        FROM dbo.PRODUCTS
        WHERE IsArchived = 0
        ORDER BY ProductName;
    `);

    return result.recordset;
}

function validateProductId(productId) {
    if (
        !Number.isInteger(productId) ||
        productId < 1 ||
        productId > 2147483647
    ) {
        throw new TypeError("Product ID must be a positive whole number.");
    }
}

function validateProduct(product) {
    const {
        ProductName,
        Category,
        Price,
        QuantityInStock,
        ImageURL
    } = product;

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

    if (
        ImageURL != null &&
        (typeof ImageURL !== "string" || ImageURL.trim().length > 500)
    ) {
        throw new TypeError(
            "Image URL must be text with at most 500 characters."
        );
    }

    if (typeof ImageURL === "string" && ImageURL.trim()) {
        const imagePath = ImageURL.trim();

        if (
            !imagePath.startsWith("/images/") ||
            imagePath.includes("..") ||
            imagePath.includes("\\") ||
            imagePath.includes("?") ||
            imagePath.includes("#")
        ) {
            throw new TypeError(
                "Use a local image path such as /images/shop/museum-mug.jpg."
            );
        }
    }
}

async function createProduct(product) {
    validateProduct(product);

    const {
        ProductName,
        Category,
        Price,
        QuantityInStock,
        ImageURL
    } = product;

    const pool = await getPool();

    const result = await pool.request()
        .input("ProductName", sql.NVarChar(100), ProductName.trim())
        .input("Category", sql.NVarChar(50), Category.trim())
        .input("Price", sql.Decimal(10, 2), Price)
        .input("QuantityInStock", sql.Int, QuantityInStock)
        .input("ImageURL", sql.NVarChar(500), ImageURL?.trim() || null)
        .query(`
            DECLARE @createdProducts TABLE (
                ProductID int
            );

            INSERT INTO dbo.PRODUCTS (
                ProductName,
                Category,
                Price,
                QuantityInStock,
                ImageURL
            )
            OUTPUT INSERTED.ProductID
                INTO @createdProducts (ProductID)
            VALUES (
                @ProductName,
                @Category,
                @Price,
                @QuantityInStock,
                @ImageURL
            );

            SELECT
                p.ProductID,
                p.ProductName,
                p.Category,
                p.Price,
                p.QuantityInStock,
                p.ImageURL
            FROM dbo.PRODUCTS AS p
            INNER JOIN @createdProducts AS c
                ON c.ProductID = p.ProductID;
        `);

    return result.recordset[0];
}

async function updateProduct(product) {
    validateProductId(product.ProductID);
    validateProduct(product);

    const {
        ProductID,
        ProductName,
        Category,
        Price,
        QuantityInStock,
        ImageURL
    } = product;

    const pool = await getPool();

    const result = await pool.request()
        .input("ProductID", sql.Int, ProductID)
        .input("ProductName", sql.NVarChar(100), ProductName.trim())
        .input("Category", sql.NVarChar(50), Category.trim())
        .input("Price", sql.Decimal(10, 2), Price)
        .input("QuantityInStock", sql.Int, QuantityInStock)
        .input("ImageURL", sql.NVarChar(500), ImageURL?.trim() || null)
        .query(`
            DECLARE @updatedProducts TABLE (
                ProductID int
            );

            UPDATE dbo.PRODUCTS
            SET
                ProductName = @ProductName,
                Category = @Category,
                Price = @Price,
                QuantityInStock = @QuantityInStock,
                ImageURL = @ImageURL
            OUTPUT INSERTED.ProductID
                INTO @updatedProducts (ProductID)
            WHERE ProductID = @ProductID AND IsArchived = 0;

            SELECT
                p.ProductID,
                p.ProductName,
                p.Category,
                p.Price,
                p.QuantityInStock,
                p.ImageURL
            FROM dbo.PRODUCTS AS p
            INNER JOIN @updatedProducts AS u
                ON u.ProductID = p.ProductID;
        `);

    return result.recordset[0] || null;
}

async function archiveProduct(productId) {
    validateProductId(productId);
    const pool = await getPool();
    const result = await pool.request()
        .input("ProductID", sql.Int, productId)
        .query(`
            DECLARE @archivedProducts TABLE (ProductID int);

            UPDATE dbo.PRODUCTS
            SET IsArchived = 1
            OUTPUT INSERTED.ProductID INTO @archivedProducts (ProductID)
            WHERE ProductID = @ProductID AND IsArchived = 0;

            SELECT ProductID FROM @archivedProducts;
        `);

    return result.recordset.length > 0;
}

module.exports = {
    listProducts,
    createProduct,
    updateProduct,
    archiveProduct
};
