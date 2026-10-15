const { getPool } = require("./connection");

async function listStyles() {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT styleID, styleName
        FROM dbo.STYLES
        ORDER BY styleName 
    `);
    return result.recordset;
}

async function listPeriods() {
    const pool = await getPool();
    const result = await pool.request().query(`
       SELECT periodID, periodName
       FROM dbo.PERIODS
       ORDER BY periodName; 
    `);
    return result.recordset;
}

async function listCollections() {
    const pool = await getPool();
    const result = await pool.request().query(`
       SELECT collectionId, collectionName
       FROM dbo.COLLECTIONS
       ORDER BY collectionName;
    `);
    return result.recordset;
}

async function listArtists() {
    const pool = await getPool();
    const result = await pool.request().query(`
       SELECT artistId, fullName
       FROM dbo.ARTISTS
       ORDER BY fullName;
    `);
    return result.recordset;
}

module.exports = { listStyles , listPeriods, listCollections, listArtists };
