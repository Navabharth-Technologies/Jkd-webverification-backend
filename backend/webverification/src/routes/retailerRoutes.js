const express = require('express');
const router = express.Router();
const retailerController = require('../controllers/retailerController');

router.get('/', retailerController.getAllRetailers);
router.get('/stats', retailerController.getRetailerStats);
router.get('/photos/:id', retailerController.getRetailerPhoto);
router.get('/documents/:id', retailerController.getRetailerDocument);
router.put('/:id/status', retailerController.updateStatus);
router.get('/:id', retailerController.getRetailerById);

module.exports = router;
