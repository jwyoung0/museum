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

let poolPromise;

function getPool() {
    if (!poolPromise) {
        poolPromise = new sql.ConnectionPool(config)
            .connect()
            .catch((error) => {
                poolPromise = undefined;
                throw error;
            });
    }

    return poolPromise;
}

async function closePool() {
    if (poolPromise) {
        const pool = await poolPromise;
        await pool.close();
        poolPromise = undefined;
    }
}

module.exports = {
    sql,
    getPool,
    closePool
};