const { sql, getPool } = require("./connection");

async function createArtwork({
        title,
        category,
        medium,
        dimensions,
        creationDate,
        imageURL,
        artistId,
        collectionId,
        styleID,
        periodID
}) {
    if (typeof title !== "string" || !title.trim()) {
        throw new TypeError("title is required");
    }

    if (typeof category !== "string" || !category.trim()) {
        throw new TypeError("category is required");
    }

    if (typeof medium !== "string" || !medium.trim()) {
        throw new TypeError("medium is required");
    }

    if (!Number.isInteger(artistId)) {
        throw new TypeError("artistId is required and must be an integer");
    }

    if (!Number.isInteger(collectionId)) {
        throw new TypeError("collectionId is required and must be an integer");
    }

    const pool = await getPool();

    const result = await pool.request()
        .input("title", sql.NVarChar(100), title.trim())
        .input("category", sql.NVarChar(50), category.trim())
        .input("medium", sql.NVarChar(50), medium.trim())
        .input("dimensions", sql.NVarChar(50), dimensions || null)
        .input("creationDate", sql.Int, creationDate || null)
        .input("imageURL", sql.NVarChar(500), imageURL || null)
        .input("artistId", sql.Int, artistId)
        .input("collectionId", sql.Int, collectionId)
        .input("styleID", sql.Int, styleID || null)
        .input("periodID", sql.Int, periodID || null)
        .query(`
            INSERT INTO dbo.ARTWORKS
            (
                title,
                category,
                medium,
                dimensions,
                creationDate,
                imageURL,
                artistId,
                collectionId,
                styleID,
                periodID
            )
            OUTPUT INSERTED.*
            VALUES
            (
                @title,
                @category,
                @medium,
                @dimensions,
                @creationDate,
                @imageURL,
                @artistId,
                @collectionId,
                @styleID,
                @periodID
            );
        `);

    return result.recordset[0];
}

async function listArtwork() {
    const pool = await getPool();

    const result = await pool.request()
        .query(`
            SELECT
                a.accessionId,
                a.title,
                ar.fullName AS artist,
                a.creationDate
            FROM dbo.ARTWORKS a
            INNER JOIN dbo.ARTISTS ar
                ON a.artistId = ar.artistId
            ORDER BY a.title;
        `);

    return result.recordset;
}

async function readArtwork(accessionId) {
    const pool = await getPool();

    const result = await pool.request()
        .input("accessionId", sql.Int, accessionId)
        .query(`
            SELECT
                a.*,
                ar.fullName AS artist,
                c.collectionName AS collection,
                p.periodName AS period,
                s.styleName AS style
            FROM dbo.ARTWORKS a
            INNER JOIN dbo.ARTISTS ar
                ON a.artistId = ar.artistId
            INNER JOIN dbo.COLLECTIONS c
                ON a.collectionId = c.collectionId
            LEFT JOIN dbo.PERIODS p
                ON a.periodID = p.periodID
            LEFT JOIN dbo.STYLES s
                ON a.styleID = s.styleID 
            WHERE a.accessionId = @accessionId;
        `);

    return result.recordset[0] || null;
}

async function updateArtwork(
    accessionId,
    {
        title,
        category,
        medium,
        dimensions,
        creationDate,
        imageURL,
        artistId,
        collectionId,
        styleID,
        periodID
    }
) {
    if (typeof title !== "string" || !title.trim()) {
        throw new TypeError("title is required");
    }

    if (typeof category !== "string" || !category.trim()) {
        throw new TypeError("category is required");
    }

    if (typeof medium !== "string" || !medium.trim()) {
        throw new TypeError("medium is required");
    }

    if (!Number.isInteger(artistId)) {
        throw new TypeError("artistId is required and must be an integer");
    }

    if (!Number.isInteger(collectionId)) {
        throw new TypeError("collectionId is required and must be an integer");
    }

    const pool = await getPool();

    const result = await pool.request()
        .input("accessionId", sql.Int, accessionId)
        .input("title", sql.NVarChar(100), title.trim())
        .input("category", sql.NVarChar(50), category.trim())
        .input("medium", sql.NVarChar(50), medium.trim())
        .input("dimensions", sql.NVarChar(50), dimensions || null)
        .input("creationDate", sql.Int, creationDate || null)
        .input("imageURL", sql.NVarChar(500), imageURL || null)
        .input("artistId", sql.Int, artistId)
        .input("collectionId", sql.Int, collectionId)
        .input("styleID", sql.Int, styleID || null)
        .input("periodID", sql.Int, periodID || null)
        .query(`
            UPDATE dbo.ARTWORKS
            SET
                title=@title,
                category=@category,
                medium=@medium,
                dimensions=@dimensions,
                creationDate=@creationDate,
                imageURL=@imageURL,
                artistId=@artistId,
                collectionId=@collectionId,
                styleID=@styleID,
                periodID=@periodID
            OUTPUT INSERTED.*
            WHERE accessionId = @accessionId;
        `);

    return result.recordset[0] || null;
}

async function deleteArtwork(accessionId) {
    const pool = await getPool();

    const result = await pool.request()
        .input("accessionId", sql.Int, accessionId)
        .query(`
            DELETE FROM dbo.ARTWORKS
            OUTPUT DELETED.*
            WHERE accessionId = @accessionId;
        `);

    return result.recordset[0] || null;
}

module.exports = {
    createArtwork,
    listArtwork,
    readArtwork,
    updateArtwork,
    deleteArtwork
};