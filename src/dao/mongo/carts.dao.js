const Cart = require('../../models/Cart');

// select limita el populate a los campos que la vista/API realmente necesita,
// evitando arrastrar campos internos como timestamps del producto.
const PRODUCT_POPULATE_FIELDS = 'title description code price stock category thumbnails features status';

class CartsDAOMongo {
  async create() {
    const cart = await Cart.create({ products: [] });
    return cart.toObject();
  }

  async getById(id, { populate = false } = {}) {
    const query = Cart.findById(id);
    if (populate) {
      query.populate({ path: 'products.product', select: PRODUCT_POPULATE_FIELDS });
    }
    return query.lean();
  }

  async addProduct(cartId, productId, quantity = 1, extraPages = 0) {
    const cart = await Cart.findById(cartId);
    if (!cart) return null;

    const item = cart.products.find((p) => p.product.toString() === productId);
    if (item) {
      item.quantity += quantity;
      item.extraPages = extraPages;
    } else {
      cart.products.push({ product: productId, quantity, extraPages });
    }
    await cart.save();
    return cart.toObject();
  }

  async removeProduct(cartId, productId) {
    const cart = await Cart.findById(cartId);
    if (!cart) return null;

    cart.products = cart.products.filter((p) => p.product.toString() !== productId);
    await cart.save();
    return cart.toObject();
  }

  async updateProductQuantity(cartId, productId, quantity) {
    const cart = await Cart.findById(cartId);
    if (!cart) return null;

    const item = cart.products.find((p) => p.product.toString() === productId);
    if (!item) return null;

    item.quantity = quantity;
    await cart.save();
    return cart.toObject();
  }

  async replaceProducts(cartId, products) {
    const cart = await Cart.findById(cartId);
    if (!cart) return null;

    cart.products = products.map((p) => ({
      product: p.product,
      quantity: p.quantity,
      extraPages: p.extraPages || 0
    }));
    await cart.save();
    return cart.toObject();
  }

  async clear(cartId) {
    const cart = await Cart.findByIdAndUpdate(cartId, { products: [] }, { new: true });
    return cart ? cart.toObject() : null;
  }
}

module.exports = new CartsDAOMongo();
