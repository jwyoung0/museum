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
                p.StartDate
            FROM dbo.Personnel AS p
            LEFT JOIN dbo.POSITION AS pos
                ON p.PositionID = pos.PositionID
            WHERE NOT EXISTS (
                SELECT 1
                FROM dbo.USER_ACCOUNT AS ua
                WHERE ua.personnelID = p.PersonnelID
            )
                AND (
                    @searchTerm = N''
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
                )
            ORDER BY p.Lname, p.Fname;
        `);

    return result.recordset;
}

async function createUserAccount({
    username,
    password,
    role,
    personnelId
}) {
    if (typeof username !== "string" || !username.trim()) {
        throw new TypeError("username is required");
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
                FROM dbo.USER_ACCOUNT
                WHERE personnelID = @personnelId    
            `);

        if (accountCheck.recordset.length > 0) {
            const error = new Error("Personnel already has an account");
            error.statusCode = 409;
            throw error;
        }

        const usernameCheck = await new sql.Request(transaction)
            .input("username", sql.NVarChar(20), username)
            .query(`
               SELECT username
               FROM dbo.USER_ACCOUNT
               WHERE username = @username  
            `);

        if (usernameCheck.recordset.length > 0) {
            const error = new Error ("Username already exists.");
            error.statusCode = 409;
            throw error;
        }

        const result = await new sql.Request(transaction)
            .input("username", sql.NVarChar(20), username)
            .input("password", sql.NVarChar(12), password)
            .input("role", sql.NVarChar(20), role)
            .input("personnelId", sql.Int, personnelId)
            .query(`
                INSERT INTO dbo.USER_ACCOUNT
                (
                    username,
                    password,
                    role,
                    personnelID
                )
                OUTPUT INSERTED.userID
                VALUES
                (
                    @username,
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

module.exports = {
    searchPersonnelForAccounts,
    createUserAccount
}