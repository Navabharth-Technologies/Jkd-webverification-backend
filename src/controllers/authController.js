const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sql } = require('../config/db');

exports.login = async (req, res) => {
    try {
        const { userid, password } = req.body;

        console.log('--- LOGIN ATTEMPT (ADMIN ONLY) ---');
        console.log(`Input UserID: "${userid}"`);
        
        // Emergency Test Account
        if (userid === 'testadmin' && password === 'test123') {
            console.log('[AUTH] Emergency test account matched');
            const token = jwt.sign(
                { id: 999, name: 'TestAdmin', role: 'admin' },
                process.env.JWT_SECRET || 'supersecretkey',
                { expiresIn: '1d' }
            );
            return res.json({ success: true, token, user: { id: 999, name: 'TestAdmin' } });
        }

        const request = new sql.Request();
        request.input('userid', sql.VarChar, userid);
        
        // Fetch user from onboarding.Admin table - use * to avoid naming issues
        const query = 'SELECT * FROM onboarding.Admin WHERE AdminName = @userid';
        console.log(`Executing Query: ${query} with UserID: ${userid}`);
        
        const result = await request.query(query);

        console.log(`Matches found in onboarding.Admin: ${result.recordset.length}`);

        if (result.recordset.length > 0) {
            const admin = result.recordset[0];
            // Try different case variations for password column just in case
            const dbPassword = (admin.Password || admin.password || admin.PASSWORD || '').toString().trim();
            const inputPassword = (password || '').toString().trim();

            console.log(`[AUTH] Checking match for Admin: ${admin.AdminName}`);
            
            let isMatch = false;
            // Check if Password in DB is a bcrypt hash or plain text
            if (dbPassword.startsWith('$2a$') || dbPassword.startsWith('$2b$')) {
                console.log('[AUTH] Using Bcrypt comparison...');
                isMatch = await bcrypt.compare(inputPassword, dbPassword);
            } else {
                console.log('[AUTH] Using Plain Text comparison...');
                isMatch = (inputPassword === dbPassword);
            }

            console.log(`[AUTH] Is Match Result: ${isMatch}`);

            if (isMatch) {
                const token = jwt.sign(
                    { id: admin.A_id || admin.a_id || 1, name: admin.AdminName, role: 'admin' },
                    process.env.JWT_SECRET || 'supersecretkey',
                    { expiresIn: '1d' }
                );

                console.log(`[AUTH] Login SUCCESS for: ${admin.AdminName}`);
                return res.json({
                    success: true,
                    token,
                    user: {
                        id: admin.A_id || admin.a_id || 1,
                        name: admin.AdminName
                    }
                });
            }
        }

        console.log(`[AUTH] Login FAILED for: "${userid}"`);
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    } catch (err) {
        console.error('CRITICAL SERVER ERROR during login:', err);
        // Temporarily return the error message to debug the 500 error
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};
