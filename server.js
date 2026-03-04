const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { connectDB } = require('./src/config/db');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const retailerRoutes = require('./src/routes/retailerRoutes');
const vendorRoutes = require('./src/routes/vendorRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const adminUserRoutes = require('./src/routes/adminUserRoutes');

const app = express();

const corsOptions = {
    origin: true, // Allow all origins (better than '*' for credentials)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
    credentials: true // allows cookies/sessions
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/retailers', retailerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin/users', adminUserRoutes);

const app = express();
const PORT = process.env.PORT;

const startServer = async () => {
    try {
        await connectDB();

        // Prevention for unexpected exits
        process.on('SIGINT', () => {
            console.log('[SERVER] SIGINT received. Shutting down...');
            server.close(() => process.exit(0));
        });

        process.on('SIGTERM', () => {
            console.log('[SERVER] SIGTERM received. Shutting down...');
            server.close(() => process.exit(0));
        });

        process.on('uncaughtException', (err) => {
            console.error('[SERVER] Uncaught Exception:', err);
        });

    } catch (err) {
        console.error('[SERVER] Failed to start:', err);
        process.exit(1);
    }
};

startServer();
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
