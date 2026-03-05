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

app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/retailers', retailerRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin/users', adminUserRoutes);

app.get('/', (req, res) => res.send('Server running'));
app.get('/health', (req, res) => res.status(200).json({ status: "ok" }));

const PORT = process.env.PORT || 8080;

const startServer = async () => {
    try {
        await connectDB();
        console.log("Connected to SQL Server");
    } catch (err) {
        console.error("DB connection failed, starting anyway:", err.message);
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });

    process.on('SIGINT', () => server.close(() => process.exit(0)));
    process.on('SIGTERM', () => server.close(() => process.exit(0)));
};

process.on('uncaughtException', (err) => console.error('[SERVER] Uncaught Exception:', err));
process.on('unhandledRejection', (err) => console.error('[SERVER] Unhandled Rejection:', err));

startServer();
