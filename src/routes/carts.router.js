const { Router } = require('express');
const cartsController = require('../controllers/carts.controller');
const { validateObjectId, validateQuantityBody } = require('../middlewares/validators');

const router = Router();

router.post('/', cartsController.createCart);
router.get('/:cid', validateObjectId('cid'), cartsController.getCartById);
router.post(
  '/:cid/products/:pid',
  validateObjectId('cid'),
  validateObjectId('pid'),
  cartsController.addProduct
);
router.delete(
  '/:cid/products/:pid',
  validateObjectId('cid'),
  validateObjectId('pid'),
  cartsController.removeProduct
);
router.put('/:cid', validateObjectId('cid'), cartsController.replaceProducts);
router.put(
  '/:cid/products/:pid',
  validateObjectId('cid'),
  validateObjectId('pid'),
  validateQuantityBody,
  cartsController.updateProductQuantity
);
router.delete('/:cid', validateObjectId('cid'), cartsController.clearCart);

module.exports = router;
