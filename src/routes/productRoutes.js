const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts);
router.get('/image/:id', productController.getProductImage);
router.get('/:id', productController.getProductById);
router.put('/:id/status', productController.updateProductStatus);


module.exports = router;
