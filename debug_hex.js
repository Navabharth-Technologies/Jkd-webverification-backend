const { sql, connectDB } = require('./src/config/db');

async function debugHex() {
    try {
        await connectDB();
        const request = new sql.Request();

        const result = await request.query(`
            SELECT TOP 1 AddressLine1, Town 
            FROM Retailers 
            WHERE AddressLine1 LIKE '%Kuvempu%'
        `);

        if (result.recordset.length > 0) {
            const row = result.recordset[0];
            console.log("Address:", row.AddressLine1);
            console.log("Town:", row.Town);
            console.log("Address Buffer:", Buffer.from(row.AddressLine1).toString('hex'));
        } else {
            console.log("No match found for %Kuvempu%");
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

debugHex();
