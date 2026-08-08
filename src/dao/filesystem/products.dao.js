const mongoose = require('mongoose');
const { readCollection, writeCollection } = require('./fsUtils');

const FILE_NAME = 'products.json';

class ProductsDAOFileSystem {
  async paginate(filter, options) {
    const all = await readCollection(FILE_NAME);

    let filtered = all;
    if (filter.category) {
      filtered = filtered.filter((p) => p.category === filter.category);
    }
    if (typeof filter.status === 'boolean') {
      filtered = filtered.filter((p) => p.status === filter.status);
    }

    if (options.sort && options.sort.price) {
      const direction = options.sort.price === 1 ? 1 : -1;
      filtered = [...filtered].sort((a, b) => (a.price - b.price) * direction);
    }

    const limit = options.limit || 10;
    const page = options.page || 1;
    const totalDocs = filtered.length;
    const totalPages = Math.max(Math.ceil(totalDocs / limit), 1);
    const start = (page - 1) * limit;
    const docs = filtered.slice(start, start + limit);

    return {
      docs,
      totalDocs,
      limit,
      page,
      totalPages,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: page < totalPages ? page + 1 : null
    };
  }

  async getById(id) {
    const all = await readCollection(FILE_NAME);
    return all.find((p) => p._id === id) || null;
  }

  async create(data) {
    const all = await readCollection(FILE_NAME);
    if (all.some((p) => p.code === data.code)) {
      const error = new Error('duplicate code');
      error.code = 11000;
      throw error;
    }
    const newProduct = {
      _id: new mongoose.Types.ObjectId().toString(),
      status: true,
      thumbnails: [],
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    all.push(newProduct);
    await writeCollection(FILE_NAME, all);
    return newProduct;
  }

  async update(id, data) {
    const all = await readCollection(FILE_NAME);
    const index = all.findIndex((p) => p._id === id);
    if (index === -1) return null;

    if (data.code && all.some((p) => p.code === data.code && p._id !== id)) {
      const error = new Error('duplicate code');
      error.code = 11000;
      throw error;
    }

    const { _id, ...safeData } = data;
    all[index] = { ...all[index], ...safeData, updatedAt: new Date().toISOString() };
    await writeCollection(FILE_NAME, all);
    return all[index];
  }

  async delete(id) {
    const all = await readCollection(FILE_NAME);
    const index = all.findIndex((p) => p._id === id);
    if (index === -1) return null;

    const [deleted] = all.splice(index, 1);
    await writeCollection(FILE_NAME, all);
    return deleted;
  }
}

module.exports = new ProductsDAOFileSystem();
