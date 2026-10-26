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
            .input("name", sql.NVarChar(100), name)
            .input("email", sql.NVarChar(50), email)
            .input("password", sql.NVarChar(20), password)
            .query(`
                DECLARE @visitorId INT;

                SELECT @visitorId = VisitorID
                FROM dbo.VISITOR
                WHERE Email = @email;

                IF @visitorId IS NULL
                BEGIN
                    INSERT INTO dbo.VISITOR
                    (
                        Name,
                        Email
                    )
                    VALUES
                    (
                        @name,
                        @email
                    );

                    SET @visitorId = SCOPE_IDENTITY();
                END

                IF EXISTS
                (
                    SELECT 1
                    FROM dbo.VISITOR_ACCOUNTS
                    WHERE LinkedVisitorID = @visitorId
                )
                BEGIN
                    THROW 50001, 'An account already exists for this email address.', 1;
                END

                INSERT INTO dbo.VISITOR_ACCOUNTS
                (
                    LinkedVisitorID,
                    email,
                    password,
                    userType
                )
                VALUES
                (
                    @visitorId,
                    @email,
                    @password,
                    N'visitor'
                );

                SELECT @visitorId AS visitorId;
            `);

        await transaction.commit();

        return {
            success: true,
            visitorId: result.recordset[0].visitorId
        };
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