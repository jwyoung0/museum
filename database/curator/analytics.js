const { sql, getPool } = require("../connection");

function applyCommonFilters(
    request,
    filters = {}
) {
    return request
        .input(
            "startDate",
            sql.Date,
            filters.startDate || null
        )
        .input(
            "endDate",
            sql.Date,
            filters.endDate || null
        )
        .input(
            "tier",
            sql.NVarChar(50),
            filters.tier || null
        )
        .input(
            "analyzeBy",
            sql.NVarChar(50),
            filters.analyzeBy || null
        )
        .input(
            "entityValue",
            sql.NVarChar(100),
            filters.entityValue || null
        );
}

const commonWhere = `
WHERE
    (@startDate IS NULL OR ViewDate >= @startDate)
    AND (@endDate IS NULL OR ViewDate <= @endDate)
    AND (@tier IS NULL OR TierName = @tier)
`;

const entityWhere = `
AND (
    @entityValue IS NULL

    OR (
        @analyzeBy = 'artists'
        AND
        CAST(ArtistID AS NVARCHAR(100))
        = @entityValue
    )

    OR (
        @analyzeBy = 'artworks'
        AND
        CAST(ArtworkID AS NVARCHAR(100))
        = @entityValue
    )

    OR (
        @analyzeBy = 'styles'
        AND
        CAST(StyleID AS NVARCHAR(100))
        = @entityValue
    )

    OR (
        @analyzeBy = 'periods'
        AND
        CAST(PeriodID AS NVARCHAR(100))
        = @entityValue
    )

    OR (
        @analyzeBy = 'collections'
        AND
        CAST(CollectionID AS NVARCHAR(100))
        = @entityValue
    )

    OR (
        @analyzeBy = 'exhibitions'
        AND
        CAST(ExhibitionID AS NVARCHAR(100))
        = @entityValue
    )

    OR (
        @analyzeBy = 'artist-sex'
        AND
        ArtistSex = @entityValue
    )
)
`;

const validAnalyzeByValues = new Set([
    "artists",
    "artist-sex",
    "artworks",
    "styles",
    "periods",
    "collections",
    "exhibitions"
]);

