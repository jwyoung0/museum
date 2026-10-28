
const {
    listPositions,
    createPosition
} = require("../../database/director/positions");

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

async function listPositionsHandler(req, res) {
    if (!requireDirectorApi(req, res)) return;

    try {
        const positions = await listPositions();

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify(positions));
    } catch (error) {
        console.error("Error listing positions:", error);

        res.writeHead(500, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: "Unable to retrieve positions"
        }));
    }
}

async function createPositionHandler(req, res) {
    if (!requireDirectorApi(req, res)) return;

    try {
        let body = "";

        for await (const chunk of req) {
            body += chunk;

            if (body.length > 10000) {
                res.writeHead(413, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    error: "Request is too large"
                }));

                return;
            }
        }

        const data = JSON.parse(body);

        if (!data || typeof data !== "object" || Array.isArray(data)) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Invalid position data"
            }));
        }

        const positionName =
            typeof data.positionName === "string"
                ? data.positionName.trim()
                : "";

        const description =
            data.description == null || data.description === ""
                ? null
                : data.description;

        const employmentType =
            data.employmentType == null || data.employmentType === ""
                ? null
                : data.employmentType;

        const salary =
            data.salary == null || data.salary === ""
                ? null
                : Number(data.salary);

        if (!positionName) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Position name is required"
            }));
        }

        if (positionName.length > 50) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Position name must not exceed 50 characters"
            }));
        }

        if (
            description !== null &&
            (
                typeof description !== "string" ||
                description.length > 250
            )
        ) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Description must not exceed 250 characters"
            }));
        }

        if (
            employmentType !== null &&
            (
                typeof employmentType !== "string" ||
                employmentType.length > 50
            )
        ) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Employment type must not exceed 50 characters"
            }));
        }

        if (
            salary !== null &&
            (
                !Number.isFinite(salary) ||
                salary < 0 ||
                salary > 99999999.99 ||
                Math.round(salary * 100) !== salary * 100
            )
        ) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Salary must be non-negative and have at most two decimal places"
            }));
        }

        const created = await createPosition({
            positionName,
            description,
            employmentType,
            salary
        });

        res.writeHead(201, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            message: "Position created successfully",
            PositionID: created.PositionID
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

        console.error("Error creating position:", error);

        res.writeHead(500, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: "Unable to create position"
        }));
    }
}

module.exports = {
    listPositionsHandler,
    createPositionHandler
};
