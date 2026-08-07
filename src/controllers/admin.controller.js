const productsService = require('../services/products.service');
const config = require('../config/env');

// El panel admin lista todos los álbumes sin paginar (limit alto) para poder
// gestionarlos de un vistazo; las operaciones de alta/baja/modificación se
// hacen por AJAX contra /api/products y llegan a este mismo controller/servicio.
async function renderAdminPanel(req, res, next) {
  try {
    const result = await productsService.getProducts({ limit: 100, page: 1 });
    res.render('admin', {
      title: 'Panel de desarrollador - CAPTURE TUC',
      products: result.payload,
      adminPath: config.adminPath
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { renderAdminPanel };
