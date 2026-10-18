const { sql, getPool } = require("./connection");

async function createExhibition({ 
    exhibitionName, 
    description,
    startDate,
    endDate
}) {
    if (typeof exhibitionName !== "string" || !exhibitionName.trim()) {
        throw new TypeError("Exhibition name is required");
    }
    if (!startDate) {throw new TypeError("Start date is required");}
    if (!endDate) {throw new TypeError("End date is required");}
    if (new Date(endDate) < new Date(startDate)) {
        throw new RangeError("End date must be after start date");
    }

    const today = new Date();

    let status;

    if (today < new Date(startDate)) {
        status = "upcoming";
    } else if (today > new Date(endDate)) {
        status = "archived";
    } else {
        status = "active";
    }


    const pool = await getPool();

    const result = await pool.request()
        .input("exhibitionName", sql.NVarChar(100), exhibitionName.trim())
        .input("description", sql.NVarChar(500), description || null)
        .input("startDate", sql.Date, startDate)
        .input("endDate", sql.Date, endDate)
        .input("status", )
        .query(`
            INSERT INTO dbo.EXHIBITIONS
            (
                exhibitionName,
                description,
                startDate,
                endDate,
                status
            )
            OUTPUT INSERTED.*
            VALUES
            (
                @exhibitionName,
                @description,
                @startDate,
                @endDate,
                @status
            );
        `);

    return result.recordset[0];
}

async function listExhibitions() {
    const pool = await getPool();

    const result = await pool.request()
        .query(`
            SELECT *
            FROM dbo.EXHIBITIONS
            ORDER BY exhibitionName;    
        `);

    return result.recordset;
}

async function readExhibition(exhibitionId) {
    const pool = await getPool();

    const result = await pool.request()
        .input("exhibitionId", sql.Int, exhibitionId)
        .query(`
            SELECT *
            FROM dbo.EXHIBITIONS
            WHERE exhibitionId = @exhibitionId;    
        `);

    return result.recordset[0] || null;
}

async function updateExhibition(
    exhibitionId, {
        exhibitionName,
        description,
        startDate,
        endDate,
        status
    }
) {
    if (typeof exhibitionName !== "string" || !exhibitionName.trim()) {
        throw new TypeError("Exhibition name is required");
    }
    if (!startDate) {throw new TypeError("Start date is required");}
    if (!endDate) {throw new TypeError("End date is required");}
    if (new Date(endDate) < new Date(startDate)) {
        throw new RangeError("End date must be after start date");
    }

    const today = new Date();

    let status;

    if (today < new Date(startDate)) {
        status = "upcoming";
    } else if (today > new Date(endDate)) {
        status = "archived";
    } else {
        status = "active";
    }

    const pool = await getPool();

    const result = await pool.request()
        .input("exhibitionId", sql.Int, exhibitionId)
        .input("exhibitionName", sql.NVarChar(100), exhibitionName.trim())
        .input("description", sql.NVarChar(500), description || null)
        .input("startDate", sql.Date, startDate)
        .input("endDate", sql.Date, endDate)
        .input("status", sql.NVarChar(20), status)
        .query(`
            UPDATE dbo.EXHIBITIONS
            SET
                exhibitionName = @exhibitionName,
                description = @description,
                startDate = @startDate,
                endDate = @endDate,
                status = @status
            OUTPUT INSERTED.*
            WHERE exhibitionId = @exhibitionId;
        `);

    return result.recordset[0] || null;

}

async function deleteExhibition(exhibitionId) {
    if (!Number.isInteger(exhibitionId)) {
        throw new TypeError("Valid exhibition ID is required");
    }

    const pool = await getPool();

    const result = await pool.request()
        .input("exhibitionId", sql.Int, exhibitionId)
        .query(`
            UPDATE dbo.EXHIBITIONS
            SET status = 'archived'
            OUTPUT INSERTED.*
            WHERE exhibitionId = @exhibitionId;
        `);

    return result.recordset[0] || null;
}

module.exports = {
    createExhibition,
    listExhibitions,
    readExhibition,
    updateExhibition,
    deleteExhibition
};