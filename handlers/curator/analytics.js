const {
    getTopArtists,
} = require("../../database/curator/analytics");

const readJsonBody = require("../../utils/http").readJsonBody;

async function getTopArtistsHandler(req, res) {
    const topArtists = await getTopArtists();

    res.writeHead(200, {
        "Content-Type": "application/json"
    }); 
    res.end(JSON.stringify(topArtists));

}

module.exports = {
    getTopArtistsHandler,
};