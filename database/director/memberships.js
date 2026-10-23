const { sql, getPool } = require("../connection");

async function createTier({
    TierName,
    Price,
    DiscountRate,
    Description,
    Benefits = []
}) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const tierResult = await new sql.Request(transaction)
            .input("TierName", sql.NVarChar(50), TierName)
            .input("Price", sql.Decimal(10, 2), Price)
            .input("DiscountRate", sql.Decimal(5, 4), DiscountRate)
            .input("Description", sql.NVarChar(500), Description)
            .query(`
                INSERT INTO dbo.Tier
                (
                    TierName,
                    Price,
                    DiscountRate,
                    Description
                )
                OUTPUT INSERTED.TierID
                VALUES
                (
                    @TierName,
                    @Price,
                    @DiscountRate,
                    @Description
                );
            `);

        const TierID = tierResult.recordset[0].TierID;

        for (const benefit of Benefits) {
            await new sql.Request(transaction)
                .input("TierID", sql.Int, TierID)
                .input("BenefitID", sql.Int, benefit.BenefitID)
                .input("Quantity", sql.Int, benefit.Quantity || null)
                .query(`
                    INSERT INTO dbo.TIER_BENEFIT
                    (
                        TierID,
                        BenefitID,
                        Quantity
                    )
                    VALUES
                    (
                        @TierID,
                        @BenefitID,
                        @Quantity
                    );
                `);
        }

        await transaction.commit();

        return { TierID };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function listTiers() {
    const pool = await getPool();

    const result = await pool.request()
        .query(`
            SELECT
                t.TierID,
                t.TierName,
                t.Price,
                t.DiscountRate,
                t.Description,
                b.BenefitID,
                b.BenefitName,
                tb.Quantity
            FROM dbo.Tier t
            LEFT JOIN dbo.TIER_BENEFIT tb
                ON t.TierID = tb.TierID
            LEFT JOIN dbo.BENEFIT b
                ON tb.BenefitID = b.BenefitID
            ORDER BY
                t.Price,
                b.BenefitName;
        `);

    return result.recordset;
}

async function listBenefits() {
    const pool = await getPool();

    const result = await pool.request()
        .query(`
            SELECT
                BenefitID,
                BenefitName
            FROM dbo.BENEFIT
            ORDER BY BenefitName;
        `);

    return result.recordset;
}

async function readTier(TierID) {
    const pool = await getPool();

    const tierResult = await pool.request()
        .input("TierID", sql.Int, TierID)
        .query(`
            SELECT *
            FROM dbo.Tier
            WHERE TierID = @TierID;
        `);

    if (!tierResult.recordset.length) {
        return null;
    }

    const benefitResult = await pool.request()
        .input("TierID", sql.Int, TierID)
        .query(`
            SELECT
                b.BenefitID,
                b.BenefitName,
                tb.Quantity
            FROM dbo.TIER_BENEFIT tb
            INNER JOIN dbo.BENEFIT b
                ON tb.BenefitID = b.BenefitID
            WHERE tb.TierID = @TierID;
        `);

    return {
        ...tierResult.recordset[0],
        Benefits: benefitResult.recordset
    };
}

async function updateTier(
    TierID,
    {
        TierName,
        Price,
        DiscountRate,
        Description,
        Benefits = []
    }
) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        await new sql.Request(transaction)
            .input("TierID", sql.Int, TierID)
            .input("TierName", sql.NVarChar(50), TierName)
            .input("Price", sql.Decimal(10, 2), Price)
            .input("DiscountRate", sql.Decimal(5, 4), DiscountRate)
            .input("Description", sql.NVarChar(500), Description)
            .query(`
                UPDATE dbo.Tier
                SET
                    TierName = @TierName,
                    Price = @Price,
                    DiscountRate = @DiscountRate,
                    Description = @Description
                WHERE TierID = @TierID;
            `);

        await new sql.Request(transaction)
            .input("TierID", sql.Int, TierID)
            .query(`
                DELETE FROM dbo.TIER_BENEFIT
                WHERE TierID = @TierID;
            `);

        for (const benefit of Benefits) {
            await new sql.Request(transaction)
                .input("TierID", sql.Int, TierID)
                .input("BenefitID", sql.Int, benefit.BenefitID)
                .input("Quantity", sql.Int, benefit.Quantity || null)
                .query(`
                    INSERT INTO dbo.TIER_BENEFIT
                    (
                        TierID,
                        BenefitID,
                        Quantity
                    )
                    VALUES
                    (
                        @TierID,
                        @BenefitID,
                        @Quantity
                    );
                `);
        }

        await transaction.commit();

        return await readTier(TierID);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function deleteTier(TierID) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        await new sql.Request(transaction)
            .input("TierID", sql.Int, TierID)
            .query(`
                DELETE FROM dbo.TIER_BENEFIT
                WHERE TierID = @TierID;
            `);

        const result = await new sql.Request(transaction)
            .input("TierID", sql.Int, TierID)
            .query(`
                DELETE FROM dbo.Tier
                OUTPUT DELETED.*
                WHERE TierID = @TierID;
            `);

        await transaction.commit();

        return result.recordset[0] || null;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

module.exports = {
    createTier,
    listTiers,
    listBenefits,
    readTier,
    updateTier,
    deleteTier
};