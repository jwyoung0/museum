require("dotenv").config

const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    const filePath = path.join(__dirname, "public", "index.html");

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
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});