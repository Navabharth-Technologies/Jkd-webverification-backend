const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.get('/test-db', async (req, res) => {
    try {
        const { sql } = require('../config/db');
        const request = new sql.Request();
        const result = await request.query('SELECT 1 as Connected');
        res.json({ success: true, message: 'Database is reachable', data: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database test failed', error: err.message });
    }
});

module.exports = router;
