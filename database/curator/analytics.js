const { getPool } = require("../connection");

async function getTopArtworks(limit = 20) {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT TOP (${limit})
            ArtworkID,
            ArtworkTitle,
            COUNT(*) AS Views
        FROM dbo.vw_ArtworkEngagement
        GROUP BY
            ArtworkID,
            ArtworkTitle
        ORDER BY Views DESC;
    `);

    return result.recordset;
}

async function getTopArtists(limit = 20) {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT TOP (${limit})
            ArtistID,
            ArtistName,
            COUNT(*) AS Views
        FROM dbo.vw_ArtworkEngagement
        GROUP BY
            ArtistID,
            ArtistName
        ORDER BY Views DESC;
    `);

    return result.recordset;
}

async function getTopStyles(limit = 20) {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT TOP (${limit})
            StyleID,
            StyleName,
            COUNT(*) AS Views
        FROM dbo.vw_ArtworkEngagement
        GROUP BY
            StyleID,
            StyleName
        ORDER BY Views DESC;
    `);

    return result.recordset;
}

async function getTopPeriods(limit = 20) {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT TOP (${limit})
            PeriodID,
            PeriodName,
            COUNT(*) AS Views
        FROM dbo.vw_ArtworkEngagement
        GROUP BY
            PeriodID,
            PeriodName
        ORDER BY Views DESC;
    `);

    return result.recordset;
}

async function getTopCollections(limit = 20) {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT TOP (${limit})
            CollectionID,
            CollectionName,
            COUNT(*) AS Views
        FROM dbo.vw_ArtworkEngagement
        GROUP BY
            CollectionID,
            CollectionName
        ORDER BY Views DESC;
    `);

    return result.recordset;
}

async function getArtworkInterestByTier() {
    const pool = await getPool();

    const result = await pool.request().query(`
        WITH RankedArtwork AS (
            SELECT
                TierName,
                ArtworkID,
                ArtworkTitle,
                COUNT(*) AS Views,
                ROW_NUMBER() OVER (
                    PARTITION BY TierName
                    ORDER BY COUNT(*) DESC
                ) AS rn
            FROM dbo.vw_ArtworkEngagement
            WHERE TierName IS NOT NULL
            GROUP BY
                TierName,
                ArtworkID,
                ArtworkTitle
        )
        SELECT
            TierName,
            ArtworkID,
            ArtworkTitle,
            Views
        FROM RankedArtwork
        WHERE rn = 1
        ORDER BY TierName;
    `);

    return result.recordset;
}

async function getArtistInterestByTier() {
    const pool = await getPool();

    const result = await pool.request().query(`
        WITH RankedArtist AS (
            SELECT
                TierName,
                ArtistID,
                ArtistName,
                COUNT(*) AS Views,
                ROW_NUMBER() OVER (
                    PARTITION BY TierName
                    ORDER BY COUNT(*) DESC
                ) AS rn
            FROM dbo.vw_ArtworkEngagement
            WHERE TierName IS NOT NULL
            GROUP BY
                TierName,
                ArtistID,
                ArtistName
        )
        SELECT
            TierName,
            ArtistID,
            ArtistName,
            Views
        FROM RankedArtist
        WHERE rn = 1
        ORDER BY TierName;
    `);

    return result.recordset;
}

async function getMonthlyEngagement() {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT
            YEAR(ViewDate) AS YearViewed,
            MONTH(ViewDate) AS MonthViewed,
            COUNT(*) AS TotalViews
        FROM dbo.vw_ArtworkEngagement
        GROUP BY
            YEAR(ViewDate),
            MONTH(ViewDate)
        ORDER BY
            YearViewed,
            MonthViewed;
    `);

    return result.recordset;
}

async function getSessionEngagement() {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT
            AVG(CAST(SessionViews AS FLOAT)) AS AvgViewsPerSession
        FROM
        (
            SELECT
                SessionID,
                COUNT(*) AS SessionViews
            FROM dbo.vw_ArtworkEngagement
            WHERE SessionID IS NOT NULL
            GROUP BY SessionID
        ) AS S;
    `);

    return result.recordset[0];
}

async function getTopSessions(limit = 20) {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT TOP (${limit})
            SessionID,
            COUNT(*) AS Views
        FROM dbo.vw_ArtworkEngagement
        WHERE SessionID IS NOT NULL
        GROUP BY SessionID
        ORDER BY Views DESC;
    `);

    return result.recordset;
}

async function getExhibitionRecommendations() {
    const pool = await getPool();

    const result = await pool.request().query(`
        SELECT TOP 10
            StyleID,
            StyleName,
            COUNT(*) AS Views
        FROM dbo.vw_ArtworkEngagement
        WHERE ViewDate >= DATEADD(MONTH, -6, GETDATE())
        GROUP BY
            StyleID,
            StyleName
        ORDER BY Views DESC;
    `);

    return result.recordset;
}

module.exports = {
    getTopArtworks,
    getTopArtists,
    getTopStyles,
    getTopPeriods,
    getTopCollections,
    getArtworkInterestByTier,
    getArtistInterestByTier,
    getMonthlyEngagement,
    getSessionEngagement,
    getTopSessions,
    getExhibitionRecommendations
};