const { sql } = require('../config/db');

exports.getUniqueLocations = async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT State, District, Town
            FROM (
                SELECT State, District, Town FROM [onboarding].Retailers
                UNION
                SELECT State, District, Town FROM [onboarding].Vendors
            ) AS Locations
            WHERE State IS NOT NULL AND State <> ''
            ORDER BY State, District, Town
        `;

        const request = new sql.Request();
        const result = await request.query(query);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        console.error('Error fetching unique locations:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
