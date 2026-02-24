const { sql, connectDB } = require('./src/config/db');

async function checkTownSpelling() {
    try {
        await connectDB();
        const request = new sql.Request();

        console.log("Checking for 'Kuvempu' variations in Address and Town columns...");
        const result = await request.query(`
            SELECT RetailerId, Town, AddressLine1 
            FROM Retailers 
            WHERE 
                Town LIKE '%Kuvempu%' OR 
                AddressLine1 LIKE '%Kuvempu%'
        `);

        console.log("Found records:", result.recordset.length);
        result.recordset.forEach(r => {
            console.log(`ID: ${r.RetailerId}`);
            console.log(`Town Col: '${r.Town}'`);
            console.log(`Address1: '${r.AddressLine1}'`);
            console.log('---');
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

checkTownSpelling();
