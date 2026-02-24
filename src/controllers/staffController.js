const { sql } = require('../config/db');

// Get list of all staff members (Users who have onboarded someone)
exports.getStaffList = async (req, res) => {
    try {
        const query = `
            SELECT UserId, FullName as Username
            FROM Users
            ORDER BY FullName ASC
        `;

        console.log('[API] Fetching Staff List for Dropdown...');

        const request = new sql.Request();
        const result = await request.query(query);

        console.log(`[API] Staff Found: ${result.recordset.length}`);
        if (result.recordset.length > 0) {
            console.log('[API] First Staff:', result.recordset[0]);
        }

        res.json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (err) {
        console.error('Error fetching staff list:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
