const {
    searchPersonnelForAccounts,
    createUserAccount,
    updateUserAccount,
    deleteUserAccount
} = require("../../database/director/accounts");

const { readJsonBody } = require("../../utils/http");

async function searchPersonnelForAccountsHandler(req, res) {
    if (!req.user || req.user.role !== "director") {
        res.writeHead(403, {
            "Content-Type": "application/json"
        });

        return res.end(JSON.stringify({
            error: "Forbidden"
        }));
    }

    try {
        const url = new URL(req.url, "http://localhost");
        const searchTerm = url.searchParams.get("term") || "";

        if (searchTerm.length > 100) {
            const error = new Error("Search term must not exceed 100 characters");
            error.statusCode = 400;
            throw error;
        }

        const personnel = await searchPersonnelForAccounts(searchTerm);

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify(personnel));
    } catch (error) {
        console.error("Personnel account search error:", error);

        const statusCode = Number.isInteger(error.statusCode)
            ? error.statusCode
            : 500;

        res.writeHead(statusCode, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: statusCode >= 500
                ? "Unable to search employees. Try again later."
                : error.message
        }));
    }
}

async function createUserAccountHandler(req, res) {
    if (!req.user || req.user.role !== "director") {
        res.writeHead(403, {
            "Content-Type": "application/json"
        });

        return res.end(JSON.stringify({
            error: "Forbidden"
        }));
    }
    try {
        const body = await readJsonBody(req);

        const email = typeof body.email === "string" ? body.email.trim() : "";
        const password = typeof body.password === "string" ? body.password : "";    
        const role = typeof body.role === "string" 
            ? body.role.trim().toLowerCase() 
            : "";
        const personnelId = 
            Number.isInteger(body.personnelId)
                ? body.personnelId
                : Number.parseInt(body.personnelId, 10);


        if (!email || email.length > 20) {
            const error = new Error("Email is required and must not exceed 20 characters");
            error.statusCode = 400;
            throw error;
        }

        if (!email.toLowerCase().endsWith("@museum.com")) {
            const error = new Error("Staff email must end with @museum.com");
            error.statusCode = 400;
            throw error;
        }

        if (!password || password.length > 12) {
            const error = new Error("Invalid user registration information");
            error.statusCode = 400;
            throw error;
        }

        if (!Number.isInteger(personnelId) || personnelId <= 0) {
            const error = new Error("Invalid personnel ID");
            error.statusCode = 400;
            throw error;
        }
            
        const validRoles = [
            "director",
            "curator",
            "admin",
            "gift_shop_manager"
        ];

        if (!validRoles.includes(role)) {
            const error = new Error("Invalid role");
            error.statusCode = 400;
            throw error;
        }

        const account = await createUserAccount({
            email: email,
            password: password,
            role: role,
            personnelId: personnelId,
        });

        res.writeHead(201, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            message: "Account created",
            userID: account.userID
        }));
    } catch (error) {
        console.error("Staff account creation error:", error);

        const statusCode = Number.isInteger(error.statusCode)
            ? error.statusCode
            : 500;

        res.writeHead(statusCode, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: statusCode >= 500
                ? "Unable to create application credentials. Try again later."
            : error.message 
        }));
    }
}

async function updateUserAccountHandler(req, res, personnelId) {
    if (!req.user || req.user.role !== "director") {
        res.writeHead(403, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Forbidden" }));
    }

    try {
        const body = await readJsonBody(req);
        const email = typeof body.email === "string" ? body.email.trim() : "";
        const password = typeof body.password === "string" && body.password
            ? body.password
            : null;
        const role = typeof body.role === "string"
            ? body.role.trim().toLowerCase()
            : "";

        if (!Number.isInteger(personnelId) || personnelId <= 0) {
            const error = new Error("Invalid personnel ID");
            error.statusCode = 400;
            throw error;
        }
        if (!email || email.length > 50) {
            const error = new Error("Email is required and must not exceed 50 characters");
            error.statusCode = 400;
            throw error;
        }
        if (!email.toLowerCase().endsWith("@museum.com")) {
            const error = new Error("Staff email must end with @museum.com");
            error.statusCode = 400;
            throw error;
        }
        if (password && password.length > 12) {
            const error = new Error("Password must not exceed 12 characters");
            error.statusCode = 400;
            throw error;
        }

        const validRoles = ["director", "curator", "admin", "gift_shop_manager"];
        if (!validRoles.includes(role)) {
            const error = new Error("Invalid role");
            error.statusCode = 400;
            throw error;
        }

        await updateUserAccount({ email, password, role, personnelId });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Account updated" }));
    } catch (error) {
        console.error("Staff account update error:", error);
        const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
        res.writeHead(statusCode, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            error: statusCode >= 500
                ? "Unable to update account. Try again later."
                : error.message
        }));
    }
}

async function deleteUserAccountHandler(req, res, personnelId) {
    if (!req.user || req.user.role !== "director") {
        res.writeHead(403, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Forbidden" }));
    }

    try {
        if (!Number.isInteger(personnelId) || personnelId <= 0) {
            const error = new Error("Invalid personnel ID");
            error.statusCode = 400;
            throw error;
        }

        await deleteUserAccount(personnelId);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Account deleted" }));
    } catch (error) {
        console.error("Staff account deletion error:", error);
        const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
        res.writeHead(statusCode, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            error: statusCode >= 500
                ? "Unable to delete account. Try again later."
                : error.message
        }));
    }
}

module.exports = {
    searchPersonnelForAccountsHandler,
    createUserAccountHandler,
    updateUserAccountHandler,
    deleteUserAccountHandler
};