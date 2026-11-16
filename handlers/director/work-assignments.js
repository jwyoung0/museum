const {
    listWorkAssignments,
    createWorkAssignment,
    updateWorkAssignment,
    listAssignedPersonnel,
    assignPersonnelToWorkAssignment,
    listWorkSessions,
    createWorkSession,
    updateWorkSession,
    deleteWorkSession,
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


// SHARED VALIDATION FUNCTIONS

async function readAssignmentBody(req) {
    let body = "";

    for await (const chunk of req) {
        body += chunk;

        if (body.length > 10000) {
            const error = new Error("Request is too large");
            error.statusCode = 413;
            throw error;
        }
    }

    return JSON.parse(body);
}


function validateAssignment(assignment) {
    if (!assignment || typeof assignment !== "object" || Array.isArray(assignment)) {
        const error = new Error("Invalid assignment data.");
        error.statusCode = 400;
        throw error;
    }

    if (
        typeof assignment.assignmentName !== "string" ||
        !assignment.assignmentName.trim()
    ) {
        const error = new Error("Assignment name is required.");
        error.statusCode = 400;
        throw error;
    }

    const assignmentName = assignment.assignmentName.trim();

    if (assignmentName.length > 100) {
        const error = new Error(
            "Assignment name cannot exceed 100 characters."
        );
        error.statusCode = 400;
        throw error;
    }

    if (
        assignment.description !== undefined &&
        assignment.description !== null &&
        typeof assignment.description !== "string"
    ) {
        const error = new Error("Description must be text.");
        error.statusCode = 400;
        throw error;
    }

    const description = assignment.description?.trim() || null;

    if (description && description.length > 500) {
        const error = new Error(
            "Description cannot exceed 500 characters."
        );
        error.statusCode = 400;
        throw error;
    }

    const startDate = assignment.startDate || null;
    const endDate = assignment.endDate || null;

    function isValidDate(value) {
        if (!value) return true;

        if (
            typeof value !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(value)
        ) {
            return false;
        }

        const date = new Date(value + "T00:00:00Z");

        return !isNaN(date.getTime()) &&
            date.toISOString().slice(0, 10) === value;
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
        const error = new Error(
            "Please provide valid dates in YYYY-MM-DD format."
        );
        error.statusCode = 400;
        throw error;
    }

    if (startDate && endDate && startDate > endDate) {
        const error = new Error(
            "Start date cannot be later than end date."
        );
        error.statusCode = 400;
        throw error;
    }

    return {
        assignmentName,
        description,
        startDate,
        endDate
    };
}


// VALIDATE WORK ASSIGNMENT ID

function getWorkAssignmentID(req) {
    const url = new URL(req.url, "http://localhost");

    const match = url.pathname.match(
        /^\/api\/director\/work-assignments\/(\d+)(?:\/personnel)?$/
    );

    if (!match) {
        const error = new Error("Invalid work assignment ID.");
        error.statusCode = 400;
        throw error;
    }

    const workAssignmentID = Number(match[1]);

    if (
        !Number.isSafeInteger(workAssignmentID) ||
        workAssignmentID <= 0
    ) {
        const error = new Error("Invalid work assignment ID.");
        error.statusCode = 400;
        throw error;
    }

    return workAssignmentID;
}


// SHARED ERROR RESPONSE

function handleAssignmentError(res, error, message) {
    if (error instanceof SyntaxError) {
        res.writeHead(400, {
            "Content-Type": "application/json"
        });

        return res.end(JSON.stringify({
            error: "Invalid JSON request body"
        }));
    }

    if (error.statusCode) {
        res.writeHead(error.statusCode, {
            "Content-Type": "application/json"
        });

        return res.end(JSON.stringify({
            error: error.message
        }));
    }

    console.error(message, error);

    res.writeHead(500, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify({
        error: message
    }));
}


// LIST WORK ASSIGNMENTS

async function listWorkAssignmentsHandler(req, res) {
    if (!requireDirectorApi(req, res)) return;

    try {
        const assignments = await listWorkAssignments();

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify(assignments));

    } catch (error) {
        handleAssignmentError(
            res,
            error,
            "Failed to retrieve work assignments."
        );
    }
}


// CREATE WORK ASSIGNMENT

