const { sql, getPool } = require("../connection");

async function createCollection({ collectionName, description }) {
    if (typeof collectionName !== "string" || !collectionName.trim()) {
        throw new TypeError("Collection name is required");
    }

    const pool = await getPool();

    const result = await pool.request()
        .input("collectionName", sql.NVarChar(50), collectionName.trim())
        .input("description", sql.NVarChar(250), description || null)
        .query(`
            INSERT INTO dbo.COLLECTIONS
            (
                collectionName,
                description
            )
            OUTPUT INSERTED.*
            VALUES
            (
                @collectionName,
                @description
            );
        `);

    return result.recordset[0];
}

async function listCollections() {
    const pool = await getPool();

    const result = await pool.request()
        .query(`
           SELECT *
           FROM dbo.COLLECTIONS
           ORDER BY collectionName; 
        `);

    return result.recordset;
}

async function readCollection(collectionId) {
    const pool = await getPool();

    const result = await pool.request()
        .input("collectionId", sql.Int, collectionId)
        .query(`
            SELECT *
            FROM dbo.COLLECTIONS
            WHERE collectionId = @collectionId;    
        `);

    return result.recordset[0] || null;
}

async function updateCollection(
    collectionId, { collectionName, description }
) {
    if (typeof collectionName !== "string" || !collectionName.trim()) {
        throw new TypeError("Collection name is required");
    }
    if (description != null && typeof description !== "string") {
        throw new TypeError("Description must be a string");
    }
    
    const pool = await getPool();

    const result = await pool.request()
        .input("collectionId", sql.Int, collectionId)
        .input("collectionName", sql.NVarChar(50), collectionName.trim())
        .input("description", sql.NVarChar(250), description?.trim() || null)
        .query(`
            UPDATE dbo.COLLECTIONS
            SET
                collectionName = @collectionName,
                description = @description
            OUTPUT INSERTED.*
            WHERE collectionId = @collectionId;
        `); 

    return result.recordset[0] || null;
}

async function deleteCollection(collectionId) {
    const pool = await getPool();

    const result = await pool.request()
        .input("collectionId", sql.Int, collectionId)
        .query(`
           DELETE FROM dbo.COLLECTIONS
           OUTPUT DELETED.*
           WHERE collectionId = @collectionId;
        `);

    return result.recordset[0] || null;
}

async function countCollectionArtworks(collectionId) {
    const pool = await getPool();

    const result = await pool.request()
        .input("collectionId", sql.Int, collectionId)
        .query(`
           SELECT COUNT(*) AS artworkCount
           FROM dbo.ARTWORKS
           WHERE collectionId = @collectionId;
        `);
    return result.recordset[0].artworkCount;
}

module.exports = {
    createCollection,
    listCollections,
    readCollection,
    updateCollection,
    deleteCollection,
    countCollectionArtworks
};