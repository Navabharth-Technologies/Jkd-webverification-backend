const nodemailer = require('nodemailer');

// Define SMTP transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Sends a welcome email to the approved staff member.
 * @param {string} toEmail - Recipient email.
 * @param {string} fullName - Recipient's full name.
 */
exports.sendApprovalEmail = async (toEmail, fullName, password) => {
    const mailOptions = {
        from: `"JKDmart Admin Team" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: 'Welcome to JKDmart! Your Profile is Approved ✅',
        html: `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #4CAF50;">Welcome to JKDmart!</h2>
                <p>Dear <strong>${fullName}</strong>,</p>
                <p>Your profile has been registered and <strong>Approved Successfully</strong>.</p>
                <p>You can now log in to the JKDmart Staff App using your registered email and the following credentials:</p>
                <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Email:</strong> ${toEmail}</p>
                    <p style="margin: 0;"><strong>Password:</strong> ${password}</p>
                </div>
                <p>Please login and change your password for security purposes.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 0.9em; color: #777;">Regards,<br /><strong>JKDmart Admin Team</strong></p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] Approval email sent to: ${toEmail}`);
        return true;
    } catch (error) {
        console.error(`[Email] Error sending approval email to ${toEmail}:`, error);
        return false;
    }
};
