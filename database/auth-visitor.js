const { sql, getPool } = require("./connection");

async function visitorLoginAttempt({ email, password }) {
    if (typeof email !== "string" || !email.trim()) {
        throw new TypeError("Email address is required");
    }

    if (typeof password !== "string" || !password.trim()) {
        throw new TypeError("password is required");
    }

    const pool = await getPool();

    const result = await pool.request()
        .input("email", sql.NVarChar(255), email.trim())
        .input("password", sql.NVarChar(255), password)
        .query(`
           SELECT email, userType
           FROM dbo.VISITOR_ACCOUNTS
           WHERE email = @email AND password = @password;            
        `);

    return result.recordset[0];
}

module.exports = {
    visitorLoginAttempt
}