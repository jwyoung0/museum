
const { getPool } = require("../database/connection");

async function listTicketTypesHandler(req, res) {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT TicketTypeID, TicketTypeName
        FROM dbo.TICKET_TYPE
    `);

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(result.recordset));
}

module.exports = {
    listTicketTypesHandler
};
