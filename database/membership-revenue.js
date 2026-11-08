const { sql, getPool } = require("./connection");

async function getMembershipRevenue({ period, year }) {
    const pool = await getPool();
    const request = pool.request()
        .input("period", sql.NVarChar(10), period)
        .input("year", sql.Int, year);

    const result = await request.query(`
        DECLARE @startDate date;
        DECLARE @endDate date;

        IF @period = 'this-month'
        BEGIN
            SET @startDate = DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1);
            SET @endDate = DATEADD(MONTH, 1, @startDate);
        END
        ELSE IF @period = 'this-year'
        BEGIN
            SET @startDate = DATEFROMPARTS(YEAR(GETDATE()), 1, 1);
            SET @endDate = DATEADD(YEAR, 1, @startDate);
        END
        ELSE
        BEGIN
            SET @startDate = DATEFROMPARTS(@year, 1, 1);
            SET @endDate = DATEADD(YEAR, 1, @startDate);
        END;

        SELECT
            T.TierName,
            COUNT(*) AS MembershipsSold,
            SUM(T.Price) AS EstimatedRevenue
        FROM dbo.Membership M
        INNER JOIN dbo.Tier T
            ON M.TierID = T.TierID
        WHERE M.StartDate >= @startDate
            AND M.StartDate < @endDate
        GROUP BY T.TierName
        ORDER BY T.TierName;
    `);

    return result.recordset;
}

module.exports = { getMembershipRevenue };
