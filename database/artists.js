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

module.exports = {
    createArtist
};