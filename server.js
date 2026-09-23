require("dotenv").config();

const http = require("http");
const router = require("./router");
const { parseCookies, getSession } = require("./utils/sessions");

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    const cookies = parseCookies(req.headers.cookie);

    const session = cookies.sessionId ? getSession(cookies.sessionId) : null;

    if (session) {
        req.user = session;
    } else {
        req.user = null;
    }

    router(req, res);
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});