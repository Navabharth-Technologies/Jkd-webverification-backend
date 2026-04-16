const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');

// Admin User Management Routes
router.get('/pending', adminUserController.getPendingUsers);
router.get('/all-staff', adminUserController.getStaffList);
router.get('/:id', adminUserController.getUserDetails);
router.post('/approve', adminUserController.approveUser);
router.post('/reject', adminUserController.rejectUser);

module.exports = router;
