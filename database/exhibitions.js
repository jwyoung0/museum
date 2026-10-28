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
        .input("status", sql.NVarChar(20), status)
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

async function listExhibitionArtworks(exhibitionId) {
    const pool = await getPool();

    const result = await pool.request()
        .input("exhibitionId", sql.Int, exhibitionId)
        .query(`
            SELECT
                a.accessionId,
                a.title,
                a.creationDate,
                a.imageURL,
                ar.fullName AS artist,
                c.collectionName AS collection
            FROM dbo.EXHIBITION_ARTWORK ea
            INNER JOIN dbo.ARTWORKS a
                ON a.accessionId = ea.accessionId
            INNER JOIN dbo.ARTISTS ar
                ON ar.artistId = a.artistId
            INNER JOIN dbo.COLLECTIONS c
                ON c.collectionId = a.collectionId
            WHERE ea.exhibitionId = @exhibitionId
            ORDER BY a.title;
        `);

    return result.recordset;
}

async function addArtworkToExhibition(exhibitionId, accessionId) {
    if (!Number.isInteger(exhibitionId) || !Number.isInteger(accessionId)) {
        throw new TypeError("Valid exhibition and artwork IDs are required");
    }

    const pool = await getPool();
    const result = await pool.request()
        .input("exhibitionId", sql.Int, exhibitionId)
        .input("accessionId", sql.Int, accessionId)
        .query(`
            IF NOT EXISTS (
                SELECT 1
                FROM dbo.EXHIBITIONS
                WHERE exhibitionId = @exhibitionId
            ) OR NOT EXISTS (
                SELECT 1
                FROM dbo.ARTWORKS
                WHERE accessionId = @accessionId
            )
                SELECT 'notFound' AS result;
            ELSE IF EXISTS (
                SELECT 1
                FROM dbo.EXHIBITION_ARTWORK
                WHERE exhibitionId = @exhibitionId
                  AND accessionId = @accessionId
            )
                SELECT 'alreadyAssigned' AS result;
            ELSE
            BEGIN
                INSERT INTO dbo.EXHIBITION_ARTWORK (exhibitionId, accessionId)
                VALUES (@exhibitionId, @accessionId);
                SELECT 'added' AS result;
            END;
        `);

    return result.recordset[0].result;
}

async function removeArtworkFromExhibition(exhibitionId, accessionId) {
    if (!Number.isInteger(exhibitionId) || !Number.isInteger(accessionId)) {
        throw new TypeError("Valid exhibition and artwork IDs are required");
    }

    const pool = await getPool();
    const result = await pool.request()
        .input("exhibitionId", sql.Int, exhibitionId)
        .input("accessionId", sql.Int, accessionId)
        .query(`
            DELETE FROM dbo.EXHIBITION_ARTWORK
            OUTPUT DELETED.*
            WHERE exhibitionId = @exhibitionId
              AND accessionId = @accessionId;
        `);

    return result.recordset[0] || null;
}

module.exports = {
    createExhibition,
    listExhibitions,
    readExhibition,
    updateExhibition,
    deleteExhibition,
    listExhibitionArtworks,
    addArtworkToExhibition,
    removeArtworkFromExhibition
};