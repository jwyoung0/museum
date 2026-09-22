const { sql, getPool } = require("./connection");

async function loginAttempt({ username, password }) {
    if (typeof username !== "string" || !username.trim()) {
        throw new TypeError("username is required");
    }

    if (typeof password !== "string" || !password.trim()) {
        throw new TypeError("password is required");
    }

    const pool = await getPool();

    const result = await pool.request()
        .input("username", sql.NVarChar(255), username.trim())
        .input("password", sql.NVarChar(255), password)
        .query(`
           SELECT username, role
           FROM dbo.authentication
           WHERE username = @username AND password = @password;            
        `);

    return result.recordset[0];
}

module.exports = {
    loginAttempt
}