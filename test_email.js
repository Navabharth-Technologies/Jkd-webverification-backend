require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: (process.env.SMTP_USER || 'support@jkdmart.com').replace(/^["']|["']$/g, '').trim(),
        pass: (process.env.SMTP_PASS || 'qgbsbitnyncxmqyy').replace(/^["']|["']$/g, '').trim(),
    },
});

console.log('Transporter Config:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
});

const mailOptions = {
    from: `"Test" <${process.env.SMTP_USER}>`,
    to: 'varunjd02@gmail.com', // A test email from the user's screenshot
    subject: 'SMTP Test',
    text: 'If you see this, SMTP is working.',
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('Error occurred:', error.message);
        return;
    }
    console.log('Message sent: %s', info.messageId);
});
