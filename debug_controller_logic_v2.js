const { sql, connectDB } = require('./src/config/db');

async function debugControllerLogic() {
    try {
        console.log("Connecting to DB...");
        await connectDB();
        console.log("Connected.");
        const request = new sql.Request();

        const state = 'Karnataka';
        const district = 'Mysuru';
        const town = 'Kuvempunagara';

        console.log(`Testing filter with State: '${state}', District: '${district}', Town: '${town}'`);

        let query = `
            SELECT 
                count(*)
            FROM Retailers R
        `;
        // stripped down query to test connection first
        const r0 = await request.query(query);
        console.log("Total retailers:", r0.recordset[0]['']);


        // Full logic check
        const rFull = await request.query(`
            SELECT RetailerId, ShopName, AddressLine1 FROM Retailers 
            WHERE 
            (State = '${state}' OR AddressLine1 LIKE '%${state}%' OR AddressLine2 LIKE '%${state}%')
            AND
            (District LIKE '%${district}%' OR AddressLine1 LIKE '%${district}%' OR AddressLine2 LIKE '%${district}%')
            AND
            (Town LIKE '%${town}%' OR AddressLine1 LIKE '%${town}%' OR AddressLine2 LIKE '%${town}%')
         `);
        console.log("Found with full logic:", rFull.recordset.length);
        rFull.recordset.forEach(r => console.log(r));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

debugControllerLogic();
