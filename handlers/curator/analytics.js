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

async function sendJson(res, promise) {
    const data = await promise;

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(data));
}

async function getTopArtworksHandler(req, res) {
    await sendJson(res, getTopArtworks());
}

async function getTopArtistsHandler(req, res) {
    await sendJson(res, getTopArtists());
}

async function getTopStylesHandler(req, res) {
    await sendJson(res, getTopStyles());
}

async function getTopPeriodsHandler(req, res) {
    await sendJson(res, getTopPeriods());
}

async function getTopCollectionsHandler(req, res) {
    await sendJson(res, getTopCollections());
}

async function getArtworkInterestByTierHandler(req, res) {
    await sendJson(res, getArtworkInterestByTier());
}

async function getArtistInterestByTierHandler(req, res) {
    await sendJson(res, getArtistInterestByTier());
}

async function getMonthlyEngagementHandler(req, res) {
    await sendJson(res, getMonthlyEngagement());
}

async function getSessionEngagementHandler(req, res) {
    await sendJson(res, getSessionEngagement());
}

async function getTopSessionsHandler(req, res) {
    await sendJson(res, getTopSessions());
}

async function getExhibitionRecommendationsHandler(req, res) {
    await sendJson(res, getExhibitionRecommendations());
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