const fs = require("fs");
const path = require("path");

function router(req, res) {
    if (req.url === "/" || req.url === "/home") {
        sendPage(res, "index.html", "text/html");
    }
    else if (req.url === "/employees") {
        sendPage(res, "employees.html", "text/html");
    }
    else if (req.url === "/about") {
        sendPage(res, "about.html", "text/html");
    }
    else if (req.url === "/style") {
        sendPage(res, "style.css", "text/css");
    }
    else {
        res.writeHead(404, {
            "Content-Type": "text/html"
        });

        res.end("<h1>404 - Page Not Found</h1>");
    }
}

function sendPage(res, filename, contentType) {

    const filePath = path.join(
        __dirname,
        "public",
        filename
    );

    fs.readFile(filePath, (err, data) => {

        if (err) {
            res.writeHead(500, {
                "Content-Type": "text/plain"
            });

            res.end("Server error");
            return;
        }

        res.writeHead(200, {
            "Content-Type": contentType
        });

        res.end(data);
    });
}

module.exports = router;