const { sql, getPool } = require("./connection");

async function createMembershipPurchase({ tierId, visitorId }) {
    const pool = await getPool();

    const result = await pool.request()
        .input("tierId", sql.Int, tierId)
        .input("visitorId", sql.Int, visitorId)
        .query(`
            DECLARE @membership TABLE (
                MembershipID int,
                TierID int,
                StartDate datetime,
                EndDate datetime
            );
            DECLARE @startDate datetime = GETDATE();

            INSERT INTO dbo.Membership (TierID, StartDate, EndDate, VisitorID)
            OUTPUT
                INSERTED.MembershipID,
                INSERTED.TierID,
                INSERTED.StartDate,
                INSERTED.EndDate
            INTO @membership (MembershipID, TierID, StartDate, EndDate)
            SELECT
                @tierId,
                @startDate,
                DATEADD(YEAR, 1, @startDate),
                @visitorId
            WHERE EXISTS (
                SELECT 1
                FROM dbo.Tier
                WHERE TierID = @tierId
            );

            SELECT MembershipID, TierID, StartDate, EndDate
            FROM @membership;
        `);

    return result.recordset[0] || null;
}

module.exports = { createMembershipPurchase };
