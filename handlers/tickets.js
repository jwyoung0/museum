const { sql, getPool } = require("../database/connection");
const { readJsonBody } = require("../utils/http");


const ticketPrices = {
    1: 24.00, // Adult
    2: 20.00, // Student
    3: 0.00   // Child (12 & Under)
};

async function listTicketTypesHandler(req, res) {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT TicketTypeID, TicketTypeName
        FROM dbo.TICKET_TYPE
    `);

    const tickets = result.recordset.map(ticket => ({
        ...ticket,
        Price: ticketPrices[ticket.TicketTypeID] ?? null
    }));

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(tickets));
}

async function purchaseTicketHandler(req, res) {
    const data = await readJsonBody(req);

    const name = typeof data.name === "string"
        ? data.name.trim() : "";
    const email = typeof data.email === "string"
        ? data.email.trim() : "";
    const ticketTypeId = Number(data.ticketTypeId);

    if (!name || !email.includes("@") ||
        name.length > 100 || email.length > 150 ||
        !Number.isInteger(ticketTypeId) ||
        ticketPrices[ticketTypeId] === undefined) {
        const error = new Error("Invalid ticket information");
        error.statusCode = 400;
        throw error;
    }

    const price = ticketPrices[ticketTypeId];
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
        const result = await new sql.Request(transaction)
            .input("name", sql.VarChar(100), name)
            .input("email", sql.VarChar(150), email)
            .input("ticketTypeId", sql.Int, ticketTypeId)
            .input("price", sql.Decimal(10, 2), price)
            .query(`
                DECLARE @visitorId INT, @ticketId INT;

                SELECT TOP (1) @visitorId = VisitorID
                FROM dbo.VISITOR WITH (TABLOCKX, HOLDLOCK)
                WHERE Email = @email
                ORDER BY VisitorID;

                IF @visitorId IS NULL
                BEGIN
                    SELECT @visitorId = ISNULL(MAX(VisitorID), 0) + 1
                    FROM dbo.VISITOR;

                    INSERT INTO dbo.VISITOR
                        (VisitorID, Name, Email)
                    VALUES
                        (@visitorId, @name, @email);
                END;

                SELECT @ticketId = ISNULL(MAX(TicketID), 0) + 1
                FROM dbo.TICKET WITH (TABLOCKX, HOLDLOCK);

                INSERT INTO dbo.TICKET
                    (TicketID, TicketTypeID, Price,
                     PurchaseDate, VisitorID)
                VALUES
                    (@ticketId, @ticketTypeId, @price,
                     CAST(GETDATE() AS DATE), @visitorId);

                SELECT @ticketId AS TicketID,
                       @visitorId AS VisitorID,
                       @price AS Price;
            `);

        await transaction.commit();

        res.writeHead(201, {
            "Content-Type": "application/json"
        });

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

module.exports = {
    listTicketTypesHandler,
    purchaseTicketHandler
};
