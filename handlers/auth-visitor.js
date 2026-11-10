const { visitorLoginAttempt } = require("../database/auth-visitor");
const { staffLoginAttempt } = require("../database/login");
const { readJsonBody } = require("../utils/http");
const { createSession } = require("../utils/sessions");

async function getAccessByEmail(email, password) {
    const normalizedEmail = typeof email === "string"
        ? email.trim().toLowerCase()
        : "";
    const isStaff = /^[^@\s]+@museum\.com$/.test(normalizedEmail);
    const loginAttempt = isStaff ? staffLoginAttempt : visitorLoginAttempt;

    return {
        isStaff,
        loginResults: await loginAttempt({ email, password })
    };
}

async function authVisitorHandler(req, res) {
    try {
        const body = await readJsonBody(req);
        const { isStaff, loginResults } = await getAccessByEmail(
            body.email,
            body.password
        );

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
            ...(isStaff
                ? { role: loginResults.role }
                : {
                    userType: loginResults.role,
                    visitorId: loginResults.visitorId
                })
        });

        const routeByUserType = {
            visitor: "/",
            member: "/"
        };
        const routeByRole = {
            curator: "/curator/artwork",
            director: "/director/dashboard",
            gift_shop_manager: "/gift-shop/products"
        };
        const redirectTo = isStaff
            ? routeByRole[loginResults.role] || "/"
            : routeByUserType[loginResults.role] || "/";

        res.writeHead(200, {
            "Content-Type": "application/json",
            "Set-Cookie": 
                `sessionId=${sessionId}; HttpOnly; Path=/; SameSite=Strict`
        });

        res.end(JSON.stringify({
            email: loginResults.email,
            role: loginResults.role,
            redirectTo
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
    authVisitorHandler
};