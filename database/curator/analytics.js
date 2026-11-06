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

async function getTopArtistSex(filters = {}) {
    const pool = await getPool();

    const result = await applyCommonFilters(
        pool.request(),
        filters
    ).query(`
        SELECT
            ArtistSex,
            COUNT(*) AS Views
        FROM dbo.vw_ArtworkEngagement
        ${commonWhere}
        AND ArtistSex IS NOT NULL
        GROUP BY ArtistSex
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

    const result =
        await applyCommonFilters(
            pool.request(),
            filters
        ).query(`
            SELECT
                YEAR(ViewDate) AS YearViewed,
                MONTH(ViewDate) AS MonthViewed,
                DATENAME(
                    MONTH,
                    ViewDate
                ) AS MonthName,
                COUNT(*) AS Views
            FROM dbo.vw_ArtworkEngagement
            ${commonWhere}
            ${entityWhere}
            GROUP BY
                YEAR(ViewDate),
                MONTH(ViewDate),
                DATENAME(
                    MONTH,
                    ViewDate
                )
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

module.exports = {
    getTopArtworks,
    getTopArtists,
    getTopArtistSex,
    getTopStyles,
    getTopPeriods,
    getTopCollections,
    getArtworkInterestByTier,
    getArtistInterestByTier,
    getMonthlyEngagement,
    getSessionEngagement,
    getTopSessions,
    getExhibitionRecommendations,
    getTiersForReport, 
    getLookupValues
};