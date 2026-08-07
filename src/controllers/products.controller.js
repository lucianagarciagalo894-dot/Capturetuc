const productsService = require('../services/products.service');

function emitProductsUpdated(req) {
  const io = req.app.get('io');
  if (io) io.emit('products:updated');
}

async function getProducts(req, res, next) {
  try {
    const { limit, page, query, sort } = req.query;
    const result = await productsService.getProducts({
      limit,
      page,
      query,
      sort,
      baseUrl: '/api/products'
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await productsService.getProductById(req.params.pid);
    res.json({ status: 'success', payload: product });
  } catch (error) {
    next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const product = await productsService.createProduct(req.body);
    emitProductsUpdated(req);
    res.status(201).json({ status: 'success', payload: product });
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const product = await productsService.updateProduct(req.params.pid, req.body);
    emitProductsUpdated(req);
    res.json({ status: 'success', payload: product });
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    await productsService.deleteProduct(req.params.pid);
    emitProductsUpdated(req);
    res.json({ status: 'success', message: 'Álbum eliminado correctamente' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
