const { sql, getPool } = require("../database/connection");
const { readJsonBody } = require("../utils/http");

// Get the logged-in visitor's information
async function getVisitorProfileHandler(req, res) {
    if (!req.user || !["visitor", "member"].includes(req.user.userType)) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Please sign in first" }));
        return;
    }

    const pool = await getPool();

    const result = await pool.request()
        .input("email", sql.VarChar(150), req.user.email)
        .query(`
            SELECT TOP 1 VisitorID, Name, Email
            FROM dbo.VISITOR
            WHERE Email = @email
            ORDER BY VisitorID
        `);

    if (result.recordset.length === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Visitor profile not found" }));
        return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.recordset[0]));
}

async function updateVisitorProfileHandler(req, res) {
    if (!req.user || !["visitor", "member"].includes(req.user.userType)) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Please sign in first" }));
        return;
    }

    const data = await readJsonBody(req);
    const name = typeof data.name === "string" ? data.name.trim() : "";

    if (!name || name.length > 50) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Enter a valid name (1-50 characters)" }));
        return;
    }

    const pool = await getPool();

    const result = await pool.request()
        .input("name", sql.VarChar(50), name)
        .input("email", sql.VarChar(150), req.user.email)
        .query(`
            UPDATE dbo.VISITOR
            SET Name = @name
            OUTPUT INSERTED.VisitorID, INSERTED.Name, INSERTED.Email
            WHERE VisitorID = (
                SELECT TOP 1 VisitorID
                FROM dbo.VISITOR
                WHERE Email = @email
                ORDER BY VisitorID
            )
        `);

    if (result.recordset.length === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Visitor profile not found" }));
        return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result.recordset[0]));
}

module.exports = {
    getVisitorProfileHandler,
    updateVisitorProfileHandler
};