const {
    listArtworkForVisitor,
    readArtworkForVisitor
} = require("../database/artwork");

async function listArtworkForVisitorHandler(req, res) {
    const artwork = await listArtworkForVisitor();

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(artwork));
}

async function readArtworkForVisitorHandler(req, res) {
    const sessionId = req.headers["x-analytics-session-id"];
    const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (typeof sessionId !== "string" || !uuidPattern.test(sessionId)) {
        res.writeHead(400, {
            "Content-Type": "application/json"
        });

        return res.end(JSON.stringify({
            error: "A valid analytics session ID is required"
        }));
    }

    const artwork = await readArtworkForVisitor(
        req.params.id,
        req.user?.visitorId,
        sessionId
    );

    if (!artwork) {
        res.writeHead(404, {
            "Content-Type": "application/json"
        });

        return res.end(JSON.stringify({ error: "Artwork not found" }));
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