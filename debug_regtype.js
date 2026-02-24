const { sql, connectDB } = require('./src/config/db');

async function run() {
    try {
        await connectDB();

        console.log("Querying RegistrationType for JKDOB01...");

        const result = await sql.query(`
            SELECT *
            FROM RegistrationType
            WHERE UserId = 'JKDOB01'
        `);

        console.log("Types:", JSON.stringify(result.recordset, null, 2));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}

run();
