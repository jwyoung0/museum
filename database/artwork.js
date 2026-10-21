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

async function readArtworkForVisitor(accessionId, visitorId) {
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

    const artwork = result.recordset[0] || null;

    if (!artwork) {return null};

    await pool.request()
        .input("artworkId", sql.Int, accessionId)
        .input("visitorId", sql.Int, visitorId)
        .query(`
            INSERT INTO dbo.ARTWORK_VIEW (ArtworkID, VisitorID)
            VALUES (@artworkId, @visitorId);    
        `);

    return artwork;
}

module.exports = {
    listArtworkForVisitor,
    readArtworkForVisitor
};