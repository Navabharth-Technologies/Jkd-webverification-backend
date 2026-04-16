const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sql, connectDB } = require('../config/db');

exports.login = async (req, res) => {
    try {
        const { userid, password } = req.body;

        console.log('--- LOGIN ATTEMPT (ADMIN ONLY) ---');
        console.log(`[AUTH] Checking Input UserID: "${userid || 'UNDEFINED'}"`);

        if (!userid || !password) {
            return res.status(400).json({
                success: false,
                message: 'UserID and Password are required'
            });
        }

        // Ensure connection is established before query
        const pool = await connectDB();
        const request = pool.request();

        request.input('userid', sql.VarChar, userid.trim());

        const query = 'SELECT * FROM [onboarding].[Admin] WHERE AdminName = @userid';
        console.log(`[AUTH] Executing Query: ${query} with UserID: ${userid}`);

        const result = await request.query(query);

        console.log(`[AUTH] Matches found in DB: ${result.recordset.length}`);

        if (result.recordset.length > 0) {
            const admin = result.recordset[0];
            const dbPassword = (admin.Password || admin.password || admin.PASSWORD || '').toString().trim();
            const inputPassword = password.toString().trim();

            console.log(`[AUTH] Matching Admin Found: ${admin.AdminName}`);

            let isMatch = false;
            if (dbPassword.startsWith('$2a$') || dbPassword.startsWith('$2b$')) {
                console.log('[AUTH] Bcrypt comparison...');
                isMatch = await bcrypt.compare(inputPassword, dbPassword);
            } else {
                console.log('[AUTH] Plain Text comparison...');
                isMatch = (inputPassword === dbPassword);
            }

            console.log(`[AUTH] Is Match: ${isMatch}`);

            if (isMatch) {
                const tokenResponse = jwt.sign(
                    { id: admin.A_id || admin.a_id || 1, name: admin.AdminName, role: 'admin' },
                    process.env.JWT_SECRET || 'supersecretkey',
                    { expiresIn: '1d' }
                );

                console.log(`[AUTH] Login SUCCESS for: ${admin.AdminName}`);
                return res.json({
                    success: true,
                    token: tokenResponse,
                    user: {
                        id: admin.A_id || admin.a_id || 1,
                        name: admin.AdminName
                    }
                });
            }
        }

        console.log(`[AUTH] Login FAILED (Invalid Credentials) for: "${userid}"`);
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials. User not found or password incorrect.'
        });
    } catch (err) {
        console.error('[AUTH] CRITICAL ERROR:', err);
        return res.status(500).json({
            success: false,
            message: `Server Error: ${err.message}`,
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};
