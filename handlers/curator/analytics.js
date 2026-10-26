const {
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
} = require("../../database/curator/analytics");

function getFilters(req) {
    const url = new URL(req.url, "http://localhost");

    return {
        startDate: url.searchParams.get("startDate"),
        endDate: url.searchParams.get("endDate"),
        tier: url.searchParams.get("tier"),
        style: url.searchParams.get("style"),
        period: url.searchParams.get("period"),
        collection: url.searchParams.get("collection")
    };
}

async function sendJson(res, reportFunction, filters = {}) {
    const data = await reportFunction(filters);

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(data));
}

async function getTopArtworksHandler(req, res) {
    await sendJson(res, getTopArtworks, getFilters(req));
}

async function getTopArtistsHandler(req, res) {
    await sendJson(res, getTopArtists, getFilters(req));
}

async function getTopStylesHandler(req, res) {
    await sendJson(res, getTopStyles, getFilters(req));
}

async function getTopPeriodsHandler(req, res) {
    await sendJson(res, getTopPeriods, getFilters(req));
}

async function getTopCollectionsHandler(req, res) {
    await sendJson(res, getTopCollections, getFilters(req));
}

async function getArtworkInterestByTierHandler(req, res) {
    await sendJson(res, getArtworkInterestByTier, getFilters(req));
}

async function getArtistInterestByTierHandler(req, res) {
    await sendJson(res, getArtistInterestByTier, getFilters(req));
}

async function getMonthlyEngagementHandler(req, res) {
    await sendJson(res, getMonthlyEngagement, getFilters(req));
}

async function getSessionEngagementHandler(req, res) {
    await sendJson(res, getSessionEngagement, getFilters(req));
}

async function getTopSessionsHandler(req, res) {
    await sendJson(res, getTopSessions, getFilters(req));
}

async function getExhibitionRecommendationsHandler(req, res) {
    await sendJson(res, getExhibitionRecommendations, getFilters(req));
}

module.exports = {
    getTopArtworksHandler,
    getTopArtistsHandler,
    getTopStylesHandler,
    getTopPeriodsHandler,
    getTopCollectionsHandler,
    getArtworkInterestByTierHandler,
    getArtistInterestByTierHandler,
    getMonthlyEngagementHandler,
    getSessionEngagementHandler,
    getTopSessionsHandler,
    getExhibitionRecommendationsHandler
};