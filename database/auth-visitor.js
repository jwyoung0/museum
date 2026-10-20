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
            SELECT 
                v.VisitorID AS visitorId,
                va.email,
                va.userType
            FROM dbo.VISITOR_ACCOUNTS AS va
            INNER JOIN dbo.VISITOR AS v
                ON v.Email = va. email
            WHERE va.email = @email
                AND va.password = @password;           
        `);

    return result.recordset[0];
}

async function registerVisitorAccount({ name, email, password }) {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
        const result = await new sql.Request(transaction)
            .input("name", sql.VarChar(100), name)
            .input("email", sql.NVarChar(100), email)
            .input("password", sql.NVarChar(20), password)
            .query(`
                DECLARE @newVisitor TABLE (VisitorID int);
                DECLARE @visitorId int;

                INSERT INTO dbo.VISITOR (Name, Email)
                OUTPUT INSERTED.VisitorID INTO @newVisitor (VisitorID)
                VALUES (@name, @email);

                SELECT @visitorId = VisitorID
                FROM @newVisitor;

                INSERT INTO dbo.VISITOR_ACCOUNTS
                    (email, password, userType, LinkedVisitorID)
                VALUES
                    (@email, @password, N'visitor', @visitorId);

                SELECT @visitorId AS visitorId;
            `);

        await transaction.commit();
        return result.recordset[0];
    } catch (error) {
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error("Registration rollback failed:", rollbackError);
        }

        throw error;
    }
}

module.exports = {
    visitorLoginAttempt,
    registerVisitorAccount
}