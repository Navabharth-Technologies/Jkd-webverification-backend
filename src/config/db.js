const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'admin',
    password: (process.env.DB_PASSWORD || 'JKD@#12345').replace(/^["']|["']$/g, ''),
    server: process.env.DB_SERVER || 'jkdmart.database.windows.net',
    database: process.env.DB_NAME || 'jkdmartdb',
    port: parseInt(process.env.DB_PORT) || 1433,
    requestTimeout: 90000, 
    connectionTimeout: 90000, 
    options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true,
        connectTimeout: 90000 
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool = null;
let poolPromise = null;

const connectDB = async () => {
    try {
        if (pool) return pool;
        
        if (!poolPromise) {
            console.log('[DB] Starting connection attempt...');
            poolPromise = sql.connect(config)
                .then(newPool => {
                    pool = newPool;
                    console.log('[DB] SQL Server Connected & Pool Created');
                    return newPool;
                })
                .catch(err => {
                    poolPromise = null; // Reset promise so we can retry
                    console.error('[DB] Connection attempt failed:', err.message);
                    throw err;
                });
        }
        
        return await poolPromise;
    } catch (err) {
        console.error('[DB] connectDB failed:', err.message);
        throw err;
    }
};

module.exports = { connectDB, sql };
