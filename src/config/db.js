const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT) || 1433,
    requestTimeout: 60000, // 60 seconds
    connectionTimeout: 60000, // 60 seconds
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 60000 // Redundant safety for tedious
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const connectDB = async () => {
    try {
        await sql.connect(config);
        console.log('SQL Server Connected Configured');
    } catch (err) {
        console.error('Database connection failed (Check .env configuration):', err.message);
        // Do not exit, allow retry logic to handle reconnection or fail gracefully
        throw err;
    }
};

module.exports = { connectDB, sql };
