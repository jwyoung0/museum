const { visitorLoginAttempt } = require("../database/auth-visitor");
const { readJsonBody } = require("../utils/http");
const { createSession } = require("../utils/sessions");

async function authVisitorHandler(req, res) {
    const body = await readJsonBody(req);
    
    const loginResults = await visitorLoginAttempt({
        email: body.email,
        password: body.password
    });

    if (!loginResults) {
        res.writeHead(401, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: "Invalid username or password"
        }));

        return;
    }

    const sessionId = createSession({
        email: loginResults.email,
        userType: loginResults.userType
    });

    const routeByUserType = {
        visitor: "/",
        member: "/"
    };

    res.writeHead(200, {
        "Content-Type": "application/json",
        "Set-Cookie": `sessionId=${sessionId}; HttpOnly; Path=/; SameSite=Strict`
    });

    res.end(JSON.stringify({
        email: loginResults.email,
        userType: loginResults.userType,
        redirectTo: routeByUserType[loginResults.userType] || "/"        
    }));
}

module.exports = {  
    authVisitorHandler
};