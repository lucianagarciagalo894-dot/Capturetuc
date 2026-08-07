const { Router } = require('express');
const productsService = require('../services/products.service');
const cartsService = require('../services/carts.service');
const adminController = require('../controllers/admin.controller');
const config = require('../config/env');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await productsService.getProducts({ limit: 3, page: 1 });
    res.render('home', {
      title: 'CAPTURE TUC - Álbumes de fotos personalizados',
      featuredProducts: result.payload
    });
  } catch (error) {
    next(error);
  }
});

router.get('/products', async (req, res, next) => {
  try {
    const { limit, page, query, sort } = req.query;
    const result = await productsService.getProducts({
      limit,
      page,
      query,
      sort,
      baseUrl: '/products'
    });

    res.render('products', {
      title: 'Catálogo - CAPTURE TUC',
      products: result.payload,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevLink: result.prevLink,
        nextLink: result.nextLink
      },
      filters: {
        query: query || '',
        sort: sort || '',
        limit: String(limit || 10)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/products/:pid', async (req, res, next) => {
  try {
    const product = await productsService.getProductById(req.params.pid);
    res.render('product-detail', {
      title: `${product.title} - CAPTURE TUC`,
      product
    });
  } catch (error) {
    next(error);
  }
});

router.get('/carts/:cid', async (req, res, next) => {
  try {
    const cart = await cartsService.getCart(req.params.cid, { populate: true });
    const items = cart.products.map((item) => {
      const extraPages = item.extraPages || 0;
      const extraPagesCost = item.product ? extraPages * (item.product.features.extraPageCost || 0) : 0;
      const unitPrice = item.product ? item.product.price + extraPagesCost : 0;
      return {
        product: item.product,
        quantity: item.quantity,
        extraPages,
        extraPagesCost,
        unitPrice,
        subtotal: unitPrice * item.quantity
      };
    });
    const total = items.reduce((acc, item) => acc + item.subtotal, 0);

    res.render('cart', {
      title: 'Mi carrito - CAPTURE TUC',
      cartId: cart._id,
      items,
      total
    });
  } catch (error) {
    next(error);
  }
});

router.get('/informacion', (req, res) => {
  res.render('information', { title: 'Información - CAPTURE TUC' });
});

router.get('/contacto', (req, res) => {
  res.render('contact', { title: 'Contacto - CAPTURE TUC' });
});

router.get(`/${config.adminPath}`, adminController.renderAdminPanel);

module.exports = router;
