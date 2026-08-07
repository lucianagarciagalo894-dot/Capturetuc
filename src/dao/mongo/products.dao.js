const Product = require('../../models/Product');

class ProductsDAOMongo {
  async paginate(filter, options) {
    const result = await Product.paginate(filter, { ...options, lean: true });
    return {
      docs: result.docs,
      totalDocs: result.totalDocs,
      limit: result.limit,
      page: result.page,
      totalPages: result.totalPages,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevPage: result.prevPage,
      nextPage: result.nextPage
    };
  }

  async getById(id) {
    return Product.findById(id).lean();
  }

  async create(data) {
    const product = await Product.create(data);
    return product.toObject();
  }

  async update(id, data) {
    const { _id, ...safeData } = data;
    return Product.findByIdAndUpdate(id, safeData, {
      new: true,
      runValidators: true
    }).lean();
  }

  async delete(id) {
    return Product.findByIdAndDelete(id).lean();
  }
}

module.exports = new ProductsDAOMongo();
