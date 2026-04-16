const { sql } = require('../config/db');

// Get All Staff List (Filtered by status/date if provided)
exports.getStaffList = async (req, res) => {
    const { status, startDate, endDate } = req.query;
    try {
        const request = new sql.Request();
        let query = `
            SELECT U.UserId, U.FullName, U.Email, U.Phone, U.AadharNumber, U.PANNumber, U.Status, U.CreatedAt, U.ApprovedBy
            FROM [onboarding].Users U
            WHERE 1=1
        `;

        if (status && status !== 'All') {
            request.input('status', sql.VarChar, status);
            query += " AND Status = @status";
        }

        if (startDate && startDate !== 'undefined' && startDate !== 'null' && startDate !== '') {
            request.input('startDate', sql.Date, startDate);
            query += " AND CAST(CreatedAt AS DATE) >= @startDate";
        }

        if (endDate && endDate !== 'undefined' && endDate !== 'null' && endDate !== '') {
            request.input('endDate', sql.Date, endDate);
            query += " AND CAST(CreatedAt AS DATE) <= @endDate";
        }

        query += " ORDER BY CreatedAt DESC";

        const result = await request.query(query);

        // Diagnostic logging
        console.log(`[API] Fetching Staff List. Filters: { Status: ${status || 'All'}, Start: ${startDate || 'N/A'}, End: ${endDate || 'N/A'} }. Result Count: ${result.recordset.length}`);

        if (result.recordset.length === 0) {
            const checkTotal = await new sql.Request().query("SELECT COUNT(*) as count FROM [onboarding].Users");
            console.log(`[DIAGNOSTIC] Query returned 0, but Total users in DB: ${checkTotal.recordset[0].count}`);
        }

        res.json({
            success: true,
            users: result.recordset
        });
    } catch (err) {
        console.error('Error fetching staff list:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get Pending Staff List (Legacy support)
exports.getPendingUsers = async (req, res) => {
    try {
        const query = "SELECT UserId, FullName, Email, Phone, AadharNumber, PANNumber, CreatedAt FROM [onboarding].Users WHERE Status = 'Pending' ORDER BY CreatedAt DESC";
        const request = new sql.Request();
        const result = await request.query(query);
        res.json({ success: true, users: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get Staff Details
exports.getUserDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const request = new sql.Request();
        request.input('id', sql.VarChar, id);
        const result = await request.query('SELECT UserId, FullName, Email, Phone, AadharNumber, PANNumber, Status, CreatedAt, ProfilePhoto FROM [onboarding].Users WHERE UserId = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = result.recordset[0];

        // Convert ProfilePhoto to Base64 if it exists
        if (user.ProfilePhoto) {
            user.ProfilePhoto = user.ProfilePhoto.toString('base64');
        }

        res.json({
            success: true,
            user
        });
    } catch (err) {
        console.error('Error fetching user details:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Approve Staff
exports.approveUser = async (req, res) => {
    const { userId } = req.body;
    try {
        const request = new sql.Request();
        request.input('userId', sql.VarChar, userId);

        // 1. Generate Secure Random Password (8 chars)
        const generatePassword = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#';
            let pass = '';
            for (let i = 0; i < 8; i++) {
                pass += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return pass;
        };
        const rawPassword = generatePassword();

        // 2. Hash Password
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(rawPassword, salt);

        // 3. Update Status, PasswordHash, and Tracking Tags in DB
        request.input('passwordHash', sql.VarChar, passwordHash);
        await request.query(`
            UPDATE [onboarding].Users 
            SET Status = 'Approved', 
                PasswordHash = @passwordHash,
                ApprovedBy = 'Admin',
                Remark = NULL,
                UpdatedAt = GETDATE()
            WHERE UserId = @userId
        `);

        // 4. Send Welcome Email
        // First, fetch the user's email and name to ensure we have fresh data
        const userResult = await request.query("SELECT FullName, Email FROM [onboarding].Users WHERE UserId = @userId");
        if (userResult.recordset.length > 0) {
            const user = userResult.recordset[0];
            const emailService = require('../services/emailService');

            console.log(`[EMAIL-DEBUG] Starting email process for ${user.Email} (${user.FullName})`);
            
            try {
                const emailSent = await emailService.sendApprovalEmail(user.Email, user.FullName, rawPassword);

                if (emailSent) {
                    console.log(`[EMAIL-SUCCESS] Email sent successfully to ${user.Email}`);
                } else {
                    console.warn(`[EMAIL-FAILURE] emailService.sendApprovalEmail returned false for ${user.Email}`);
                }
            } catch (emailErr) {
                console.error(`[EMAIL-ERROR] Exception caught during email sending to ${user.Email}:`, emailErr.message);
            }
        } else {
            console.warn(`[EMAIL-WARNING] Could not find user details for email notification (UserId: ${userId})`);
        }

        // 5. Finalize outcome
        console.log("\n====================================================");
        console.log(`[APPROVAL SUCCESS] User ID: ${userId} Approved by Admin.`);
        console.log(`[TEMPORARY PASSWORD] ${rawPassword}`);
        console.log("====================================================\n");

        res.json({
            success: true,
            message: 'Staff Approved Successfully. Credentials sent via Email.',
            password: rawPassword // Returning for frontend display as fallback
        });
    } catch (err) {
        console.error('Error approving user:', err);
        res.status(500).json({ success: false, message: 'Server error during approval process' });
    }
};

// Reject Staff
exports.rejectUser = async (req, res) => {
    const { userId, reason } = req.body;
    try {
        const request = new sql.Request();
        request.input('userId', sql.VarChar, userId);
        request.input('reason', sql.NVarChar, reason || '');

        await request.query(`
            UPDATE [onboarding].Users 
            SET Status = 'Rejected', 
                Remark = @reason,
                ApprovedBy = NULL 
            WHERE UserId = @userId
        `);

        console.log("\n====================================================");
        console.log(`[REJECTION] User ID: ${userId} Rejected.`);
        console.log(`[REASON] ${reason || 'No reason provided'}`);
        console.log("====================================================\n");

        res.json({ success: true, message: 'Staff Rejected Successfully' });
    } catch (err) {
        console.error('Error rejecting user:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
