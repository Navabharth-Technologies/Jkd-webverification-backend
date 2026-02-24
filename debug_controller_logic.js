const { sql, connectDB } = require('./src/config/db');

async function debugControllerLogic() {
    try {
        await connectDB();
        const request = new sql.Request();

        const state = 'Karnataka';
        const district = 'Mysuru';
        const town = 'Kuvempunagara';

        console.log(`Testing filter with State: '${state}', District: '${district}', Town: '${town}'`);

        let query = `
            SELECT 
                RetailerId, ShopName, State, District, Town, AddressLine1, AddressLine2, Status
            FROM Retailers R
            LEFT JOIN RetailerStatusTracking RST ON R.RetailerId = RST.RetailerId
            WHERE 
                (R.State = @state OR R.AddressLine1 LIKE '%' + @state + '%' OR R.AddressLine2 LIKE '%' + @state + '%')
                AND
                (R.District LIKE '%' + @district + '%' OR R.AddressLine1 LIKE '%' + @district + '%' OR R.AddressLine2 LIKE '%' + @district + '%')
                AND
                (R.Town LIKE '%' + @town + '%' OR R.AddressLine1 LIKE '%' + @town + '%' OR R.AddressLine2 LIKE '%' + @town + '%')
        `;

        request.input('state', sql.VarChar, state);
        request.input('district', sql.VarChar, district);
        request.input('town', sql.VarChar, town);

        const result = await request.query(query);
        console.log("Found records:", result.recordset.length);

        if (result.recordset.length === 0) {
            console.log("No records found with strict AND logic. Trying individual checks...");

            // Check State only
            console.log("Checking State only...");
            const r1 = await request.query(`SELECT COUNT(*) as C FROM Retailers WHERE State = '${state}' OR AddressLine1 LIKE '%${state}%'`);
            console.log("State matches:", r1.recordset[0].C);

            // Check District only
            console.log("Checking District only...");
            const r2 = await request.query(`SELECT COUNT(*) as C FROM Retailers WHERE District LIKE '%${district}%' OR AddressLine1 LIKE '%${district}%'`);
            console.log("District matches:", r2.recordset[0].C);

            // Check Town only
            console.log("Checking Town only...");
            const r3 = await request.query(`SELECT COUNT(*) as C FROM Retailers WHERE Town LIKE '%${town}%' OR AddressLine1 LIKE '%${town}%'`);
            console.log("Town matches:", r3.recordset[0].C);
        } else {
            result.recordset.forEach(r => {
                console.log(`MATCH: ${r.ShopName} (${r.RetailerId}) - ${r.AddressLine1}`);
            });
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        // process.exit();
    }
}

debugControllerLogic();
