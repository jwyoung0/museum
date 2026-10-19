const {
    listArtworkForVisitor,
    readArtworkForVisitor
} = require("../database/artwork");

// const { readJsonBody } = require("../utils/http");

async function listArtworkForVisitorHandler(req, res) {
    const artwork = await listArtworkForVisitor();

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(artwork));
}

async function readArtworkForVisitorHandler(req, res) {
    const artworkId = req.params.id;

    const artwork = await readArtworkForVisitor(artworkId);

    if(!artwork) {
        res.writeHead(404, {
            "Content-Type": "application/json"
        });

        return res.end(
            JSON.stringify({ error: "Artwork not found" })
        );
    }

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(artwork));
}

module.exports = {
    listArtworkForVisitorHandler,
    readArtworkForVisitorHandler
};