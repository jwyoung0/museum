-- Run on the museum database after the initial gift shop inventory-alert script.
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;
    IF COL_LENGTH(N'dbo.PRODUCTS', N'IsArchived') IS NULL
        ALTER TABLE dbo.PRODUCTS
            ADD IsArchived BIT CONSTRAINT DF_PRODUCTS_IsArchived DEFAULT (0) NOT NULL;
    -- Keep existing IDs and their foreign keys. Only non-IDENTITY schemas need a sequence.
    IF COLUMNPROPERTY(OBJECT_ID(N'dbo.PRODUCTS'), N'ProductID', 'IsIdentity') = 0
       AND NOT EXISTS (SELECT 1
                       FROM   sys.default_constraints AS dc
                              INNER JOIN
                              sys.columns AS c
                              ON c.object_id = dc.parent_object_id
                                 AND c.column_id = dc.parent_column_id
                       WHERE  dc.parent_object_id = OBJECT_ID(N'dbo.PRODUCTS')
                              AND c.name = N'ProductID'
                              AND dc.name = N'DF_PRODUCTS_ProductID_Sequence')
        BEGIN
            DECLARE @nextId AS BIGINT;
            SELECT @nextId = COALESCE (MAX(CONVERT (BIGINT, ProductID)), 0) + 1
            FROM   dbo.PRODUCTS WITH (TABLOCKX, HOLDLOCK);
            IF @nextId < 1
                SET @nextId = 1;
            IF @nextId > 2147483647
                THROW 50002, 'No remaining integer product IDs.', 1;
            DECLARE @sequenceSql AS NVARCHAR (MAX) = N'CREATE SEQUENCE dbo.ProductIdSequence AS int START WITH ' + CONVERT (NVARCHAR (20), @nextId) + N' INCREMENT BY 1 NO CYCLE;';
            EXECUTE sys.sp_executesql @sequenceSql;
            EXECUTE sys.sp_executesql N'
            ALTER TABLE dbo.PRODUCTS ADD CONSTRAINT DF_PRODUCTS_ProductID_Sequence
                DEFAULT (NEXT VALUE FOR dbo.ProductIdSequence) FOR ProductID;';
        END
    -- Resolve open alerts when stock is replenished or a product is archived.
    EXECUTE sys.sp_executesql N'
        CREATE OR ALTER TRIGGER dbo.trg_PRODUCTS_LowStock
        ON dbo.PRODUCTS
        AFTER INSERT, UPDATE
        AS
        BEGIN
            SET NOCOUNT ON;

            UPDATE alert
            SET QuantityInStock = product.QuantityInStock,
                ResolvedAt = CASE
                    WHEN product.IsArchived = 1 OR product.QuantityInStock > 5
                        THEN SYSUTCDATETIME()
                    ELSE NULL
                END
            FROM dbo.INVENTORY_ALERTS AS alert
            INNER JOIN inserted AS product ON product.ProductID = alert.ProductID
            WHERE alert.ResolvedAt IS NULL;

            INSERT INTO dbo.INVENTORY_ALERTS (ProductID, QuantityInStock)
            SELECT product.ProductID, product.QuantityInStock
            FROM inserted AS product
            WHERE product.IsArchived = 0 AND product.QuantityInStock <= 5
              AND NOT EXISTS (
                  SELECT 1 FROM dbo.INVENTORY_ALERTS AS alert
                  WHERE alert.ProductID = product.ProductID AND alert.ResolvedAt IS NULL
              );
        END;';
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK;
    THROW;
END CATCH