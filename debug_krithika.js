const { sql, connectDB } = require('./src/config/db');
const fs = require('fs');

async function run() {
    try {
        await connectDB();

        console.log("Querying Krithika...");

        const result = await sql.query(`
            SELECT *
            FROM Retailers
            WHERE ShopName LIKE '%Krithika%'
        `);

        fs.writeFileSync('debug_krithika.txt', JSON.stringify(result.recordset, null, 2));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

run();
