const { sql, connectDB } = require('./src/config/db');
const fs = require('fs');

async function debugUsers() {
    try {
        await connectDB();

        let output = "";

        output += "--- ALL USERS ---\n";
        const users = await sql.query("SELECT UserId, FullName, Email FROM Users");
        output += JSON.stringify(users.recordset, null, 2) + "\n\n";

        output += "--- REGISTRATION TYPE TABLE ---\n";
        const regTypes = await sql.query("SELECT * FROM RegistrationType");
        output += JSON.stringify(regTypes.recordset, null, 2) + "\n\n";

        output += "--- JOIN RESULT (Current Staff Query) ---\n";
        const staff = await sql.query(`
            SELECT U.UserId, U.FullName as Username
            FROM Users U
            LEFT JOIN RegistrationType RT ON U.UserId = RT.UserId
            WHERE RT.UserId IS NULL
        `);
        output += JSON.stringify(staff.recordset, null, 2) + "\n\n";

        fs.writeFileSync('debug_results.json', output);
        console.log("Debug results written to debug_results.json");

    } catch (err) {
        console.error("Debug Error:", err);
        fs.writeFileSync('debug_error.txt', err.toString());
    } finally {
        process.exit();
    }
}

debugUsers();
