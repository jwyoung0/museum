const { getActiveSiteBanner } = require("../database/site-banner");

async function getActiveSiteBannerHandler(req, res) {
    try {
        const banner = await getActiveSiteBanner();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(banner));
    } catch (error) {
        console.error("Failed to retrieve site banner:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to retrieve site banner" }));
    }
}

module.exports = { getActiveSiteBannerHandler };
