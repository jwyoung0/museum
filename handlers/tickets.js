const { sql, getPool } = require("../database/connection");
const { readJsonBody } = require("../utils/http");

async function listTicketTypesHandler(req, res) {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT TicketTypeID, TicketTypeName, Price
        FROM dbo.TICKET_TYPE
        WHERE Price IS NOT NULL
        ORDER BY TicketTypeID
    `);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.recordset));
}

async function purchaseTicketHandler(req, res) {
    const data = await readJsonBody(req);

    const name = typeof data.name === "string" ? data.name.trim() : "";
    const email = typeof data.email === "string" ? data.email.trim() : "";
    const ticketTypeId = Number(data.ticketTypeId);
    const visitDate = data.visitDate;

    if (!visitDate) {
        throw new Error("Please select a visit date");
    }

    if (!name || !email.includes("@") ||
        name.length > 100 || email.length > 150 ||
        !Number.isInteger(ticketTypeId) || ticketTypeId <= 0) {
        const error = new Error("Invalid ticket information");
        error.statusCode = 400;
        throw error;
    }

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
        const priceResult = await new sql.Request(transaction)
            .input("ticketTypeId", sql.Int, ticketTypeId)
            .query(`
                SELECT Price
                FROM dbo.TICKET_TYPE WITH (HOLDLOCK)
                WHERE TicketTypeID = @ticketTypeId
            `);

        const price = priceResult.recordset[0]?.Price;

        if (price == null || !Number.isFinite(Number(price)) ||
            Number(price) < 0) {
            const error = new Error("Invalid ticket type or price");
            error.statusCode = 400;
            throw error;
        }

        const result = await new sql.Request(transaction)
            .input("name", sql.VarChar(100), name)
            .input("email", sql.VarChar(150), email)
            .input("ticketTypeId", sql.Int, ticketTypeId)
            .input("price", sql.Decimal(10, 2), Number(price))
            .input("visitDate", sql.VarChar(10), visitDate)
            .query(`
                DECLARE @visitorId INT, @ticketId INT;

                SELECT TOP (1) @visitorId = VisitorID
                FROM dbo.VISITOR WITH (TABLOCKX, HOLDLOCK)
                WHERE Email = @email
                ORDER BY VisitorID;

                IF @visitorId IS NULL
                BEGIN
                    INSERT INTO dbo.VISITOR (Name, Email)
                    VALUES (@name, @email);

                    SET @visitorId = CAST(SCOPE_IDENTITY() AS INT);
                END;

                SELECT @ticketId = ISNULL(MAX(TicketID), 0) + 1
                FROM dbo.TICKET WITH (TABLOCKX, HOLDLOCK);

                INSERT INTO dbo.TICKET
                    (TicketID, TicketTypeID, Price, PurchaseDate, VisitDate, VisitorID)
                VALUES
                    (@ticketId, @ticketTypeId, @price,
                    CAST(GETDATE() AS DATE),
                    CONVERT(DATE, @visitDate, 23), @visitorId);

                SELECT
                    @ticketId AS TicketID,
                    @visitorId AS VisitorID,
                    @price AS Price;
            `);

        await transaction.commit();

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            message: "Ticket purchased successfully",
            ...result.recordset[0]
        }));

    } catch (error) {
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error("Rollback failed:", rollbackError);
        }

        throw error;
    }
}

async function listMyTicketsHandler(req, res) {
    if (!req.user || !["visitor", "member"].includes(req.user.userType)) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Please sign in first" }));
        return;
    }

    const pool = await getPool();

    const result = await pool.request()
        .input("email", sql.VarChar(150), req.user.email)
        .query(`
            SELECT
                T.TicketID,
                TT.TicketTypeName,
                T.Price,
                T.PurchaseDate
            FROM dbo.TICKET T
            JOIN dbo.VISITOR V ON T.VisitorID = V.VisitorID
            JOIN dbo.TICKET_TYPE TT ON T.TicketTypeID = TT.TicketTypeID
            WHERE V.Email = @email
            ORDER BY T.TicketID DESC
        `);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.recordset));
}

module.exports = {
    listTicketTypesHandler,
    purchaseTicketHandler,
    listMyTicketsHandler
};