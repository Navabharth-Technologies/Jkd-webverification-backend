const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const staffController = require('../controllers/staffController');

// All routes require authentication
router.get('/stats', dashboardController.getDashboardStats);
router.get('/details', dashboardController.getDashboardDetails);
router.get('/staff', staffController.getStaffList);
router.get('/export', dashboardController.exportDashboardPdf);

module.exports = router;
