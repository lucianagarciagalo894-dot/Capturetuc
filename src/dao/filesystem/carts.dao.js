const mongoose = require('mongoose');
const { readCollection, writeCollection } = require('./fsUtils');

const FILE_NAME = 'carts.json';
const PRODUCTS_FILE_NAME = 'products.json';

async function populateProducts(cart) {
  if (!cart) return null;
  const products = await readCollection(PRODUCTS_FILE_NAME);
  return {
    ...cart,
    products: cart.products.map((item) => ({
      product: products.find((p) => p._id === item.product) || null,
      quantity: item.quantity,
      extraPages: item.extraPages || 0
    }))
  };
}

class CartsDAOFileSystem {
  async create() {
    const all = await readCollection(FILE_NAME);
    const newCart = {
      _id: new mongoose.Types.ObjectId().toString(),
      products: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    all.push(newCart);
    await writeCollection(FILE_NAME, all);
    return newCart;
  }

  async getById(id, { populate = false } = {}) {
    const all = await readCollection(FILE_NAME);
    const cart = all.find((c) => c._id === id) || null;
    if (!cart) return null;
    return populate ? populateProducts(cart) : cart;
  }

  async addProduct(cartId, productId, quantity = 1, extraPages = 0) {
    const all = await readCollection(FILE_NAME);
    const cart = all.find((c) => c._id === cartId);
    if (!cart) return null;

    const item = cart.products.find((p) => p.product === productId);
    if (item) {
      item.quantity += quantity;
      item.extraPages = extraPages;
    } else {
      cart.products.push({ product: productId, quantity, extraPages });
    }
    cart.updatedAt = new Date().toISOString();
    await writeCollection(FILE_NAME, all);
    return cart;
  }

  async removeProduct(cartId, productId) {
    const all = await readCollection(FILE_NAME);
    const cart = all.find((c) => c._id === cartId);
    if (!cart) return null;

    cart.products = cart.products.filter((p) => p.product !== productId);
    cart.updatedAt = new Date().toISOString();
    await writeCollection(FILE_NAME, all);
    return cart;
  }

  async updateProductQuantity(cartId, productId, quantity) {
    const all = await readCollection(FILE_NAME);
    const cart = all.find((c) => c._id === cartId);
    if (!cart) return null;

    const item = cart.products.find((p) => p.product === productId);
    if (!item) return null;

    item.quantity = quantity;
    cart.updatedAt = new Date().toISOString();
    await writeCollection(FILE_NAME, all);
    return cart;
  }

  async replaceProducts(cartId, products) {
    const all = await readCollection(FILE_NAME);
    const cart = all.find((c) => c._id === cartId);
    if (!cart) return null;

    cart.products = products.map((p) => ({
      product: p.product,
      quantity: p.quantity,
      extraPages: p.extraPages || 0
    }));
    cart.updatedAt = new Date().toISOString();
    await writeCollection(FILE_NAME, all);
    return cart;
  }

  async clear(cartId) {
    const all = await readCollection(FILE_NAME);
    const cart = all.find((c) => c._id === cartId);
    if (!cart) return null;

    cart.products = [];
    cart.updatedAt = new Date().toISOString();
    await writeCollection(FILE_NAME, all);
    return cart;
  }
}

module.exports = new CartsDAOFileSystem();
