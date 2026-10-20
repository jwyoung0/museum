/* Moved to router.js line 38-41
const {
    listPersonnel,
    createPersonnel
} = require("../../database/personnel");*/

function requireDirectorApi(req, res) {
    if (!req.user || req.user.role !== "director") {
        res.writeHead(403, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: "Director access required"
        }));

        return false;
    }

    return true;
}

async function listPersonnelHandler(req, res) {
    if (!requireDirectorApi(req, res)) return;

    try {
        const personnel = await listPersonnel();

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify(personnel));
    } catch (error) {
        console.error("Error listing personnel:", error);

        res.writeHead(500, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: "Unable to retrieve personnel"
        }));
    }
}

async function createPersonnelHandler(req, res) {
    if (!requireDirectorApi(req, res)) return;

    try {
        let body = "";

        for await (const chunk of req) {
            body += chunk;
        }

        const personnel = JSON.parse(body);

        if (
            typeof personnel.legalName !== "string" ||
            !personnel.legalName.trim() ||
            typeof personnel.email !== "string" ||
            !personnel.email.trim()
        ) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Legal name and email are required"
            }));
        }

        const status = Number(personnel.employmentStatus);

        if (status !== 0 && status !== 1) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Invalid employment status"
            }));
        }

        const created = await createPersonnel({
            ...personnel,
            legalName: personnel.legalName.trim(),
            email: personnel.email.trim(),
            employmentStatus: status
        });

        res.writeHead(201, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            message: "Personnel created successfully",
            PersonnelID: created.PersonnelID
        }));
    } catch (error) {
        if (error instanceof SyntaxError) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Invalid JSON request body"
            }));
        }

        console.error("Error creating personnel:", error);

        res.writeHead(500, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: "Unable to create personnel"
        }));
    }
}

module.exports = {
    listPersonnelHandler,
    createPersonnelHandler
};
