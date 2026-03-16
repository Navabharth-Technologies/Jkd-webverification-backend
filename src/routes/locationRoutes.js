const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/unique', locationController.getUniqueLocations);

module.exports = router;
