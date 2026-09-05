require("dotenv").config

const http = require("http");
const router = require("./router");

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    router(req, res);
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});