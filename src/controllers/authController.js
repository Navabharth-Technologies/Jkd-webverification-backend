const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sql } = require('../config/db');

exports.login = async (req, res) => {
    try {
        const { userid, password } = req.body;

        console.log('--- LOGIN ATTEMPT ---');
        console.log(`Input UserID: "${userid}"`);
        console.log(`Input Password: "${password}"`);

        // Emergency Test Account
        if (userid === 'testadmin' && password === 'test123') {
            const token = jwt.sign(
                { id: 999, name: 'TestAdmin', role: 'admin' },
                process.env.JWT_SECRET || 'supersecretkey',
                { expiresIn: '1d' }
            );
            return res.json({ success: true, token, user: { id: 999, name: 'TestAdmin' } });
        }

        const request = new sql.Request();
        request.input('userid', sql.VarChar, userid);
        
        // Fetch user from onboarding.Admin table
        const query = 'SELECT AdminName, A_id, [Password] FROM onboarding.Admin WHERE AdminName = @userid';
        console.log(`Executing Query: ${query} with UserID: ${userid}`);
        
        const result = await request.query(query);

        console.log(`Matches found in onboarding.Admin: ${result.recordset.length}`);

        if (result.recordset.length > 0) {
            const admin = result.recordset[0];
            const dbPassword = admin.Password ? admin.Password.toString().trim() : '';
            const inputPassword = password ? password.toString().trim() : '';

            console.log(`DB Admin Results -> Name: ${admin.AdminName}, ID: ${admin.A_id}, PwdInDB: ${dbPassword}`);
            
            let isMatch = false;
            if (dbPassword.startsWith('$2a$') || dbPassword.startsWith('$2b$')) {
                console.log('Using Bcrypt comparison...');
                isMatch = await bcrypt.compare(inputPassword, dbPassword);
            } else {
                console.log('Using Plain Text comparison...');
                isMatch = (inputPassword === dbPassword);
            }

            console.log(`Is Match Result: ${isMatch}`);

            if (isMatch) {
                const token = jwt.sign(
                    { id: admin.A_id, name: admin.AdminName, role: 'admin' },
                    process.env.JWT_SECRET || 'supersecretkey',
                    { expiresIn: '1d' }
                );

                return res.json({
                    success: true,
                    token,
                    user: {
                        id: admin.A_id,
                        name: admin.AdminName
                    }
                });
            }
        }

        // Fallback to Staff
        console.log('Trying Staff Fallback...');
        const userRequest = new sql.Request();
        userRequest.input('userid', sql.VarChar, userid);
        const userResult = await userRequest.query("SELECT UserId, FullName, PasswordHash FROM [onboarding].Users WHERE Email = @userid OR UserId = @userid");

        if (userResult.recordset.length > 0) {
            const user = userResult.recordset[0];
            const dbHash = user.PasswordHash ? user.PasswordHash.toString().trim() : '';
            const inputPass = password ? password.toString().trim() : '';
            
            const isMatch = await bcrypt.compare(inputPass, dbHash);
            console.log(`Staff Bcrypt Match: ${isMatch}`);

            if (isMatch) {
                const token = jwt.sign(
                    { id: user.UserId, name: user.FullName, role: 'admin' },
                    process.env.JWT_SECRET || 'supersecretkey',
                    { expiresIn: '1d' }
                );

                return res.json({
                    success: true,
                    token,
                    user: {
                        id: user.UserId,
                        name: user.FullName
                    }
                });
            }
        }

        console.log('Login FAILED');
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    } catch (err) {
        console.error('CRITICAL SERVER ERROR during login:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
