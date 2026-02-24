const { sql, connectDB } = require('./src/config/db');
const fs = require('fs');

async function run() {
    try {
        await connectDB();

        console.log("Querying User JKDOB01...");

        const result = await sql.query(`
            SELECT *
            FROM Users
            WHERE UserId = 'JKDOB01'
        `);

        // Check columns of Users table
        const columnsResult = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Users'
        `);
        const columns = columnsResult.recordset.map(c => c.COLUMN_NAME).join(', ');

        const output = `User Data:\n${JSON.stringify(result.recordset, null, 2)}\n\nUser Columns:\n${columns}`;
        fs.writeFileSync('debug_user.txt', output);
        console.log("Done writing to debug_user.txt");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

run();
