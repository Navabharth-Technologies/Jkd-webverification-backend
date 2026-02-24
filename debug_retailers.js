const { sql, connectDB } = require('./src/config/db');
const fs = require('fs');

async function debugRetailers() {
    try {
        await connectDB();

        let output = {};

        // 1. Check if ANY retailer exists linked to RegistrationType
        const query = `
            SELECT R.RetailerId, R.ShopName, R.RetailerName, R.UserId, RT.BusinessType, R.CreatedAt, RST.Status, RST.UpdatedAt
            FROM Retailers R
            INNER JOIN RegistrationType RT ON R.UserId = RT.UserId
            LEFT JOIN RetailerStatusTracking RST ON R.RetailerId = RST.RetailerId
            WHERE RT.BusinessType = 'Retailer'
        `;
        const result = await sql.query(query);
        output.SelfRegisteredRetailers = result.recordset;

        // 2. If none, show ALL retailers to see what we have
        if (result.recordset.length === 0) {
            const all = await sql.query("SELECT TOP 5 RetailerId, ShopName, UserId FROM Retailers");
            output.AllRetailersSample = all.recordset;
        }

        // 3. Check RegistrationType for 'Retailer' entries specifically
        const regTypeUsers = await sql.query("SELECT * FROM RegistrationType WHERE BusinessType = 'Retailer'");
        output.RegistrationTypeEntries = regTypeUsers.recordset;

        fs.writeFileSync('debug_retailers.json', JSON.stringify(output, null, 2));
        console.log("Debug results written to debug_retailers.json");

    } catch (err) {
        console.error("Debug Error:", err);
        fs.writeFileSync('debug_error.txt', err.toString());
    } finally {
        process.exit();
    }
}

debugRetailers();
