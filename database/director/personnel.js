
const { sql, getPool } = require("../connection");

async function createPersonnel({
    positionID,
    email,
    employmentStatus,
    dateOfBirth,
    startDate,
    endDate,
    ssn,
    phoneNumber,
    fname,
    mname,
    lname
}) {
    if (typeof fname !== "string" || !fname.trim()) {
        throw new TypeError("fname is required");
    }

    if (fname.trim().length > 50) {
        throw new TypeError("fname must not exceed 50 characters");
    }

    if (mname != null && mname.length > 50) {
        throw new TypeError("mname must not exceed 50 characters");
    }

    if (typeof lname !== "string" || !lname.trim()) {
        throw new TypeError("lname is required");
    }

    if (lname.trim().length > 50) {
        throw new TypeError("lname must not exceed 50 characters");
    }

    if (typeof dateOfBirth !== "string" || !dateOfBirth.trim()) {
        throw new TypeError("dateOfBirth is required");
    }

    if (typeof ssn !== "string" || !/^\d{9}$/.test(ssn)) {
        throw new TypeError("SSN must contain exactly 9 digits");
    }

    if (employmentStatus !== 0 && employmentStatus !== 1) {
        throw new TypeError("employmentStatus must be 0 or 1");
    }

    if (positionID != null && !Number.isInteger(positionID)) {
        throw new TypeError("positionID must be an integer or null");
    }

    if (email != null && email.length > 50) {
        throw new TypeError("email must not exceed 50 characters");
    }

    if (
        phoneNumber != null &&
        !/^\d{10}$/.test(phoneNumber)
    ) {
        throw new TypeError("phoneNumber must contain exactly 10 digits");
    }

    const pool = await getPool();

    const result = await pool.request()
        .input("PositionID", sql.Int, positionID ?? null)
        .input("Email", sql.NVarChar(50), email || null)
        .input("EmploymentStatus", sql.Bit, employmentStatus)
        .input("DateOfBirth", sql.Date, dateOfBirth)
        .input("StartDate", sql.Date, startDate || null)
        .input("EndDate", sql.Date, endDate || null)
        .input("SSN", sql.VarChar(9), ssn)
        .input("PhoneNumber", sql.VarChar(10), phoneNumber || null)
        .input("Fname", sql.NVarChar(50), fname.trim())
        .input("Mname", sql.NVarChar(50), mname?.trim() || null)
        .input("Lname", sql.NVarChar(50), lname.trim())
        .query(`
            INSERT INTO dbo.Personnel
            (
                PositionID,
                Email,
                EmploymentStatus,
                DateOfBirth,
                StartDate,
                EndDate,
                SSN,
                PhoneNumber,
                Fname,
                Mname,
                Lname
            )
            OUTPUT INSERTED.PersonnelID AS PersonnelID
            VALUES
            (
                @PositionID,
                @Email,
                @EmploymentStatus,
                @DateOfBirth,
                @StartDate,
                @EndDate,
                @SSN,
                @PhoneNumber,
                @Fname,
                @Mname,
                @Lname
            );
        `);

    return result.recordset[0];
}
/*
async function listPersonnel() {
    const pool = await getPool();

    const result = await pool.request()
        .query(`
            SELECT
                PersonnelID,
                PositionID,
                Email,
                EmploymentStatus,
                DateOfBirth,
                StartDate,
                EndDate,
                SSN,
                PhoneNumber,
                Fname,
                Mname,
                Lname
            FROM dbo.Personnel
            ORDER BY Lname, Fname;
        `);

    return result.recordset;
}*/

async function listPersonnel() {
    const pool = await getPool();

    const result = await pool.request()
        .query(`
            SELECT
                p.PersonnelID,
                p.PositionID,
                pos.PositionName,
                p.Email,
                p.EmploymentStatus,
                p.DateOfBirth,
                p.StartDate,
                p.EndDate,
                p.SSN,
                p.PhoneNumber,
                p.Fname,
                p.Mname,
                p.Lname
            FROM dbo.Personnel AS p
            LEFT JOIN dbo.POSITION AS pos
                ON p.PositionID = pos.PositionID
            ORDER BY p.Lname, p.Fname;
        `);

    return result.recordset;
}


async function deactivatePersonnel(personnelIDs){
    if(
        !Array.isArray(personnelIDs) ||
        personnelIDs.length === 0 ||
        !personnelIDs.every(
            id => Number.isInteger(id) && id > 0
        )
    ){
        throw new TypeError("Invalid Personnel IDs");
    }

    const uniqueIDs = [...new Set(personnelIDs)];
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try{
        const request = new sql.Request(transaction);

        const parameters = uniqueIDs.map((id, index) => {
            request.input(`id${index}`, sql.Int, id);
            return `@id${index}`;
        });
        
        const result = await request.query(`
            UPDATE dbo.Personnel
            SET 
                EmploymentStatus = 0,
                EndDate = CAST(GETDATE() AS DATE)
            WHERE EmploymentStatus = 1
                AND PersonnelID IN (${parameters.join(",")});
        `);

        await transaction.commit();

        return result.rowsAffected[0];
    }
    
    catch (error){
        await transaction.rollback();
        throw error;
    }

}

async function reactivatePersonnel(personnelIDs) {
    if (
        !Array.isArray(personnelIDs) ||
        personnelIDs.length === 0 ||
        !personnelIDs.every(
            id => Number.isInteger(id) && id > 0
        )
    ) {
        throw new TypeError("Invalid Personnel IDs");
    }

    const uniqueIDs = [...new Set(personnelIDs)];
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
        const request = new sql.Request(transaction);

        const parameters = uniqueIDs.map((id, index) => {
            request.input(`id${index}`, sql.Int, id);
            return `@id${index}`;
        });

        const result = await request.query(`
            UPDATE dbo.Personnel
            SET 
                EmploymentStatus = 1,
                EndDate = NULL
            WHERE EmploymentStatus = 0
                AND PersonnelID IN (${parameters.join(",")});
        `);

        await transaction.commit();

        return result.rowsAffected[0];
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}



module.exports = {
    createPersonnel,
    listPersonnel,
    deactivatePersonnel,
    reactivatePersonnel
};
