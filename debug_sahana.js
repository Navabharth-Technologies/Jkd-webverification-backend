const { sql, connectDB } = require('./src/config/db');
const fs = require('fs');

async function debugSahana() {
    try {
        await connectDB();
        console.log('Connected to Database.');

        const query = `
            SELECT R.RetailerId, R.ShopName, R.RetailerName, R.UserId, RT.BusinessType, RST.Status, RST.UpdatedAt
            FROM Retailers R
            LEFT JOIN RegistrationType RT ON R.UserId = RT.UserId
            LEFT JOIN RetailerStatusTracking RST ON R.RetailerId = RST.RetailerId
            WHERE R.ShopName LIKE '%Sahana%' OR R.RetailerName LIKE '%Sahana%'
        `;

        const request = new sql.Request();
        const result = await request.query(query);

        console.log(`Found ${result.recordset.length} retailers matching 'Sahana'.`);
        fs.writeFileSync('debug_sahana.json', JSON.stringify(result.recordset, null, 2));
        console.log('Debug data written to debug_sahana.json');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

debugSahana();
