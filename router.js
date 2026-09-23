const fs = require("fs");
const path = require("path");
const { loginHandler } = require("./handlers/login");

async function router(req, res) {
    try {
    
        // Handler file routing starts here
        if (req.method === "POST" && req.url === "/api/login") {
            await loginHandler(req, res);
            return;
        }

        // HTML file routing starts here
        if (req.method === "GET" && (req.url === "/" || req.url === "/home")) {
            sendPage(res, "index.html", "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/admin-dashboard") {
            sendPage(res, "admin-dashboard.html", "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/collection") {
            sendPage(res, "collection.html", "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/about") {
            sendPage(res, "about.html", "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/style") {
            sendPage(res, "style.css", "text/css");
            return;
        }

        // Client script file routing starts here
        if (req.method === "GET" && req.url === "/js/login.js") {
            sendPage(res, path.join("js", "login.js"), "application/javascript");
            return;
        }

        if (req.method === "GET" && req.url === "/js/collection.js") {
            sendPage(res, path.join("js", "collection.js"), "application/javascript");
            return;
        }

        // Images routing
        if (req.method === "GET" && req.url.startsWith("/images/")) {
            const filename = path.basename(req.url);

            const ext = path.extname(filename).toLowerCase();
            let contentType = "application/octet-stream";

            if (ext === '.webp') contentType = 'image/webp';
            else if (ext === '.png') contentType = 'image/png';
            else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
            else if (ext === '.gif') contentType = 'image/gif';
            
            sendPage(res, path.join("images", filename), contentType);
            return;
        }

        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>404 - Page Not Found</h1>");
    } catch (error) {
        console.error(error);

        if (!res.headersSent) {
            const statusCode = error.statusCode || (error instanceof TypeError ? 400 : 500);

            res.writeHead(statusCode, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: error.message }));
        } else {
            res.end();
        }
    }
}

function sendPage(res, filename, contentType) {
    const filePath = path.join(__dirname, "public", filename);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Server error");
            return;
        }

        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    });
}

module.exports = router;