const { sql, getPool } = require("./connection");

async function createArtist({
    fullName,
    placeOfBirth,
    birthYear,
    period,
    deathYear,
    sex,
    nationality
}) {
    if (typeof fullName !== "string" || !fullName.trim()) {
        throw new TypeError("fullName is required");
    }

    if (!Number.isInteger(birthYear)) {
        throw new TypeError("birthYear is required and must be an integer");
    }

    const pool = await getPool();

    const result = await pool.request()
        .input("fullName", sql.NVarChar(100), fullName.trim())
        .input("placeOfBirth", sql.NVarChar(100), placeOfBirth || null)
        .input("birthYear", sql.Int, birthYear)
        .input("period", sql.NVarChar(50), period || null)
        .input("deathYear", sql.Int, deathYear || null)
        .input("sex", sql.NVarChar(20), sex || null)
        .input("nationality", sql.NVarChar(50), nationality || null)
        .query(`
            INSERT INTO dbo.ARTISTS
            (
                fullName,
                placeOfBirth,
                birthYear,
                period,
                deathYear,
                sex,
                nationality
            )
            OUTPUT INSERTED.*
            VALUES
            (
                @fullName,
                @placeOfBirth,
                @birthYear,
                @period,
                @deathYear,
                @sex,
                @nationality
            );
        `);

    return result.recordset[0];
}

async function listArtists() {
    const pool = await getPool();

    const result = await pool.request()
        .query(`
            SELECT *
            FROM dbo.ARTISTS
            ORDER BY fullName;
        `);

    return result.recordset;
}

async function readArtist(artistId) {
    const pool = await getPool();

    const result = await pool.request()
        .input("artistId", sql.Int, artistId)
        .query(`
            SELECT *
            FROM dbo.ARTISTS
            WHERE artistId = @artistId;
        `);

    return result.recordset[0] || null;
}

async function updateArtist(
    artistId,
    {
        fullName,
        placeOfBirth,
        birthYear,
        period,
        deathYear,
        sex,
        nationality
    }
) {
    const pool = await getPool();

    const result = await pool.request()
        .input("artistId", sql.Int, artistId)
        .input("fullName", sql.NVarChar(100), fullName)
        .input("placeOfBirth", sql.NVarChar(100), placeOfBirth || null)
        .input("birthYear", sql.Int, birthYear)
        .input("period", sql.NVarChar(50), period || null)
        .input("deathYear", sql.Int, deathYear || null)
        .input("sex", sql.NVarChar(20), sex || null)
        .input("nationality", sql.NVarChar(50), nationality || null)
        .query(`
            UPDATE dbo.ARTISTS
            SET
                fullName = @fullName,
                placeOfBirth = @placeOfBirth,
                birthYear = @birthYear,
                period = @period,
                deathYear = @deathYear,
                sex = @sex,
                nationality = @nationality
            OUTPUT INSERTED.*
            WHERE artistId = @artistId;
        `);

    return result.recordset[0] || null;
}

async function deleteArtist(artistId) {
    const pool = await getPool();

    const result = await pool.request()
        .input("artistId", sql.Int, artistId)
        .query(`
            DELETE FROM dbo.ARTISTS
            OUTPUT DELETED.*
            WHERE artistId = @artistId;
        `);

    return result.recordset[0] || null;
}

module.exports = {
    createArtist,
    listArtists,
    readArtist,
    updateArtist,
    deleteArtist
};