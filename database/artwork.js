const { sql, getPool } = require("./connection");

async function listArtworkForVisitor() {
    const pool = await getPool();

    const result = await pool.request()
        .query(`
            SELECT
                a.accessionId,
                a.title,
                ar.fullName AS artist,
                a.creationDate,
                a.imageURL
            FROM dbo.ARTWORKS a
            INNER JOIN dbo.ARTISTS ar
                ON a.artistId = ar.artistId
            ORDER BY a.title;            
        `);

    return result.recordset;
}

async function readArtworkForVisitor(accessionId) {
    const pool = await getPool();

    const result = await pool.request()
        .input("accessionId", sql.Int, accessionId)
        .query(`
            SELECT
                a.*,
                ar.fullName AS artist,
                c.collectionName AS collection
            FROM dbo.ARTWORKS a
            INNER JOIN dbo.ARTISTS ar
                ON a.artistId = ar.artistId
            INNER JOIN dbo.COLLECTIONS c
                ON a.collectionId = c.collectionId 
            WHERE a.accessionId = @accessionId;            
        `);

    return result.recordset[0] || null;
}

module.exports = {
    listArtworkForVisitor,
    readArtworkForVisitor
};