const { CartsDAO, ProductsDAO } = require('../dao/factory');
const ApiError = require('../utils/ApiError');

function validateQuantity(quantity) {
  if (typeof quantity !== 'number' || Number.isNaN(quantity) || quantity <= 0) {
    throw new ApiError(400, 'La cantidad debe ser un número positivo');
  }
}

function validateExtraPages(extraPages) {
  if (typeof extraPages !== 'number' || Number.isNaN(extraPages) || extraPages < 0) {
    throw new ApiError(400, 'La cantidad de hojas extra debe ser un número mayor o igual a 0');
  }
}

class CartsService {
  async createCart() {
    return CartsDAO.create();
  }

  async getCart(cartId, { populate = false } = {}) {
    const cart = await CartsDAO.getById(cartId, { populate });
    if (!cart) {
      throw new ApiError(404, `No se encontró el carrito con id ${cartId}`);
    }
    return cart;
  }

  async addProduct(cartId, productId, quantity = 1, extraPages = 0) {
    validateQuantity(quantity);
    validateExtraPages(extraPages);

    await this.getCart(cartId);
    const product = await ProductsDAO.getById(productId);
    if (!product) {
      throw new ApiError(404, `No se encontró el álbum con id ${productId}`);
    }
    if (product.stock < quantity) {
      throw new ApiError(400, `Stock insuficiente para "${product.title}" (disponible: ${product.stock})`);
    }
    if (extraPages > 0 && !(product.features.extraPageCost > 0)) {
      throw new ApiError(400, `"${product.title}" no ofrece la opción de agregar hojas extra`);
    }

    return CartsDAO.addProduct(cartId, productId, quantity, extraPages);
  }

  async removeProduct(cartId, productId) {
    const cart = await this.getCart(cartId);
    const exists = cart.products.some(
      (item) => (item.product._id || item.product).toString() === productId
    );
    if (!exists) {
      throw new ApiError(404, `El producto ${productId} no está en el carrito`);
    }

    return CartsDAO.removeProduct(cartId, productId);
  }

  async updateProductQuantity(cartId, productId, quantity) {
    validateQuantity(quantity);

    const cart = await this.getCart(cartId);
    const exists = cart.products.some(
      (item) => (item.product._id || item.product).toString() === productId
    );
    if (!exists) {
      throw new ApiError(404, `El producto ${productId} no está en el carrito`);
    }

    const product = await ProductsDAO.getById(productId);
    if (product.stock < quantity) {
      throw new ApiError(400, `Stock insuficiente para "${product.title}" (disponible: ${product.stock})`);
    }

    return CartsDAO.updateProductQuantity(cartId, productId, quantity);
  }

  async replaceProducts(cartId, products) {
    if (!Array.isArray(products)) {
      throw new ApiError(400, 'El body debe contener un arreglo "products"');
    }

    await this.getCart(cartId);

    for (const item of products) {
      if (!item.product || !item.quantity) {
        throw new ApiError(400, 'Cada producto debe tener "product" y "quantity"');
      }
      validateQuantity(item.quantity);
      if (item.extraPages !== undefined) validateExtraPages(item.extraPages);

      const product = await ProductsDAO.getById(item.product);
      if (!product) {
        throw new ApiError(404, `No se encontró el álbum con id ${item.product}`);
      }
      if (product.stock < item.quantity) {
        throw new ApiError(400, `Stock insuficiente para "${product.title}"`);
      }
    }

    return CartsDAO.replaceProducts(cartId, products);
  }

  async clearCart(cartId) {
    await this.getCart(cartId);
    return CartsDAO.clear(cartId);
  }
}

module.exports = new CartsService();
