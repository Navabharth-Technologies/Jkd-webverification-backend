const { sql, connectDB } = require('./src/config/db');
const fs = require('fs');

async function run() {
    try {
        await connectDB();

        console.log("Connected. Querying Vanish...");

        const result = await sql.query(`
            SELECT 
                R.RetailerId, 
                R.ShopName, 
                R.UserId, 
                U.FullName as UserName,
                RT.BusinessType as RegType
            FROM Retailers R
            LEFT JOIN Users U ON R.UserId = U.UserId
            LEFT JOIN RegistrationType RT ON R.UserId = RT.UserId
            WHERE R.ShopName LIKE '%Vanish%'
        `);

        // Also check columns of Retailers table
        const columnsResult = await sql.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Retailers'
        `);
        const columns = columnsResult.recordset.map(c => c.COLUMN_NAME).join(', ');

        const output = `Data:\n${JSON.stringify(result.recordset, null, 2)}\n\nColumns:\n${columns}`;
        fs.writeFileSync('debug_output.txt', output);
        console.log("Done writing to debug_output.txt");

    } catch (err) {
        console.error("Error:", err);
        fs.writeFileSync('debug_output.txt', "Error: " + err);
    } finally {
        process.exit();
    }
}

run();
