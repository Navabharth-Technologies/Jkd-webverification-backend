const { sql, connectDB } = require('./src/config/db');
const fs = require('fs');

async function run() {
    try {
        await connectDB();

        console.log("Listing UserIds...");

        const result = await sql.query(`
            SELECT UserId, FullName, CreatedAt
            FROM Users
            ORDER BY CreatedAt DESC
        `);

        fs.writeFileSync('debug_ids.txt', JSON.stringify(result.recordset, null, 2));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

run();
