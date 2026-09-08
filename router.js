const fs = require("fs");
const path = require("path");
const { createEmployeeHandler } = require("./handlers/employees");

async function router(req, res) {
    try {
        if (req.method === "POST" && req.url === "/api/employees") {
            await createEmployeeHandler(req, res);
            return;
        }

        if (req.method === "GET" && (req.url === "/" || req.url === "/home")) {
            sendPage(res, "index.html", "text/html");
            return;
        }

        if (req.method === "GET" && req.url === "/employees") {
            sendPage(res, "employees.html", "text/html");
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

        if (req.method === "GET" && req.url === "/js/employees.js") {
            sendPage(res, path.join("js", "employees.js"), "application/javascript");
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