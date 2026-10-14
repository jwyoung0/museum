const { listStyles, listPeriods } = 
    require("../database/artwork-lookup");

async function listArtworkLookupsHandler(req, res) {
    const [styles, periods] = await Promise.all([
        listStyles(),
        listPeriods()
    ]);

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify({ styles, periods }));
}

module.exports = {
    listArtworkLookupsHandler
};