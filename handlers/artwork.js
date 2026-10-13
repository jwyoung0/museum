const { 
    createArtwork,
    listArtwork, 
    readArtwork, 
    updateArtwork,
    deleteArtwork, 
    countArtworks
} = require("../database/artwork");

const { readJsonBody } = require("../utils/http");

async function createArtworkHandler(req, res) {
    const body = await readJsonBody(req);

    const artwork = {
        fullName: body.fullName,
        birthYear: body.birthYear,
        placeOfBirth: body.placeOfBirth,
        period: body.period,
        deathYear: body.deathYear,
        sex: body.sex,
        nationality: body.nationality
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

    const artworkCount = await countArtworkArtworks(artworkId);

    res.end(JSON.stringify({
        ...artwork,
        artworkCount
    }));
}

async function updateArtworkHandler(req, res) {
    const artworkId = req.params.id;
    const body = await readJsonBody(req);

    const artwork = {
        fullName: body.fullName,
        birthYear: body.birthYear,
        placeOfBirth: body.placeOfBirth,
        period: body.period,
        deathYear: body.deathYear,
        sex: body.sex,
        nationality: body.nationality
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

    const artworkCount = await countArtworkArtworks(artworkId);

    if (artworkCount > 0) {
        res.writeHead(409, {"Content-Type": "application/json"});
    
        return res.end(JSON.stringify({
            error:
                `This artwork is associated with ` + 
                `${artworkCount} artworks. ` +
                `Reassign or remove those artworks ` +
                `before deleting the artwork.`,
            artworkCount
        }));
    }

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