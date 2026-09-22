const { loginAttempt } = require("../database/login");
const { readJsonBody } = require("../utils/http");

async function loginHandler(req, res) {
    const body = await readJsonBody(req);
    
    const loginResults = await loginAttempt({
        username: body.username,
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

    res.writeHead(200, {
        "Content-Type": "application/json"
    });

    res.end(JSON.stringify({
        username: loginResults.username,
        role: loginResults.role
    }));
}

module.exports = {
    loginHandler
};