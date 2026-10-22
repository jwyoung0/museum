const { sql, getPool } = require("../connection");

async function getTopArtists() {
    const pool = await getPool();
    
    const result = await pool.request()
        .query(`
            SELECT TOP 20
                ArtistID,
                ArtistName,
                COUNT(*) AS InterestedVisitors
            FROM
            (
                SELECT DISTINCT
                    VisitorID,
                    ArtistID,
                    ArtistName
                FROM dbo.vw_ArtworkAnalytics
                WHERE VisitorID IS NOT NULL
            ) AS ArtistInterest
            GROUP BY
                ArtistID,
                ArtistName
            ORDER BY InterestedVisitors DESC;
        `);

    return result.recordset;
}

module.exports = {
    getTopArtists,
    getTopStyles,
    getTopPeriods,
    getTopCollections,
    getExhibitionRecommendations
};