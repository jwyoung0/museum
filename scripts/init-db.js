require("dotenv").config();

const fs = require("node:fs/promises");
const path = require("node:path");
const sql = require("mssql");

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

async function initializeDatabase() {
    const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
    const schema = await fs.readFile(schemaPath, "utf8");
    const pool = await sql.connect(config);

    try {
        await pool.request().batch(schema);
        console.log("Database schema initialized.");
    } finally {
        await pool.close();
    }
}

initializeDatabase().catch((error) => {
    console.error("Database initialization failed:", error);
    process.exitCode = 1;
});