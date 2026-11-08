const {
    createExhibition,
    listExhibitionsForCurator,
    readExhibitionForCurator,
    listExhibitionsForVisitor,
    readExhibitionForVisitor,
    updateExhibition,
    deleteExhibition,
    listExhibitionArtworks,
    addArtworkToExhibition,
    removeArtworkFromExhibition
} = require("../database/exhibitions");

const { readJsonBody } = require("../utils/http");

async function createExhibitionHandler(req, res) {
    try {
        const body = await readJsonBody(req);

        const exhibition = await createExhibition(body);

        res.writeHead(201, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify(exhibition));
    } catch (error) {
        res.writeHead(400, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: error.message
        }));
    }
}

async function listExhibitionsForCuratorHandler(req, res) {
    try {
        const exhibitions = await listExhibitionsForCurator();

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify(exhibitions));
    } catch (error) {
        res.writeHead(500, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: "Failed to retrieve exhibitions"
        }));
    }
}

async function readExhibitionForCuratorHandler(req, res) {
    const exhibitionId = req.params.id;    
    try {
        const exhibition = await readExhibitionForCurator(
            Number(exhibitionId)
        );

        if (!exhibition) {
            res.writeHead(404, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Exhibition not found"
            }));
        }

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify(exhibition));
    } catch (error) {
        res.writeHead(500, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: error.message
        }));
    }
}

async function listExhibitionsForVisitorHandler(req, res) {
    try {
        const exhibitions = await listExhibitionsForVisitor();

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify(exhibitions));
    } catch (error) {
        res.writeHead(500, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: "Failed to retrieve exhibitions"
        }));
    }
}

async function readExhibitionForVisitorHandler(req, res) {
    const exhibitionId = req.params.id;    
    try {
        const exhibition = await readExhibitionForVisitor(
            Number(exhibitionId)
        );

        if (!exhibition) {
            res.writeHead(404, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Exhibition not found"
            }));
        }

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify(exhibition));
    } catch (error) {
        res.writeHead(500, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: error.message
        }));
    }
}

async function updateExhibitionHandler(req, res) {
    const exhibitionId = req.params.id;
    try {
        const body = await readJsonBody(req);

        const exhibition = await updateExhibition(
            Number(exhibitionId),
            body
        );

        if (!exhibition) {
            res.writeHead(404, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Exhibition not found"
            }));
        }

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify(exhibition));
    } catch (error) {
        res.writeHead(400, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: error.message
        }));
    }
}

async function deleteExhibitionHandler(req, res) {
    const exhibitionId = req.params.id;
    try {
        const exhibition = await deleteExhibition(
            Number(exhibitionId)
        );

        if (!exhibition) {
            res.writeHead(404, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Exhibition not found"
            }));
        }

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify(exhibition));
    } catch (error) {
        res.writeHead(400, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: error.message
        }));
    }
}

async function listExhibitionArtworksHandler(req, res) {
    const artworks = await listExhibitionArtworks(
        Number(req.params.id)
    );

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify(artworks));
}

async function addArtworkToExhibitionHandler(req, res) {
    const body = await readJsonBody(req);
    const result = await addArtworkToExhibition(
        Number(req.params.id),
        Number(body.accessionId)
    );

    if (result === "notFound") {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({
            error: "Exhibition or artwork not found"
        }));
    }

    if (result === "alreadyAssigned") {
        res.writeHead(409, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({
            error: "Artwork is already assigned to this exhibition"
        }));
    }

    res.writeHead(201, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify({ added: true }));
}

async function removeArtworkFromExhibitionHandler(req, res) {
    const removed = await removeArtworkFromExhibition(
        Number(req.params.id),
        Number(req.params.accessionId)
    );

    if (!removed) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({
            error: "Exhibition artwork assignment not found"
        }));
    }

    res.writeHead(204);
    res.end();
}

module.exports = {
    createExhibitionHandler,
    listExhibitionsForCuratorHandler,
    readExhibitionForCuratorHandler,
    listExhibitionsForVisitorHandler,
    readExhibitionForVisitorHandler,
    updateExhibitionHandler,
    deleteExhibitionHandler,
    listExhibitionArtworksHandler,
    addArtworkToExhibitionHandler,
    removeArtworkFromExhibitionHandler
};