const { registerVisitorAccount } = require("../database/auth-visitor");
const { readJsonBody } = require("../utils/http");
const { createSession } = require("../utils/sessions");

async function registerVisitorHandler(req, res) {
    const body = await readJsonBody(req);

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || name.length > 100 ||
        !email.includes("@") || email.length > 50 ||
        !password || password.length > 20) {
        const error = new Error("Invalid registration information");
        error.statusCode = 400;
        throw error;
    }

    const account = await registerVisitorAccount({
        name: name,
        email: email,
        password: password
    });

    const sessionId = createSession({
        email: email,
        userType: "visitor",
        visitorId: account.visitorId
    });

    res.writeHead(201, {
        "Content-Type": "application/json",
        "Set-Cookie": `sessionId=${sessionId}; HttpOnly; Path=/; SameSite=Strict`
    });
    res.end(JSON.stringify({
        message: "Account created",
        visitorId: account.visitorId,
        redirectTo: "/"
    }));
}

module.exports = {
    registerVisitorHandler
};
