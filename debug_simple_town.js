const { sql, connectDB } = require('./src/config/db');

async function debugSimple() {
    try {
        await connectDB();
        const request = new sql.Request();

        console.log("Checking simple Town match...");
        // Just check if ANY retailer matches Town = 'Kuvempunagara' exactly or via LIKE
        const result = await request.query(`
            SELECT COUNT(*) as ExactMatch FROM Retailers WHERE Town = 'Kuvempunagara'
        `);
        const result2 = await request.query(`
            SELECT COUNT(*) as LikeMatch FROM Retailers WHERE Town LIKE '%Kuvempunagara%'
        `);
        const result3 = await request.query(`
             SELECT COUNT(*) as AddressMatch FROM Retailers WHERE AddressLine1 LIKE '%Kuvempunagara%'
        `);

        console.log("Exact Town Match:", result.recordset[0].ExactMatch);
        console.log("LIKE Town Match:", result2.recordset[0].LikeMatch);
        console.log("Address Match:", result3.recordset[0].AddressMatch);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

debugSimple();
