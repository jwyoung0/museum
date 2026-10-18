const {
    createExhibition,
    listExhibitions,
    readExhibition,
    updateExhibition,
    deleteExhibition
} = require("../database/exhibitions");

const { readJsonBody } = require("../../utils/http");

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

async function listExhibitionHandler(req, res) {
    try {
        const exhibitions = await listExhibitions();

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

async function readExhibitionHandler(req, res, exhibitionId) {
    try {
        const exhibition = await readExhibition(
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

async function updateExhibitionHandler(req, res, exhibitionId) {
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

async function deleteExhibitionHandler(req, res, exhibitionId) {
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

module.exports = {
    createExhibitionHandler,
    listExhibitionHandler,
    readExhibitionHandler,
    updateExhibitionHandler,
    deleteExhibitionHandler
}