const { ProductsDAO } = require('../dao/factory');
const ApiError = require('../utils/ApiError');

const REQUIRED_FIELDS = ['title', 'description', 'price', 'stock', 'category'];
const REQUIRED_FEATURES = ['size', 'cover', 'pages'];

// Acepta "category:premium" o "status:true" (también "availability" como alias de status).
function parseQuery(query) {
  const filter = {};
  if (!query) return filter;

  if (query.includes(':')) {
    const [key, value] = query.split(':');
    if (key === 'category') filter.category = value;
    if (key === 'status' || key === 'availability') {
      filter.status = value === 'true' || value === 'available';
    }
  } else {
    filter.category = query;
  }

  return filter;
}

function buildSort(sort) {
  if (sort === 'asc') return { price: 1 };
  if (sort === 'desc') return { price: -1 };
  return {};
}

function buildLink(baseUrl, params, page) {
  if (!page) return null;
  const search = new URLSearchParams({ ...params, page });
  return `${baseUrl}?${search.toString()}`;
}

function validateProductPayload(data, { partial = false } = {}) {
  if (!partial) {
    for (const field of REQUIRED_FIELDS) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        throw new ApiError(400, `El campo "${field}" es requerido`);
      }
    }
    if (!data.features) {
      throw new ApiError(400, 'El campo "features" es requerido');
    }
    for (const field of REQUIRED_FEATURES) {
      if (
        data.features[field] === undefined ||
        data.features[field] === null ||
        data.features[field] === ''
      ) {
        throw new ApiError(400, `El campo "features.${field}" es requerido`);
      }
    }
  }

  if (data.price !== undefined && Number(data.price) < 0) {
    throw new ApiError(400, 'El precio debe ser un número válido mayor o igual a 0');
  }
  if (data.stock !== undefined && Number(data.stock) < 0) {
    throw new ApiError(400, 'El stock debe ser un número válido mayor o igual a 0');
  }
  if (data.thumbnails !== undefined && !Array.isArray(data.thumbnails)) {
    throw new ApiError(400, 'El campo "thumbnails" debe ser un arreglo');
  }
  if (data.status !== undefined && typeof data.status !== 'boolean') {
    throw new ApiError(400, 'El campo "status" debe ser boolean');
  }
  if (
    data.features &&
    data.features.extraPageCost !== undefined &&
    Number(data.features.extraPageCost) < 0
  ) {
    throw new ApiError(400, 'El campo "features.extraPageCost" debe ser mayor o igual a 0');
  }
}

class ProductsService {
  async getProducts({ limit = 10, page = 1, query, sort, baseUrl = '/api/products' }) {
    const filter = parseQuery(query);
    const options = {
      limit: Number(limit) || 10,
      page: Number(page) || 1,
      sort: buildSort(sort)
    };

    const result = await ProductsDAO.paginate(filter, options);

    const linkParams = {};
    if (limit) linkParams.limit = limit;
    if (query) linkParams.query = query;
    if (sort) linkParams.sort = sort;

    return {
      status: 'success',
      payload: result.docs,
      totalPages: result.totalPages,
      prevPage: result.hasPrevPage ? result.prevPage : null,
      nextPage: result.hasNextPage ? result.nextPage : null,
      page: result.page,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevLink: result.hasPrevPage ? buildLink(baseUrl, linkParams, result.prevPage) : null,
      nextLink: result.hasNextPage ? buildLink(baseUrl, linkParams, result.nextPage) : null
    };
  }

  async getProductById(id) {
    const product = await ProductsDAO.getById(id);
    if (!product) {
      throw new ApiError(404, `No se encontró el álbum con id ${id}`);
    }
    return product;
  }

  async createProduct(data) {
    validateProductPayload(data);
    return ProductsDAO.create(data);
  }

  async updateProduct(id, data) {
    validateProductPayload(data, { partial: true });
    const updated = await ProductsDAO.update(id, data);
    if (!updated) {
      throw new ApiError(404, `No se encontró el álbum con id ${id}`);
    }
    return updated;
  }

  async deleteProduct(id) {
    const deleted = await ProductsDAO.delete(id);
    if (!deleted) {
      throw new ApiError(404, `No se encontró el álbum con id ${id}`);
    }
    return deleted;
  }
}

module.exports = new ProductsService();
