require("dotenv").config();

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

async function testConnection() {
    try {
        console.log("Connecting to Azure SQL...");

        await sql.connect(config);

        console.log("✅ Connected to Azure SQL successfully!");

        const result = await sql.query`
            SELECT GETDATE() AS currentTime
        `;

        console.log("Database response:", result.recordset);

    } catch (error) {
        console.error("❌ Connection failed:");
        console.error(error);
    } finally {
        await sql.close();
    }
}

testConnection();
