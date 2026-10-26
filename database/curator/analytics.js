const { sql, getPool } = require("../connection");

function applyCommonFilters(request, filters = {}) {
    return request
        .input("startDate", sql.Date, filters.startDate || null)
        .input("endDate", sql.Date, filters.endDate || null)
        .input("tier", sql.NVarChar(50), filters.tier || null)
        .input("style", sql.NVarChar(100), filters.style || null)
        .input("period", sql.NVarChar(100), filters.period || null)
        .input("collection", sql.NVarChar(100), filters.collection || null);
}

const commonWhere = `
WHERE
    (@startDate IS NULL OR ViewDate >= @startDate)
    AND (@endDate IS NULL OR ViewDate <= @endDate)
    AND (@tier IS NULL OR TierName = @tier)
    AND (@style IS NULL OR StyleName = @style)
    AND (@period IS NULL OR PeriodName = @period)
    AND (@collection IS NULL OR CollectionName = @collection)
`;

async function getTopArtworks(filters = {}) {
    const pool = await getPool();

    const result = await applyCommonFilters(
        pool.request(),
        filters
    ).query(`
        SELECT TOP (20)
            ArtworkID,
            ArtworkTitle,
            COUNT(*) AS Views
        FROM dbo.vw_ArtworkEngagement
        ${commonWhere}
        GROUP BY
            ArtworkID,
            ArtworkTitle
        ORDER BY Views DESC;
    `);

    return result.recordset;
}

async function getTopArtists(filters = {}) {
    const pool = await getPool();

    const result = await applyCommonFilters(
        pool.request(),
        filters
    ).query(`
        SELECT TOP (20)
            ArtistID,
            ArtistName,
            COUNT(*) AS Views
        FROM dbo.vw_ArtworkEngagement
        ${commonWhere}
        GROUP BY
            ArtistID,
            ArtistName
        ORDER BY Views DESC;
    `);

    return result.recordset;
}

async function getTopStyles(filters = {}) {
    const pool = await getPool();

    const result = await applyCommonFilters(
        pool.request(),
        filters
    ).query(`
        SELECT TOP (20)
            StyleID,
            StyleName,
            COUNT(*) AS Views
        FROM dbo.vw_ArtworkEngagement
        ${commonWhere}
        GROUP BY
            StyleID,
            StyleName
        ORDER BY Views DESC;
    `);

    return result.recordset;
}

async function getTopPeriods(filters = {}) {
    const pool = await getPool();

    const result = await applyCommonFilters(
        pool.request(),
        filters
    ).query(`
        SELECT TOP (20)
            PeriodID,
            PeriodName,
            COUNT(*) AS Views
        FROM dbo.vw_ArtworkEngagement
        ${commonWhere}
        GROUP BY
            PeriodID,
            PeriodName
        ORDER BY Views DESC;
    `);

    return result.recordset;
}

async function getTopCollections(filters = {}) {
    const pool = await getPool();

    const result = await applyCommonFilters(
        pool.request(),
        filters
    ).query(`
        SELECT TOP (20)
            CollectionID,
            CollectionName,
            COUNT(*) AS Views
        FROM dbo.vw_ArtworkEngagement
        ${commonWhere}
        GROUP BY
            CollectionID,
            CollectionName
        ORDER BY Views DESC;
    `);

    return result.recordset;
}

async function getArtworkInterestByTier(filters = {}) {
    const pool = await getPool();

    const result = await applyCommonFilters(
        pool.request(),
        filters
    ).query(`
        WITH RankedArtwork AS
        (
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
            ${commonWhere}
            GROUP BY
                TierName,
                ArtworkID,
                ArtworkTitle
        )
        SELECT *
        FROM RankedArtwork
        WHERE rn = 1
        ORDER BY TierName;
    `);

    return result.recordset;
}

async function getArtistInterestByTier(filters = {}) {
    const pool = await getPool();

    const result = await applyCommonFilters(
        pool.request(),
        filters
    ).query(`
        WITH RankedArtist AS
        (
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
            ${commonWhere}
            GROUP BY
                TierName,
                ArtistID,
                ArtistName
        )
        SELECT *
        FROM RankedArtist
        WHERE rn = 1
        ORDER BY TierName;
    `);

    return result.recordset;
}

async function getMonthlyEngagement(filters = {}) {
    const pool = await getPool();

    const result = await applyCommonFilters(
        pool.request(),
        filters
    ).query(`
        SELECT
            YEAR(ViewDate) AS YearViewed,
            MONTH(ViewDate) AS MonthViewed,
            COUNT(*) AS TotalViews
        FROM dbo.vw_ArtworkEngagement
        ${commonWhere}
        GROUP BY
            YEAR(ViewDate),
            MONTH(ViewDate)
        ORDER BY
            YearViewed,
            MonthViewed;
    `);

    return result.recordset;
}

async function getSessionEngagement(filters = {}) {
    const pool = await getPool();

    const result = await applyCommonFilters(
        pool.request(),
        filters
    ).query(`
        SELECT
            AVG(CAST(SessionViews AS FLOAT)) AS AvgViewsPerSession
        FROM
        (
            SELECT
                SessionID,
                COUNT(*) AS SessionViews
            FROM dbo.vw_ArtworkEngagement
            ${commonWhere}
            GROUP BY SessionID
        ) S;
    `);

    return result.recordset[0];
}

async function getTopSessions(filters = {}) {
    const pool = await getPool();

    const result = await applyCommonFilters(
        pool.request(),
        filters
    ).query(`
        SELECT TOP (20)
            SessionID,
            COUNT(*) AS Views
        FROM dbo.vw_ArtworkEngagement
        ${commonWhere}
        GROUP BY SessionID
        ORDER BY Views DESC;
    `);

    return result.recordset;
}

async function getExhibitionRecommendations(filters = {}) {
    const pool = await getPool();

    const result = await applyCommonFilters(
        pool.request(),
        filters
    ).query(`
        SELECT TOP (10)
            StyleID,
            StyleName,
            COUNT(*) AS Views
        FROM dbo.vw_ArtworkEngagement
        ${commonWhere}
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