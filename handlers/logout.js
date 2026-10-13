const { deleteSession, parseCookies } = require("../utils/sessions");

async function logoutHandler(req, res) {
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies.sessionId;
    
    // removes the server-side session
    if (sessionId) {
        deleteSession(sessionId);  
    }

    // tells browser to clear cookie
    res.writeHead(303, {
        Location: "/",
        "Set-Cookie": "sessionId=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    });                          

    res.end();
}

module.exports = {
    logoutHandler
}