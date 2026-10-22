const { sql, getPool } = require("../connection");

// CREATE TABLE [dbo].[Membership] (
// [MembershipID] int NOT NULL IDENTITY(1,1),
// [TierID] int,
// [StartDate] datetime,
// [EndDate] datetime,
// [VisitorID] int NOT NULL,
// PRIMARY KEY ([MembershipID])
// );

// CREATE TABLE [dbo].[Tier] (
// [TierID] int NOT NULL IDENTITY(1,1),
// [TierName] nvarchar(50) NOT NULL,
// [Price] decimal(10,2) NOT NULL,
// [IsVIP] bit,
// [DiscountRate] decimal(5,4) NOT NULL,
// [Description] nvarchar(500) NOT NULL,
// PRIMARY KEY ([TierID])
// );

async function createTier({ TierName, Price, IsVIP, DiscountRate, Description }) {
    const pool = await getPool();
    const result = await pool.request()
        .input("TierName", sql.NVarChar(50), TierName)
        .input("Price", sql.Decimal(10, 2), Price)
        .input("IsVIP", sql.Bit, IsVIP || null)
        .input("DiscountRate", sql.Decimal(5, 4), DiscountRate)
        .input("Description", sql.NVarChar(500), Description)
        .query(`
            INSERT INTO dbo.Tier 
            (
                TierName, 
                Price, 
                IsVIP, 
                DiscountRate,
                Description
            ) 
            OUTPUT INSERTED.TierID AS TierID 
            VALUES 
            (
                @TierName, 
                @Price, 
                @IsVIP, 
                @DiscountRate,
                @Description
            ); 
        `);
    
     return result.recordset[0];
}

async function listTiers() {
    const pool = await getPool();

    const result = await pool.request()
        .query(`
            SELECT *
            FROM dbo.Tier
            ORDER BY Price;
        `);
  
    return result.recordset;
}

async function readTier(TierID) {
    const pool = await getPool();
    
    const result = await pool.request()
        .input("TierID", sql.Int, TierID)
        .query(`
            SELECT *
            FROM dbo.Tier
            WHERE TierID = @TierID
        `);
    
    return result.recordset[0] || null;
}

async function updateTier(
    TierID, { 
        TierName, 
        Price, 
        IsVIP, 
        DiscountRate,
        Description 
    }
) {
    const pool = await getPool();
    const result = await pool.request()
        .input("TierID", sql.Int, TierID)
        .input("TierName", sql.NVarChar(50), TierName)
        .input("Price", sql.Decimal(10, 2), Price)
        .input("IsVIP", sql.Bit, IsVIP || null)
        .input("DiscountRate", sql.Decimal(5, 4), DiscountRate)
        .input("Description", sql.NVarChar(500), Description)
        .query(`
            UPDATE dbo.Tier
            SET 
                TierName = @TierName,
                Price = @Price,
                IsVIP = @IsVIP,
                DiscountRate = @DiscountRate,
                Description = @Description
            OUTPUT INSERTED.*   
            WHERE TierID = @TierID;
        `);
    
    return result.recordset[0] || null;
}

async function deleteTier(TierID) {
    const pool = await getPool();
    const result = await pool.request()
        .input("TierID", sql.Int, TierID)
        .query(`
            DELETE FROM dbo.Tier
            OUTPUT DELETED.*
            WHERE TierID = @TierID;
        `);
    
    return result.recordset[0] || null;
}

module.exports = {
    createTier,
    listTiers,
    readTier,
    updateTier,
    deleteTier
};  