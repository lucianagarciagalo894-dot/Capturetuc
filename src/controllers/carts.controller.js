const cartsService = require('../services/carts.service');

async function createCart(req, res, next) {
  try {
    const cart = await cartsService.createCart();
    res.status(201).json({ status: 'success', payload: cart });
  } catch (error) {
    next(error);
  }
}

async function getCartById(req, res, next) {
  try {
    const cart = await cartsService.getCart(req.params.cid, { populate: true });
    res.json({ status: 'success', payload: cart });
  } catch (error) {
    next(error);
  }
}

async function addProduct(req, res, next) {
  try {
    const { quantity = 1, extraPages = 0 } = req.body;
    const cart = await cartsService.addProduct(
      req.params.cid,
      req.params.pid,
      Number(quantity),
      Number(extraPages)
    );
    res.json({ status: 'success', payload: cart });
  } catch (error) {
    next(error);
  }
}

async function removeProduct(req, res, next) {
  try {
    const cart = await cartsService.removeProduct(req.params.cid, req.params.pid);
    res.json({ status: 'success', payload: cart });
  } catch (error) {
    next(error);
  }
}

async function updateProductQuantity(req, res, next) {
  try {
    const { quantity } = req.body;
    const cart = await cartsService.updateProductQuantity(
      req.params.cid,
      req.params.pid,
      Number(quantity)
    );
    res.json({ status: 'success', payload: cart });
  } catch (error) {
    next(error);
  }
}

async function replaceProducts(req, res, next) {
  try {
    const cart = await cartsService.replaceProducts(req.params.cid, req.body.products);
    res.json({ status: 'success', payload: cart });
  } catch (error) {
    next(error);
  }
}

async function clearCart(req, res, next) {
  try {
    const cart = await cartsService.clearCart(req.params.cid);
    res.json({ status: 'success', payload: cart });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createCart,
  getCartById,
  addProduct,
  removeProduct,
  updateProductQuantity,
  replaceProducts,
  clearCart
};
