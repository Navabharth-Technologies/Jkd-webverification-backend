require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./src/config/db');

const authRoutes = require('./src/routes/authRoutes');
const retailerRoutes = require('./src/routes/retailerRoutes');
const vendorRoutes = require('./src/routes/vendorRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const adminUserRoutes = require('./src/routes/adminUserRoutes');

const app = express();

/* -----------------------------
   CORS CONFIG
----------------------------- */

const corsOptions = {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'ngrok-skip-browser-warning'
    ],
    credentials: true
};

app.use(cors(corsOptions));


/* -----------------------------
   BODY PARSER (FOR LARGE FILES)
----------------------------- */

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


/* -----------------------------
   ROUTES
----------------------------- */

app.use('/api/auth', authRoutes);
app.use('/api/retailers', retailerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin/users', adminUserRoutes);


/* -----------------------------
   ROOT ROUTE
----------------------------- */

app.get('/', (req, res) => {
    res.send('Server running');
});


/* -----------------------------
   HEALTH CHECK (IMPORTANT FOR AWS)
----------------------------- */

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Server is healthy'
    });
});


/* -----------------------------
   SERVER PORT
----------------------------- */

const PORT = process.env.PORT || 8080;


/* -----------------------------
   START SERVER
----------------------------- */

const startServer = async () => {

    try {

        // Connect Database
        await connectDB();
        console.log("Connected to SQL Server");

        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });


        /* -----------------------------
           GRACEFUL SHUTDOWN
        ----------------------------- */

        process.on('SIGINT', () => {
            console.log('[SERVER] SIGINT received. Shutting down...');
            server.close(() => process.exit(0));
        });

        process.on('SIGTERM', () => {
            console.log('[SERVER] SIGTERM received. Shutting down...');
            server.close(() => process.exit(0));
        });


        /* -----------------------------
           GLOBAL ERROR HANDLER
        ----------------------------- */

        process.on('uncaughtException', (err) => {
            console.error('[SERVER] Uncaught Exception:', err);
        });

        process.on('unhandledRejection', (err) => {
            console.error('[SERVER] Unhandled Rejection:', err);
        });

    } catch (err) {

        console.error('[SERVER] Failed to start:', err);
        process.exit(1);

    }

};

startServer();
