const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');

router.get('/', vendorController.getAllVendors);
router.get('/stats', vendorController.getVendorStats);
router.get('/photos/:id', vendorController.getVendorPhoto);
router.get('/documents/:id', vendorController.getVendorDocument);
router.put('/:id/status', vendorController.updateStatus);
router.get('/:id', vendorController.getVendorById);

module.exports = router;
