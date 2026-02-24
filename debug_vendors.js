const { sql, connectDB } = require('./src/config/db');
const fs = require('fs');

async function debugVendors() {
    try {
        await connectDB();

        let output = {};

        // 1. Check vendors in Karnataka
        const karnatakaVendors = await sql.query(`
            SELECT TOP 20 VendorId, BusinessName, State, District, Town, CreatedAt
            FROM Vendors
            WHERE State = 'Karnataka'
        `);
        output.KarnatakaVendors = karnatakaVendors.recordset;

        // 2. Check vendors in Mysuru (exact match)
        const mysuruVendors = await sql.query(`
            SELECT TOP 20 VendorId, BusinessName, State, District, Town, CreatedAt
            FROM Vendors
            WHERE District = 'Mysuru'
        `);
        output.MysuruVendors = mysuruVendors.recordset;

        // 3. Check vendors in Mysore (common misspelling/alternative)
        const mysoreVendors = await sql.query(`
            SELECT TOP 20 VendorId, BusinessName, State, District, Town, CreatedAt
            FROM Vendors
            WHERE District = 'Mysore'
        `);
        output.MysoreVendors = mysoreVendors.recordset;

        // 4. Check unique states and districts to see what's actually there
        const uniqueStates = await sql.query("SELECT DISTINCT State FROM Vendors");
        output.UniqueStates = uniqueStates.recordset;

        const uniqueDistrictsInKarnataka = await sql.query("SELECT DISTINCT District FROM Vendors WHERE State = 'Karnataka'");
        output.UniqueDistrictsInKarnataka = uniqueDistrictsInKarnataka.recordset;

        fs.writeFileSync('debug_vendors_region.json', JSON.stringify(output, null, 2));
        console.log("Debug results written to debug_vendors_region.json");

    } catch (err) {
        console.error("Debug Error:", err);
        fs.writeFileSync('debug_error_vendors.txt', err.toString());
    } finally {
        process.exit();
    }
}

debugVendors();
