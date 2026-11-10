const { loginAttempt } = require("../database/login");
const { readJsonBody } = require("../utils/http");
const { createSession } = require("../utils/sessions");

async function loginHandler(req, res) {
    try {
        const body = await readJsonBody(req);
        
        const loginResults = await loginAttempt({
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
            role: loginResults.role
        });

        const routeByRole = {
            curator: "/curator/artwork",
            director: "/director/dashboard",
            gift_shop_manager: "/gift-shop/products"
        };

        res.writeHead(200, {
            "Content-Type": "application/json",
            "Set-Cookie": 
                `sessionId=${sessionId}; HttpOnly; Path=/; SameSite=Strict`
        });

        res.end(JSON.stringify({
            email: loginResults.email,
            role: loginResults.role,
            redirectTo: routeByRole[loginResults.role] || "/"        
        }));
    } catch (error) {
        console.error("Login error:", error);

        res.writeHead(503, {
            "Content-Type": "application/json"
        });

        res.end(JSON.stringify({
            error: "The service is temporarily unavailable. Please try again in a few moments."
        }));
    }  
}

module.exports = {
    loginHandler
};