async function createWorkAssignmentHandler(req, res) {
    if (!requireDirectorApi(req, res)) return;

    try {
        const body = await readAssignmentBody(req);
        const assignment = validateAssignment(body);

        const created = await createWorkAssignment(assignment);

        res.writeHead(201, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            message: "Work assignment created successfully",
            WorkAssignmentID: created.WorkAssignmentID
        }));

    } catch (error) {
        handleAssignmentError(
            res,
            error,
            "Failed to create work assignment."
        );
    }
}


// UPDATE WORK ASSIGNMENT

async function updateWorkAssignmentHandler(req, res) {
    if (!requireDirectorApi(req, res)) return;

    try {
        const workAssignmentID = getWorkAssignmentID(req);

        const body = await readAssignmentBody(req);
        const assignment = validateAssignment(body);

        const updated = await updateWorkAssignment({
            workAssignmentID,
            ...assignment
        });

        if (!updated) {
            res.writeHead(404, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Work assignment not found."
            }));
        }

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            message: "Work assignment updated successfully",
            WorkAssignmentID: workAssignmentID
        }));

    } catch (error) {
        handleAssignmentError(
            res,
            error,
            "Failed to update work assignment."
        );
    }
}


// LIST PERSONNEL ASSIGNED TO A WORK ASSIGNMENT

async function listAssignedPersonnelHandler(req, res) {
    if (!requireDirectorApi(req, res)) return;

    try {
        const workAssignmentID = getWorkAssignmentID(req);

        const personnel = await listAssignedPersonnel(workAssignmentID);

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify(personnel));

    } catch (error) {
        handleAssignmentError(
            res,
            error,
            "Failed to retrieve assigned personnel."
        );
    }
}


// ASSIGN PERSONNEL TO A WORK ASSIGNMENT

async function assignPersonnelHandler(req, res) {
    if (!requireDirectorApi(req, res)) return;

    try {
        const workAssignmentID = getWorkAssignmentID(req);
        const body = await readAssignmentBody(req);

        if (!body || typeof body !== "object" || Array.isArray(body)) {
            const error = new Error("Invalid personnel assignment data.");
            error.statusCode = 400;
            throw error;
        }

        const personnelID = body.personnelID;
        const workRole = body.workRole;

        if (
            !Number.isSafeInteger(personnelID) ||
            personnelID <= 0
        ) {
            const error = new Error("Valid Personnel ID is required.");
            error.statusCode = 400;
            throw error;
        }

        if (
            typeof workRole !== "string" ||
            !workRole.trim()
        ) {
            const error = new Error("Work Role is required.");
            error.statusCode = 400;
            throw error;
        }

        if (workRole.trim().length > 100) {
            const error = new Error(
                "Work Role cannot exceed 100 characters."
            );
            error.statusCode = 400;
            throw error;
        }

        const assigned = await assignPersonnelToWorkAssignment({
            workAssignmentID,
            personnelID,
            workRole: workRole.trim()
        });

        res.writeHead(201, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            message: "Employee assigned successfully.",
            AssignmentPersonnelID: assigned.AssignmentPersonnelID,
            WorkAssignmentID: assigned.WorkAssignmentID,
            PersonnelID: assigned.PersonnelID,
            WorkRole: assigned.WorkRole
        }));

    } catch (error) {
        if (error.number === 50001 || error.number === 50002) {
            res.writeHead(404, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: error.message
            }));
        }

        if (
            error.number === 50003 ||
            error.number === 2601 ||
            error.number === 2627
        ) {
            res.writeHead(409, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "This employee is already assigned to this work assignment."
            }));
        }

        handleAssignmentError(
            res,
            error,
            "Failed to assign personnel."
        );
    }
}


// WORK SESSION VALIDATION

function getWorkSessionIDs(req) {
    const url = new URL(req.url, "http://localhost");

    const match = url.pathname.match(
        /^\/api\/director\/work-assignments\/(\d+)\/personnel\/(\d+)\/sessions(?:\/(\d+))?$/
    );

    if (!match) {
        const error = new Error("Invalid Work Session URL.");
        error.statusCode = 400;
        throw error;
    }

    const workAssignmentID = Number(match[1]);
    const assignmentPersonnelID = Number(match[2]);
    const sessionID = match[3] ? Number(match[3]) : null;

    const ids = [
        workAssignmentID,
        assignmentPersonnelID
    ];

    if (sessionID !== null) {
        ids.push(sessionID);
    }

    if (ids.some(id => !Number.isSafeInteger(id) || id <= 0)) {
        const error = new Error("Invalid Work Session ID.");
        error.statusCode = 400;
        throw error;
    }

    return {
        workAssignmentID,
        assignmentPersonnelID,
        sessionID
    };
}


