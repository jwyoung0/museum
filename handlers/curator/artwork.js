const { 
    createArtwork,
    listArtwork, 
    readArtwork, 
    updateArtwork,
    deleteArtwork
} = require("../../database/artwork");

const { readJsonBody } = require("../../utils/http");

async function createArtworkHandler(req, res) {
    const body = await readJsonBody(req);

    const artwork = {
        title: body.title,
        category: body.category,
        medium: body.medium,
        dimensions: body.dimensions,
        creationDate: body.creationDate,
        imageURL: body.imageURL,
        artistId: body.artistId,
        collectionId: body.collectionId,
        styleID: body.styleID,
        periodID: body.periodID
    };

    const createdArtwork = await createArtwork(artwork);

    res.writeHead(201, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(createdArtwork));
}

async function listArtworkHandler(req, res) {
    const artwork = await listArtwork();

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(artwork));
}

async function readArtworkHandler(req, res) {
    const artworkId = req.params.id;

    const artwork = await readArtwork(artworkId);

    if (!artwork) {
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

async function updateArtworkHandler(req, res) {
    const artworkId = req.params.id;
    const body = await readJsonBody(req);

    const artwork = {
        title: body.title,
        category: body.category,
        medium: body.medium,
        dimensions: body.dimensions,
        creationDate: body.creationDate,
        imageURL: body.imageURL,
        artistId: body.artistId,
        collectionId: body.collectionId,
        styleID: body.styleID,
        periodID: body.periodID
    };

    const updatedArtwork = await updateArtwork(artworkId, artwork);

    if (!updatedArtwork) {
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

    res.end(JSON.stringify(updatedArtwork));
}

async function deleteArtworkHandler(req, res) {
    const artworkId = req.params.id;

    const deletedArtwork = await deleteArtwork(artworkId);

    if (!deletedArtwork) {
        res.writeHead(404, {
            "Content-Type": "application/json"
        });

        return res.end(JSON.stringify({ error: "Artwork not found" }));
    }

    res.writeHead(204);
    res.end();
}

module.exports = {
    createArtworkHandler,
    listArtworkHandler,
    readArtworkHandler,
    updateArtworkHandler,
    deleteArtworkHandler
};