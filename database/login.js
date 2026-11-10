const { sql, getPool } = require("./connection");

async function staffLoginAttempt({ email, password }) {
    if (typeof email !== "string" || !email.trim()) {
        throw new TypeError("username is required");
    }

    if (typeof password !== "string" || !password.trim()) {
        throw new TypeError("password is required");
    }

    const pool = await getPool();

    const result = await pool.request()
        .input("email", sql.NVarChar(50), email.trim())
        .input("password", sql.NVarChar(20), password)
        .query(`
           SELECT email, role
           FROM dbo.STAFF_ACCOUNT
           WHERE email = @email AND password = @password;            
        `);

    return result.recordset[0];
}

module.exports = {
    staffLoginAttempt
}