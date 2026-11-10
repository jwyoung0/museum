const { getPool } = require("./connection");

async function getActiveSiteBanner() {
    const pool = await getPool();
    const result = await pool.request().query(`
        SELECT TOP (1)
            BannerID,
            ExhibitionID,
            BannerTitle,
            BannerText
        FROM dbo.SITE_BANNER
        WHERE IsActive = 1
        ORDER BY CreatedAt DESC, BannerID DESC;
    `);

    return result.recordset[0] || null;
}

module.exports = { getActiveSiteBanner };
