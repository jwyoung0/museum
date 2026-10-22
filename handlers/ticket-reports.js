const { getPool } = require("../database/connection");

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
            PurchaseDate,
            COUNT(*) AS TicketsSold,
            SUM(Price) AS TotalRevenue
        FROM dbo.TICKET
        GROUP BY PurchaseDate
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

module.exports = {
    ticketSalesByTypeHandler,
    dailyTicketSalesHandler,
    visitorPurchaseSummaryHandler
};