function validateWorkSession(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        const error = new Error("Invalid Work Session data.");
        error.statusCode = 400;
        throw error;
    }

    const workDate = body.workDate;
    const hoursWorked = body.hoursWorked;
    const hourlyRateAtTime = body.hourlyRateAtTime;

    if (
        typeof workDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(workDate)
    ) {
        const error = new Error("Work Date must use YYYY-MM-DD format.");
        error.statusCode = 400;
        throw error;
    }

    const date = new Date(workDate + "T00:00:00Z");

    if (
        isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== workDate
    ) {
        const error = new Error("Please provide a valid Work Date.");
        error.statusCode = 400;
        throw error;
    }

    if (
        typeof hoursWorked !== "number" ||
        !Number.isFinite(hoursWorked) ||
        hoursWorked <= 0 ||
        hoursWorked > 999.99 ||
        Math.round(hoursWorked * 100) !== hoursWorked * 100
    ) {
        const error = new Error(
            "Hours Worked must be a positive number with at most two decimal places."
        );
        error.statusCode = 400;
        throw error;
    }

    if (
        hourlyRateAtTime !== null &&
        hourlyRateAtTime !== undefined &&
        (
            typeof hourlyRateAtTime !== "number" ||
            !Number.isFinite(hourlyRateAtTime) ||
            hourlyRateAtTime < 0 ||
            hourlyRateAtTime > 99999999.99 ||
            Math.abs(
                hourlyRateAtTime * 100 -
                Math.round(hourlyRateAtTime * 100)
            ) > 0.000001
        )
    ) {
        const error = new Error(
            "Hourly Rate must be a nonnegative number with at most two decimal places."
        );
        error.statusCode = 400;
        throw error;
    }

    return {
        workDate,
        hoursWorked,
        hourlyRateAtTime: hourlyRateAtTime ?? null
    };
}


// VERIFY EMPLOYEE BELONGS TO THE SELECTED ASSIGNMENT

async function verifySessionPersonnel(
    workAssignmentID,
    assignmentPersonnelID
) {
    const personnel = await listAssignedPersonnel(workAssignmentID);

    const exists = personnel.some(person =>
        person.AssignmentPersonnelID === assignmentPersonnelID
    );

    if (!exists) {
        const error = new Error(
            "Employee is not assigned to this Work Assignment."
        );
        error.statusCode = 404;
        throw error;
    }
}


// LIST WORK SESSIONS

async function listWorkSessionsHandler(req, res) {
    if (!requireDirectorApi(req, res)) return;

    try {
        const {
            workAssignmentID,
            assignmentPersonnelID
        } = getWorkSessionIDs(req);

        await verifySessionPersonnel(
            workAssignmentID,
            assignmentPersonnelID
        );

        const sessions = await listWorkSessions(assignmentPersonnelID);

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify(sessions));

    } catch (error) {
        handleAssignmentError(
            res,
            error,
            "Failed to retrieve Work Sessions."
        );
    }
}


// CREATE WORK SESSION

async function createWorkSessionHandler(req, res) {
    if (!requireDirectorApi(req, res)) return;

    try {
        const {
            workAssignmentID,
            assignmentPersonnelID
        } = getWorkSessionIDs(req);

        await verifySessionPersonnel(
            workAssignmentID,
            assignmentPersonnelID
        );

        const body = await readAssignmentBody(req);
        const session = validateWorkSession(body);

        const created = await createWorkSession({
            assignmentPersonnelID,
            ...session
        });

        res.writeHead(201, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            message: "Work Session recorded successfully.",
            session: created
        }));

    } catch (error) {
        handleAssignmentError(
            res,
            error,
            "Failed to record Work Session."
        );
    }
}


// UPDATE WORK SESSION

