const { 
    createArtwork,
    listArtwork, 
    readArtwork, 
    updateArtwork,
    deleteArtwork
} = require("../../database/curator/artwork");

const { readJsonBody } = require("../../utils/http");

async function createArtworkHandler(req, res) {
    try {
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
    } catch (error) {
        console.error("Create artwork error:", error);

        res.writeHead(500, {
            "Content-Type": "application/json"
        });

        return res.end(JSON.stringify({
            error: "Unable to create artwork at this time."
        }));
    }    
}

async function listArtworkHandler(req, res) {
    try {
        const artwork = await listArtwork();

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify(artwork));
    } catch (error) {
        console.error("List artwork error:", error);

        res.writeHead(500, {
            "Content-Type": "application/json"
        });

        return res.end(JSON.stringify({
            error: "Unable to list artworks at this time."
        }));
    }
}

async function readArtworkHandler(req, res) {
    try {
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
    } catch (error) {
        console.error("Read artwork error:", error);

        res.writeHead(500, {
            "Content-Type": "application/json"
        });

        return res.end(JSON.stringify({
            error: "Unable to read artwork at this time."
        }));
    }
}

async function updateArtworkHandler(req, res) {
    try {    
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
    } catch (error) {
        console.error("Update artwork error:", error);

        res.writeHead(500, {
            "Content-Type": "application/json"
        });

        return res.end(JSON.stringify({
            error: "Unable to update artwork at this time."
        }));
    }
}

async function deleteArtworkHandler(req, res) {
    try {
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
    } catch (error) {
        console.error("Delete artwork error:", error);

        res.writeHead(500, {
            "Content-Type": "application/json"
        });

        return res.end(JSON.stringify({
            error: "Unable to delete artwork at this time."
        }));
    }
}

module.exports = {
    createArtworkHandler,
    listArtworkHandler,
    readArtworkHandler,
    updateArtworkHandler,
    deleteArtworkHandler
};