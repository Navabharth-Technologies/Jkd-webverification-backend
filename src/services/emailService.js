const nodemailer = require('nodemailer');

/**
 * Sends a welcome email to the approved staff member.
 * @param {string} toEmail - Recipient email.
 * @param {string} fullName - Recipient's full name.
 * @param {string} password - Generated password.
 */
exports.sendApprovalEmail = async (toEmail, fullName, password) => {
    // Initialize transporter inside the function to ensure process.env is ready
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: (process.env.SMTP_USER || 'support@jkdmart.com').replace(/^["']|["']$/g, '').trim(),
            pass: (process.env.SMTP_PASS || 'ogngcqvrkiviutse').replace(/^["']|["']$/g, '').trim(),
        }
    });

    const senderEmail = (process.env.SMTP_USER || 'support@jkdmart.com').replace(/^["']|["']$/g, '').trim();

    const mailOptions = {
        from: `"JKD Mart Admin" <${senderEmail}>`,
        to: toEmail,
        subject: `JKD Mart Profile Approved ✅ - Password Included`,
        text: `Welcome to JKD Mart, ${fullName}!\n\nYour profile has been approved. You can now login to the Staff App.\n\nCredentials:\nEmail: ${toEmail}\nPassword: ${password}\n\nPlease change your password after logging in for the first time.`,
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
                                <td style="padding: 8px 0; color: #1a1f37; font-weight: bold;">${toEmail}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;"><strong>Password:</strong></td>
                                <td style="padding: 8px 0; color: #1a1f37;"><code style="background: #e2e8f0; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 18px; color: #A855F7;">${password}</code></td>
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
        console.log(`[Email Service] Starting send for: ${toEmail}`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Service] Success! ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[Email Service] CRITICAL ERROR sending to ${toEmail}:`, error.message);
        return false;
    }
};

/**
 * Sends an approval email to the approved retailer.
 * @param {string} toEmail - Recipient email.
 * @param {string} retailerName - Recipient's business/retailer name.
 * @param {string} phoneNumber - Recipient's registered phone number.
 */
exports.sendRetailerApprovalEmail = async (toEmail, retailerName, phoneNumber) => {
    // Initialize transporter inside the function to ensure process.env is ready
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: (process.env.SMTP_USER || 'support@jkdmart.com').replace(/^["']|["']$/g, '').trim(),
            pass: (process.env.SMTP_PASS || 'ogngcqvrkiviutse').replace(/^["']|["']$/g, '').trim(),
        }
    });

    const senderEmail = (process.env.SMTP_USER || 'support@jkdmart.com').replace(/^["']|["']$/g, '').trim();

    const mailOptions = {
        from: `"JKD Mart Partner Support" <${senderEmail}>`,
        to: toEmail,
        subject: `Your JKD Mart Retailer Application is Approved! 🎉`,
        text: `Dear ${retailerName},\n\nCongratulations! Your registration with JKD Mart has been approved.\n\nYou can now log in to the Retailer App using your registered mobile number: ${phoneNumber}.\n\nThank you for partnering with us!\n\nRegards,\nJKD Mart Partner Relations Team`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1a1f37; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                <div style="background: linear-gradient(135deg, #A855F7 0%, #EC4899 100%); padding: 35px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Application Approved!</h1>
                    <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 15px;">Welcome to the JKD Mart Partner Network</p>
                </div>
                <div style="padding: 40px 30px; background-color: #ffffff;">
                    <p style="font-size: 16px; margin-top: 0;">Dear <strong>${retailerName}</strong>,</p>
                    <p style="font-size: 15px; color: #475569;">We are excited to inform you that your registration request to partner with <strong>JKD Mart</strong> has been reviewed and <strong>Approved</strong>!</p>
                    <p style="font-size: 15px; color: #475569;">You can now log in to the <strong>JKD Mart Retailer App</strong> and start exploring our platform using your registered mobile number:</p>
                    
                    <div style="background: #f8fafc; padding: 24px; border-radius: 10px; margin: 28px 0; border: 1px solid #e2e8f0; text-align: center;">
                        <span style="display: block; color: #64748b; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px;">Registered Mobile Number</span>
                        <strong style="color: #A855F7; font-size: 24px; letter-spacing: 1px; font-family: monospace;">${phoneNumber}</strong>
                    </div>
                    
                    <p style="font-size: 15px; color: #475569;">To access your account, open the retailer application, enter your mobile number, and log in.</p>
                    
                    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
                        <p style="font-size: 14px; color: #94a3b8; margin: 0;">Best Regards,</p>
                        <p style="font-size: 15px; color: #1a1f37; font-weight: bold; margin: 4px 0;">JKD Mart Partner Relations Team</p>
                    </div>
                </div>
                <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                    This is an automatically generated email. Please do not reply directly to this message.
                </div>
            </div>
        `,
    };

    try {
        console.log(`[Email Service] Starting retailer email send for: ${toEmail}`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Service] Retailer Success! ID: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error(`[Email Service] CRITICAL ERROR sending retailer email to ${toEmail}:`, error.message);
        return false;
    }
};

