const { sql, connectDB } = require('./src/config/db');

async function debugRetailers() {
    try {
        await connectDB();
        const request = new sql.Request();

        console.log("Fetching retailers with address details...");
        const result = await request.query(`
            SELECT TOP 50 
                RetailerId, ShopName, State, District, Town, AddressLine1, AddressLine2 
            FROM Retailers 
            WHERE 
                State LIKE '%Karnataka%' OR 
                District LIKE '%Mysuru%' OR 
                Town LIKE '%Kuvempunagara%' OR
                AddressLine1 LIKE '%Kuvempunagara%' OR
                AddressLine2 LIKE '%Kuvempunagara%'
        `);

        console.log("Found records:", result.recordset.length);
        result.recordset.forEach(r => {
            console.log('------------------------------------------------');
            console.log(`ID: ${r.RetailerId}, Shop: ${r.ShopName}`);
            console.log(`State: '${r.State}'`);
            console.log(`District: '${r.District}'`);
            console.log(`Town: '${r.Town}'`);
            console.log(`Address1: '${r.AddressLine1}'`);
            console.log(`Address2: '${r.AddressLine2}'`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        // process.exit();
    }
}

debugRetailers();
