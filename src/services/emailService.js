const nodemailer = require('nodemailer');

// Define SMTP transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use 'gmail' service helper which handles host/port/secure defaults
    auth: {
        user: (process.env.SMTP_USER || 'support@jkdmart.com').replace(/^["']|["']$/g, '').trim(),
        pass: (process.env.SMTP_PASS || 'qgbsbitnyncxmqyy').replace(/^["']|["']$/g, '').trim(),
    }
});

/**
 * Sends a welcome email to the approved staff member.
 * @param {string} toEmail - Recipient email.
 * @param {string} fullName - Recipient's full name.
 * @param {string} password - Generated password.
 */
exports.sendApprovalEmail = async (toEmail, fullName, password) => {
    // Safe fallback for sender email
    const senderEmail = (process.env.SMTP_USER || 'support@jkdmart.com').replace(/^["']|["']$/g, '').trim();

    const mailOptions = {
        from: `"JKD Mart Admin" <${senderEmail}>`,
        to: toEmail,
        subject: 'Your JKD Mart Profile is Approved ✅',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1a1f37; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #A855F7 0%, #EC4899 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome to JKD Mart!</h1>
                </div>
                <div style="padding: 30px; background-color: #ffffff;">
                    <p style="font-size: 16px;">Dear <strong>${fullName}</strong>,</p>
                    <p style="font-size: 15px;">Congratulations! Your profile has been reviewed and <strong>Approved</strong> by our administration team.</p>
                    <p style="font-size: 15px;">You can now log in to the <strong>JKD Mart Staff App</strong> using the following credentials:</p>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px inset #e2e8f0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; width: 100px;"><strong>Email:</strong></td>
                                <td style="padding: 8px 0; color: #1a1f37;">${toEmail}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;"><strong>Password:</strong></td>
                                <td style="padding: 8px 0; color: #1a1f37;"><code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${password}</code></td>
                            </tr>
                        </table>
                    </div>
                    
                    <p style="font-size: 13px; color: #ef4444; font-weight: bold;">Important Security Note:</p>
                    <p style="font-size: 13px; color: #64748b;">For your security, please login and change your password immediately. Do not share these credentials with anyone.</p>
                    
                    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
                        <p style="font-size: 14px; color: #94a3b8; margin: 0;">Regards,</p>
                        <p style="font-size: 14px; color: #1a1f37; font-weight: bold; margin: 4px 0;">JKD Mart Admin Team</p>
                    </div>
                </div>
                <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
                    This is an automated message, please do not reply to this email.
                </div>
            </div>
        `,
    };

    try {
        console.log(`[Email Service] Attempting to send approval email to: ${toEmail}`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Service] Message sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[Email Service] Error sending to ${toEmail}:`, error);
        return false;
    }
};
