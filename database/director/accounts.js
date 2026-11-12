const { sql, getPool } = require("../connection");

async function searchPersonnelForAccounts(searchTerm) {
    if (typeof searchTerm !== "string") {
        throw new TypeError("searchTerm must be a string");
    }

    const pool = await getPool();
    const searchPattern = `%${searchTerm.trim()}%`;

    const result = await pool.request()
        .input("searchTerm", sql.NVarChar(100), searchTerm.trim())
        .input("searchPattern", sql.NVarChar(202), searchPattern)
        .query(`
            SELECT
                p.PersonnelID,
                p.Fname,
                p.Mname,
                p.Lname,
                pos.PositionName,
                p.StartDate,
                CASE WHEN ua.personnelID IS NULL THEN 0 ELSE 1 END AS AccountExists,
                ua.email AS AccountEmail,
                ua.role AS AccountRole
            FROM dbo.Personnel AS p
            LEFT JOIN dbo.POSITION AS pos
                ON p.PositionID = pos.PositionID
            LEFT JOIN dbo.STAFF_ACCOUNT AS ua
                ON ua.personnelID = p.PersonnelID
            WHERE @searchTerm = N''
                OR p.Fname LIKE @searchPattern
                OR p.Mname LIKE @searchPattern
                OR p.Lname LIKE @searchPattern
                OR CONCAT(
                    p.Fname,
                    N' ',
                    COALESCE(p.Mname + N' ', N''),
                    p.Lname
                ) LIKE @searchPattern
                OR CONVERT(NVARCHAR(20), p.PersonnelID) LIKE @searchPattern
            ORDER BY p.Lname, p.Fname;
        `);

    return result.recordset;
}

async function createUserAccount({
    email,
    password,
    role,
    personnelId
}) {
    if (typeof email !== "string" || !email.trim()) {
        throw new TypeError("email is required");
    }
    if (typeof password !== "string" || !password.trim()) {
        throw new TypeError("password is required");
    }
    if (typeof role !== "string" || !role.trim()) {
        throw new TypeError("password is required");
    }    
    if (!Number.isInteger(personnelId)) {
        throw new TypeError("personnelId is required and must be an integer");
    }    

    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
        const personnelCheck = await new sql.Request(transaction)
            .input("personnelId", sql.Int, personnelId)
            .query(`
                SELECT PersonnelID
                FROM dbo.Personnel
                WHERE PersonnelID = @personnelId
            `);
        
        if (personnelCheck.recordset.length === 0) {
            const error = new Error("Personnel record not found");
            error.statusCode = 404;
            throw error;
        }

        const accountCheck = await new sql.Request(transaction)
            .input("personnelId", sql.Int, personnelId)
            .query(`
                SELECT userID
                FROM dbo.STAFF_ACCOUNT
                WHERE personnelID = @personnelId    
            `);

        if (accountCheck.recordset.length > 0) {
            const error = new Error("Personnel already has an account");
            error.statusCode = 409;
            throw error;
        }

        const emailCheck = await new sql.Request(transaction)
            .input("email", sql.NVarChar(20), email)
            .query(`
               SELECT email
               FROM dbo.STAFF_ACCOUNT
               WHERE email = @email  
            `);

        if (emailCheck.recordset.length > 0) {
            const error = new Error ("email already exists.");
            error.statusCode = 409;
            throw error;
        }

        const result = await new sql.Request(transaction)
            .input("email", sql.NVarChar(50), email)
            .input("password", sql.NVarChar(20), password)
            .input("role", sql.NVarChar(20), role)
            .input("personnelId", sql.Int, personnelId)
            .query(`
                INSERT INTO dbo.STAFF_ACCOUNT
                (
                    email,
                    password,
                    role,
                    personnelID
                )
                OUTPUT INSERTED.userID
                VALUES
                (
                    @email,
                    @password,
                    @role,
                    @personnelId
                );
            `);            

        await transaction.commit();

        return {
            success: true,
            userID: result.recordset[0].userID
        };
    } catch (error) {
        await transaction.rollback();

        throw error;
    }
}

async function updateUserAccount({
    email,
    password,
    role,
    personnelId
}) {
    if (typeof email !== "string" || !email.trim()) {
        throw new TypeError("email is required");
    }
    if (typeof role !== "string" || !role.trim()) {
        throw new TypeError("role is required");
    }
    if (password !== null && typeof password !== "string") {
        throw new TypeError("password must be a string or null");
    }
    if (!Number.isInteger(personnelId)) {
        throw new TypeError("personnelId is required and must be an integer");
    }

    const pool = await getPool();
    const emailCheck = await pool.request()
        .input("email", sql.NVarChar(50), email.trim())
        .input("personnelId", sql.Int, personnelId)
        .query(`
            SELECT personnelID
            FROM dbo.STAFF_ACCOUNT
            WHERE email = @email AND personnelID <> @personnelId
        `);

    if (emailCheck.recordset.length > 0) {
        const error = new Error("Email already exists.");
        error.statusCode = 409;
        throw error;
    }

    const result = await pool.request()
        .input("email", sql.NVarChar(50), email.trim())
        .input("password", sql.NVarChar(20), password)
        .input("role", sql.NVarChar(20), role)
        .input("personnelId", sql.Int, personnelId)
        .query(`
            UPDATE dbo.STAFF_ACCOUNT
            SET email = @email,
                password = COALESCE(@password, password),
                role = @role
            OUTPUT INSERTED.personnelID
            WHERE personnelID = @personnelId
        `);

    if (result.recordset.length === 0) {
        const error = new Error("Account not found");
        error.statusCode = 404;
        throw error;
    }

    return { success: true };
}

async function deleteUserAccount(personnelId) {
    if (!Number.isInteger(personnelId)) {
        throw new TypeError("personnelId is required and must be an integer");
    }

    const pool = await getPool();
    const result = await pool.request()
        .input("personnelId", sql.Int, personnelId)
        .query(`
            DELETE FROM dbo.STAFF_ACCOUNT
            OUTPUT DELETED.personnelID
            WHERE personnelID = @personnelId
        `);

    if (result.recordset.length === 0) {
        const error = new Error("Account not found");
        error.statusCode = 404;
        throw error;
    }

    return { success: true };
}

module.exports = {
    searchPersonnelForAccounts,
    createUserAccount,
    updateUserAccount,
    deleteUserAccount
};