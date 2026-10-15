const { listStyles, listPeriods, listCollections } = 
    require("../database/artwork-lookup");

async function listArtworkLookupsHandler(req, res) {
    const [styles, periods, collections] = await Promise.all([
        listStyles(),
        listPeriods(),
        listCollections(),
    ]);

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify({ styles, periods, collections }));
}

module.exports = {
    listArtworkLookupsHandler
};