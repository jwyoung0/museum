
const {
    listWorkAssignments,
    generateLaborCostReport
} = require("../../database/director/work-assignments");


function requireDirectorApi(req, res) {
    if (!req.user || req.user.role !== "director") {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Director access required" }));
        return false;
    }

    return true;
}


// EXISTING WORK ASSIGNMENT HANDLER

async function listWorkAssignmentsHandler(req, res) {
    if (!requireDirectorApi(req, res)) return;

    try {
        const assignments = await listWorkAssignments();

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(assignments));
    } catch (err) {
        console.error("Error retrieving work assignments:", err);

        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            error: "Failed to retrieve work assignments"
        }));
    }
}


// LABOR COST REPORT HANDLER

async function generateLaborCostReportHandler(req, res) {
    if (!requireDirectorApi(req, res)) return;

    try {
        const url = new URL(req.url, "http://localhost");

        const startDate = url.searchParams.get("startDate");
        const endDate = url.searchParams.get("endDate");

        // Validate that both dates were provided.
        if (!startDate || !endDate) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                error: "Both start date and end date are required."
            }));
            return;
        }

        // Validate date format.
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;

        if (!datePattern.test(startDate) || !datePattern.test(endDate)) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                error: "Dates must use YYYY-MM-DD format."
            }));
            return;
        }

        // Validate that the dates actually exist.
        function isValidDate(value) {
            const date = new Date(value + "T00:00:00Z");

            return !isNaN(date.getTime()) &&
                date.toISOString().slice(0, 10) === value;
        }

        if (!isValidDate(startDate) || !isValidDate(endDate)) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                error: "Please provide valid calendar dates."
            }));
            return;
        }

        // Validate reporting period.
        if (startDate > endDate) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                error: "Start date cannot be later than end date."
            }));
            return;
        }

        // Generate report using the SQL view.
        const report = await generateLaborCostReport(startDate, endDate);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(report));

    } catch (err) {
        console.error("Error generating labor cost report:", err);

        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            error: "Failed to generate labor cost report"
        }));
    }
}


module.exports = {
    listWorkAssignmentsHandler,
    generateLaborCostReportHandler
};
