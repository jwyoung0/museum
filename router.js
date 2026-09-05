const fs = require("fs");
const path = require("path");

function router(req, res) {
    if (req.url === "/") {
        sendPage(res, "index.html");
    }
    else if (req.url === "/employees") {
        sendPage(res, "employees.html");
    }
    else if (req.url === "/about") {
        sendPage(res, "about.html");
    }
    else {
        res.writeHead(404, {
            "Content-Type": "text/html"
        });

        res.end("<h1>404 - Page Not Found</h1>");
    }
}

function sendPage(res, filename) {

    const filePath = path.join(
        __dirname,
        "public",
        filename
    );

    fs.readFile(filePath, (err, data) => {

        if (err) {
            res.writeHead(500);
            res.end("Server error");
            return;
        }

        res.writeHead(200, {
            "Content-Type": "text/html"
        });

        res.end(data);
    });
}

module.exports = router;