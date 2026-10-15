const { listStyles, listPeriods, listCollections, listArtists } = 
    require("../database/artwork-lookup");

async function listArtworkLookupsHandler(req, res) {
    const [styles, periods, collections, artists] = await Promise.all([
        listStyles(),
        listPeriods(),
        listCollections(),
        listArtists()
    ]);

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify({ styles, periods, collections, artists }));
}

module.exports = {
    listArtworkLookupsHandler
};