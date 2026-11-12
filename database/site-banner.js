const { getPool } = require("./connection");

async function getActiveSiteBanner() {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT TOP (1)
            b.BannerID,
            b.ExhibitionID,
            b.BannerTitle,
            b.BannerText,
            a.imageURL AS RepresentativeArtworkImageURL
        FROM dbo.SITE_BANNER AS b
        LEFT JOIN dbo.EXHIBITIONS AS e
            ON e.exhibitionId = b.ExhibitionID
        LEFT JOIN dbo.ARTWORKS AS a
            ON a.accessionId = e.representativeArtwork
        WHERE b.IsActive = 1
        ORDER BY b.CreatedAt DESC, b.BannerID DESC;
    `);

    return result.recordset[0] || null;
}

module.exports = { getActiveSiteBanner };