async function updateWorkSessionHandler(req, res) {
    if (!requireDirectorApi(req, res)) return;

    try {
        const {
            workAssignmentID,
            assignmentPersonnelID,
            sessionID
        } = getWorkSessionIDs(req);

        if (sessionID === null) {
            const error = new Error("Session ID is required.");
            error.statusCode = 400;
            throw error;
        }

        await verifySessionPersonnel(
            workAssignmentID,
            assignmentPersonnelID
        );

        const body = await readAssignmentBody(req);
        const session = validateWorkSession(body);

        const updated = await updateWorkSession({
            sessionID,
            assignmentPersonnelID,
            ...session
        });

        if (!updated) {
            res.writeHead(404, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Work Session not found."
            }));
        }

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            message: "Work Session updated successfully.",
            session: updated
        }));

    } catch (error) {
        handleAssignmentError(
            res,
            error,
            "Failed to update Work Session."
        );
    }
}


// DELETE WORK SESSION

async function deleteWorkSessionHandler(req, res) {
    if (!requireDirectorApi(req, res)) return;

    try {
        const {
            workAssignmentID,
            assignmentPersonnelID,
            sessionID
        } = getWorkSessionIDs(req);

        if (sessionID === null) {
            const error = new Error("Session ID is required.");
            error.statusCode = 400;
            throw error;
        }

        await verifySessionPersonnel(
            workAssignmentID,
            assignmentPersonnelID
        );

        const deleted = await deleteWorkSession({
            sessionID,
            assignmentPersonnelID
        });

        if (!deleted) {
            res.writeHead(404, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Work Session not found."
            }));
        }

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            message: "Work Session deleted successfully."
        }));

    } catch (error) {
        handleAssignmentError(
            res,
            error,
            "Failed to delete Work Session."
        );
    }
}



// LABOR COST REPORT HANDLER


// LABOR COST REPORT HANDLER

async function generateLaborCostReportHandler(req, res) {
    if (!requireDirectorApi(req, res)) return;

    try {
        const url = new URL(req.url, "http://localhost");

        const startDate = url.searchParams.get("startDate");
        const endDate = url.searchParams.get("endDate");

        const personnelIDParam = url.searchParams.get("personnelID");
        const positionIDParam = url.searchParams.get("positionID");

        // Validate required dates

        if (!startDate || !endDate) {
            const error = new Error(
                "Both start date and end date are required."
            );
            error.statusCode = 400;
            throw error;
        }

        const datePattern = /^\d{4}-\d{2}-\d{2}$/;

        function isValidDate(value) {
            if (!datePattern.test(value)) {
                return false;
            }

            const date = new Date(value + "T00:00:00Z");

            return !isNaN(date.getTime()) &&
                date.toISOString().slice(0, 10) === value;
        }

        if (!isValidDate(startDate) || !isValidDate(endDate)) {
            const error = new Error(
                "Please provide valid dates in YYYY-MM-DD format."
            );
            error.statusCode = 400;
            throw error;
        }

        if (startDate > endDate) {
            const error = new Error(
                "Start date cannot be later than end date."
            );
            error.statusCode = 400;
            throw error;
        }

        // Validate optional employee and position filters

        function parseOptionalID(value, fieldName) {
            if (value === null || value === "") {
                return null;
            }

            if (!/^[1-9]\d*$/.test(value)) {
                const error = new Error(
                    `${fieldName} must be a positive integer.`
                );
                error.statusCode = 400;
                throw error;
            }

            const id = Number(value);

            if (!Number.isSafeInteger(id) || id > 2147483647) {
                const error = new Error(
                    `${fieldName} is outside the valid ID range.`
                );
                error.statusCode = 400;
                throw error;
            }

            return id;
        }

        const personnelID = parseOptionalID(
            personnelIDParam,
            "Personnel ID"
        );

        const positionID = parseOptionalID(
            positionIDParam,
            "Position ID"
        );

        // Generate the filtered report

        const report = await generateLaborCostReport(
            startDate,
            endDate,
            personnelID,
            positionID
        );

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify(report));

    } catch (error) {
        handleAssignmentError(
            res,
            error,
            "Failed to generate labor cost report."
        );
    }
}


// EXPORT HANDLERS

module.exports = {
    listWorkAssignmentsHandler,
    createWorkAssignmentHandler,
    updateWorkAssignmentHandler,
    listAssignedPersonnelHandler,
    assignPersonnelHandler,
    listWorkSessionsHandler,
    createWorkSessionHandler,
    updateWorkSessionHandler,
    deleteWorkSessionHandler,
    generateLaborCostReportHandler
};