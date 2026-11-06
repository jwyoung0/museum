SELECT
    alert.AlertID,
    product.ProductID,
    product.ProductName,
    alert.QuantityInStock,
    alert.CreatedAt,
    alert.ResolvedAt
FROM dbo.INVENTORY_ALERTS AS alert
INNER JOIN dbo.PRODUCTS AS product
    ON product.ProductID = alert.ProductID
ORDER BY alert.AlertID DESC;