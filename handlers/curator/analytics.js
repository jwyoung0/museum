const {
    getArtworkInterestByTier,
    getArtistInterestByTier,
    getTrendData,
    getRankingData,
    getSessionEngagement,
    getTopSessions,
    getTiersForReport,
    getLookupValues,
    getEngagementRecords
} = require("../../database/curator/analytics");

function getFilters(req) {
    const url = new URL(req.url, "http://localhost");

    return {
        startDate:
            url.searchParams.get("startDate"),

        endDate:
            url.searchParams.get("endDate"),

        tier:
            url.searchParams.get("tier"),

        analyzeBy:
            url.searchParams.get("analyzeBy"),

        entityValue:
            url.searchParams.get("entityValue")
    };
}

async function sendJson(res, reportFunction, filters = {}) {
    const data = await reportFunction(filters);

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(data));
}

async function getArtworkInterestByTierHandler(req, res) {
    await sendJson(res, getArtworkInterestByTier, getFilters(req));
}

async function getArtistInterestByTierHandler(req, res) {
    await sendJson(res, getArtistInterestByTier, getFilters(req));
}

async function getTrendDataHandler(req, res) {
    await sendJson(res, getTrendData, getFilters(req));
}

async function getRankingDataHandler(req, res) {
    await sendJson(res, getRankingData, getFilters(req));
}

async function getSessionEngagementHandler(req, res) {
    await sendJson(res, getSessionEngagement, getFilters(req));
}

async function getTopSessionsHandler(req, res) {
    await sendJson(res, getTopSessions, getFilters(req));
}

async function getTiersForReportHandler(req, res) {
    const tiers = await getTiersForReport();

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(tiers));
};

async function getLookupValuesHandler(req, res) {
    const pathname = new URL(req.url, "http://localhost").pathname;
    
    const type = pathname.split("/").pop();

    const validTypes = [
        "artists",
        "artworks",
        "styles",
        "periods",
        "collections",
        "exhibitions",
        "artist-sex"
    ];

    if (
        !validTypes.includes(type)
    ) {
        res.writeHead(400, {
            "Content-Type":
                "application/json"
        });

        return res.end(
            JSON.stringify({
                error:
                    "Invalid lookup type"
            })
        );
    }

    const values = await getLookupValues(type);

    res.writeHead(200,
        {"Content-Type": "application/json"}
    );

    res.end(JSON.stringify(values));
}

async function getEngagementRecordsHandler(req, res) {
    const filters = getFilters(req);

    await sendJson(
        res,
        getEngagementRecords,
        filters
    );
}

module.exports = {
    getArtworkInterestByTierHandler,
    getArtistInterestByTierHandler,
    getTrendDataHandler,
    getRankingDataHandler,
    getSessionEngagementHandler,
    getTopSessionsHandler,
    getTiersForReportHandler,
    getLookupValuesHandler,
    getEngagementRecordsHandler
};