const { sql, connectDB } = require('./src/config/db');
const fs = require('fs');

async function run() {
    try {
        await connectDB();

        console.log("Querying RegistrationType for JKDOB01...");

        const result = await sql.query(`
            SELECT *
            FROM RegistrationType
            WHERE UserId = 'JKDOB01'
        `);

        fs.writeFileSync('debug_regtype.txt', JSON.stringify(result.recordset, null, 2));
        console.log("Done.");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

run();
