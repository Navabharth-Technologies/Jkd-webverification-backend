const { sql, connectDB } = require('./src/config/db');
const fs = require('fs');

async function run() {
    try {
        await connectDB();

        console.log("Finding a non-JKDOB01 retailer...");

        const result = await sql.query(`
            SELECT TOP 1 R.UserId, R.ShopName
            FROM Retailers R
            WHERE R.UserId <> 'JKDOB01' AND R.UserId IS NOT NULL
        `);

        if (result.recordset.length > 0) {
            const userId = result.recordset[0].UserId;
            console.log(`Found User: ${userId} (${result.recordset[0].ShopName})`);

            const userResult = await sql.query(`
                SELECT * FROM Users WHERE UserId = '${userId}'
            `);

            const regResult = await sql.query(`
                SELECT * FROM RegistrationType WHERE UserId = '${userId}'
            `);

            const output = `User (${userId}):\n${JSON.stringify(userResult.recordset, null, 2)}\n\nRegTypes:\n${JSON.stringify(regResult.recordset, null, 2)}`;
            fs.writeFileSync('debug_other_user.txt', output);
        } else {
            console.log("No other users found.");
            fs.writeFileSync('debug_other_user.txt', "No other users found.");
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

run();
