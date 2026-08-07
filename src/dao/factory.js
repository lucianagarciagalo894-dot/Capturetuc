const config = require('../config/env');

const persistence = config.persistence === 'filesystem' ? 'filesystem' : 'mongo';

const ProductsDAO =
  persistence === 'filesystem'
    ? require('./filesystem/products.dao')
    : require('./mongo/products.dao');

const CartsDAO =
  persistence === 'filesystem'
    ? require('./filesystem/carts.dao')
    : require('./mongo/carts.dao');

console.log(`[DAO] Persistencia activa: ${persistence}`);

module.exports = { ProductsDAO, CartsDAO, persistence };