function validateAnalyzeBy(filters) {
    if (!validAnalyzeByValues.has(filters.analyzeBy)) {
        throw new TypeError("Invalid analytics dimension");
    }
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

async function getTrendData(filters = {}) {
    validateAnalyzeBy(filters);
    const pool = await getPool();

    const result = await applyCommonFilters(
        pool.request(),
        filters
    ).query(`
        SELECT
            YEAR(ViewDate) AS YearViewed,
            MONTH(ViewDate) AS MonthViewed,
            DATENAME(MONTH, ViewDate) AS MonthName,
            COUNT(*) AS Views
        FROM dbo.vw_ArtworkEngagement
        ${commonWhere}
        ${entityWhere}
        GROUP BY
            YEAR(ViewDate),
            MONTH(ViewDate),
            DATENAME(MONTH, ViewDate)
        ORDER BY
            YearViewed,
            MonthViewed;
    `);

    return result.recordset;
}

async function getRankingData(filters = {}) {
    validateAnalyzeBy(filters);
    const pool = await getPool();

    const result = await applyCommonFilters(
        pool.request(),
        filters
    ).query(`
        SELECT TOP (20)
            dimension.EntityID,
            dimension.EntityName,
            COUNT(*) AS Views
        FROM dbo.vw_ArtworkEngagement
        CROSS APPLY (
            VALUES (
                CASE @analyzeBy
                    WHEN 'artists' THEN CONVERT(NVARCHAR(100), ArtistID)
                    WHEN 'artist-sex' THEN CONVERT(NVARCHAR(100), ArtistSex)
                    WHEN 'artworks' THEN CONVERT(NVARCHAR(100), ArtworkID)
                    WHEN 'styles' THEN CONVERT(NVARCHAR(100), StyleID)
                    WHEN 'periods' THEN CONVERT(NVARCHAR(100), PeriodID)
                    WHEN 'collections' THEN CONVERT(NVARCHAR(100), CollectionID)
                    WHEN 'exhibitions' THEN CONVERT(NVARCHAR(100), ExhibitionID)
                END,
                CASE @analyzeBy
                    WHEN 'artists' THEN ArtistName
                    WHEN 'artist-sex' THEN ArtistSex
                    WHEN 'artworks' THEN ArtworkTitle
                    WHEN 'styles' THEN StyleName
                    WHEN 'periods' THEN PeriodName
                    WHEN 'collections' THEN CollectionName
                    WHEN 'exhibitions' THEN ExhibitionName
                END
            )
        ) AS dimension(EntityID, EntityName)
        ${commonWhere}
        ${entityWhere}
            AND dimension.EntityID IS NOT NULL
        GROUP BY
            dimension.EntityID,
            dimension.EntityName
        ORDER BY
            Views DESC,
            dimension.EntityName;
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

async function getTiersForReport() {
    const pool = await getPool();

    const result = await pool.request()
        .query(`
        SELECT
            TierID,
            TierName
        FROM dbo.Tier
        ORDER BY Price;
    `);

    return result.recordset;
}

async function getLookupValues(type) {

    const pool = await getPool();

    switch (type) {

        case "artists":
            return (
                await pool.request().query(`
                    SELECT DISTINCT
                        ArtistID AS value,
                        ArtistName AS label
                    FROM dbo.vw_ArtworkEngagement
                    ORDER BY label;
                `)
            ).recordset;

        case "artworks":
            return (
                await pool.request().query(`
                    SELECT DISTINCT
                        ArtworkID AS value,
                        ArtworkTitle AS label
                    FROM dbo.vw_ArtworkEngagement
                    ORDER BY label;
                `)
            ).recordset;

        case "styles":
            return (
                await pool.request().query(`
                    SELECT DISTINCT
                        StyleID AS value,
                        StyleName AS label
                    FROM dbo.vw_ArtworkEngagement
                    ORDER BY label;
                `)
            ).recordset;

        case "periods":
            return (
                await pool.request().query(`
                    SELECT DISTINCT
                        PeriodID AS value,
                        PeriodName AS label
                    FROM dbo.vw_ArtworkEngagement
                    ORDER BY label;
                `)
            ).recordset;

        case "collections":
            return (
                await pool.request().query(`
                    SELECT DISTINCT
                        CollectionID AS value,
                        CollectionName AS label
                    FROM dbo.vw_ArtworkEngagement
                    ORDER BY label;
                `)
            ).recordset;

        case "exhibitions":
            return (
                await pool.request().query(`
                    SELECT DISTINCT
                        ExhibitionID AS value,
                        ExhibitionName AS label
                    FROM dbo.vw_ArtworkEngagement
                    WHERE ExhibitionID IS NOT NULL
                    ORDER BY label;
                `)
            ).recordset;

        case "artist-sex":
            return (
                await pool.request().query(`
                    SELECT DISTINCT
                        ArtistSex AS value,
                        ArtistSex AS label
                    FROM dbo.vw_ArtworkEngagement
                    WHERE ArtistSex IS NOT NULL
                    ORDER BY label;
                `)
            ).recordset;

        default:
            return [];
    }
}

async function getEngagementRecords(filters = {}) {
    validateAnalyzeBy(filters);

    const pool = await getPool();

    const result =
        await applyCommonFilters(
            pool.request(),
            filters
        ).query(`
            SELECT
                ViewDate,
                TierName,
                SessionID,
                ArtistName,
                ArtistSex,
                ArtworkTitle,
                StyleName,
                PeriodName,
                CollectionName,
                ExhibitionName
            FROM dbo.vw_ArtworkEngagement
            ${commonWhere}
            ${entityWhere}
            ORDER BY ViewDate DESC;
        `);

    return result.recordset;
}

module.exports = {
    getArtworkInterestByTier,
    getArtistInterestByTier,
    getTrendData,
    getRankingData,
    getSessionEngagement,
    getTopSessions,
    getTiersForReport, 
    getLookupValues,
    getEngagementRecords
};