const { sql, getPool } = require("../database/connection");

// Report 1: Ticket sales by type
async function ticketSalesByTypeHandler(req, res) {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT
            TT.TicketTypeName,
            COUNT(*) AS TicketsSold,
            SUM(T.Price) AS TotalRevenue
        FROM dbo.TICKET T
        JOIN dbo.TICKET_TYPE TT
            ON T.TicketTypeID = TT.TicketTypeID
        GROUP BY TT.TicketTypeName
        ORDER BY TicketsSold DESC
    `);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.recordset));
}

// Report 2: Daily ticket sales
async function dailyTicketSalesHandler(req, res) {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT
            CAST(T.PurchaseDate AS DATE) AS PurchaseDate,
            COUNT(*) AS TicketsSold,
            COUNT(DISTINCT TT.TicketTypeID) AS TicketTypesSold,
            SUM(T.Price) AS TotalRevenue
        FROM dbo.TICKET T
        JOIN dbo.TICKET_TYPE TT
            ON T.TicketTypeID = TT.TicketTypeID
        GROUP BY CAST(T.PurchaseDate AS DATE)
        ORDER BY PurchaseDate DESC
    `);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.recordset));
}

// Report 3: Visitor purchase summary
async function visitorPurchaseSummaryHandler(req, res) {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT
            V.VisitorID,
            V.Name,
            COUNT(T.TicketID) AS TicketsPurchased,
            SUM(T.Price) AS TotalSpent
        FROM dbo.VISITOR V
        JOIN dbo.TICKET T
            ON V.VisitorID = T.VisitorID
        GROUP BY V.VisitorID, V.Name
        ORDER BY TotalSpent DESC
    `);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.recordset));
}

async function membershipRevenueHandler(req, res) {
    const url = new URL(req.url, "http://localhost");
    const period = url.searchParams.get("period") || "this-month";
    const yearValue = url.searchParams.get("year");
    const currentYear = new Date().getFullYear();
    const year = Number(yearValue);

    if (
        !["this-month", "this-year", "year"].includes(period) ||
        (period === "year" &&
            (!/^\d{4}$/.test(yearValue || "") ||
                !Number.isInteger(year) ||
                year < 1900 ||
                year > currentYear))
    ) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Choose a valid membership revenue period." }));
        return;
    }

    const pool = await getPool();
    const request = pool.request()
        .input("period", sql.NVarChar(10), period)
        .input("year", sql.Int, period === "year" ? year : currentYear);

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

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.recordset));
}

module.exports = {
    ticketSalesByTypeHandler,
    dailyTicketSalesHandler,
    visitorPurchaseSummaryHandler,
    membershipRevenueHandler
};
