/* Moved to router.js line 38-41 or not?*/
const {
    listPersonnel,
    createPersonnel,
    deactivatePersonnel,
    reactivatePersonnel
} = require("../../database/director/personnel");

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

        const fname = personnel.fname?.trim();
        const mname = personnel.mname?.trim() || null;
        const lname = personnel.lname?.trim();
        const dateOfBirth = personnel.dateOfBirth;
        const ssn = personnel.ssn;
        const email = personnel.email?.trim() || null;
        const phoneNumber = personnel.phoneNumber?.trim() || null;
        const startDate = personnel.startDate || null;
        const endDate = personnel.endDate || null;
        const positionID =
            personnel.positionID == null || personnel.positionID === ""
                ? null
                : Number(personnel.positionID);
        const status = Number(personnel.employmentStatus);

        if (!fname || !lname || !dateOfBirth || !ssn) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "First name, last name, date of birth, and SSN are required"
            }));
        }

        if (fname.length > 50 || mname?.length > 50 || lname.length > 50) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Names must not exceed 50 characters"
            }));
        }

        if (!/^\d{9}$/.test(ssn)) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "SSN must contain exactly 9 digits"
            }));
        }

        if (email && email.length > 50) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Email must not exceed 50 characters"
            }));
        }

        if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Phone number must contain exactly 10 digits"
            }));
        }

        if (!Number.isInteger(status) || (status !== 0 && status !== 1)) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Invalid employment status"
            }));
        }

        if (
            positionID !== null &&
            (!Number.isInteger(positionID) || positionID < 1)
        ) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            return res.end(JSON.stringify({
                error: "Invalid position ID"
            }));
        }

        const created = await createPersonnel({
            fname,
            mname,
            lname,
            email,
            phoneNumber,
            dateOfBirth,
            startDate,
            endDate,
            positionID,
            employmentStatus: status,
            ssn
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


async function deactivatePersonnelHandler(req, res) {
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

        if (
            !data ||
            !Array.isArray(data.personnelIDs) ||
            data.personnelIDs.length === 0 ||
            data.personnelIDs.length > 500 ||
            !data.personnelIDs.every(
                id => Number.isInteger(id) && id > 0
            )
        ) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });
            res.end(JSON.stringify({
                error: "Invalid personnel selection"
            }));
            return;
        }

        const affected = await deactivatePersonnel(
            data.personnelIDs
        );

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            message: "Personnel deactivation successful",
            affected
        }));
    } catch (error) {
        if (error instanceof SyntaxError) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });
            res.end(JSON.stringify({
                error: "Invalid JSON request"
            }));
            return;
        }

        console.error("Personnel deactivation failed:", error);

        res.writeHead(500, {
            "Content-Type": "application/json"
        });
        res.end(JSON.stringify({
            error: "Unable to deactivate personnel"
        }));
    }
}


async function reactivatePersonnelHandler(req, res) {
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

        if (
            !data ||
            !Array.isArray(data.personnelIDs) ||
            data.personnelIDs.length === 0 ||
            data.personnelIDs.length > 500 ||
            !data.personnelIDs.every(
                id => Number.isInteger(id) && id > 0
            )
        ) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                error: "Invalid personnel selection"
            }));

            return;
        }

        const affected = await reactivatePersonnel(
            data.personnelIDs
        );

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            message: "Personnel reactivation successful",
            affected
        }));
    } catch (error) {
        if (error instanceof SyntaxError) {
            res.writeHead(400, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                error: "Invalid JSON request"
            }));

            return;
        }

        console.error("Personnel reactivation failed:", error);

        res.writeHead(500, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: "Unable to reactivate personnel"
        }));
    }
}




module.exports = {
    listPersonnelHandler,
    createPersonnelHandler,
    deactivatePersonnelHandler,
    reactivatePersonnelHandler
};
