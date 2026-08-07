const { Router } = require('express');
const productsController = require('../controllers/products.controller');
const { validateObjectId } = require('../middlewares/validators');

const router = Router();

router.get('/', productsController.getProducts);
router.get('/:pid', validateObjectId('pid'), productsController.getProductById);
router.post('/', productsController.createProduct);
router.put('/:pid', validateObjectId('pid'), productsController.updateProduct);
router.delete('/:pid', validateObjectId('pid'), productsController.deleteProduct);

module.exports = router;
