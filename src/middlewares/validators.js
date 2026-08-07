const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const { persistence } = require('../dao/factory');

// En modo Mongo los IDs son ObjectId; en modo filesystem también generamos
// IDs con formato ObjectId (ver dao/filesystem), así que la validación es común.
function validateObjectId(paramName) {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (persistence === 'mongo' && !mongoose.Types.ObjectId.isValid(value)) {
      return next(new ApiError(400, `El parámetro "${paramName}" no es un id válido`));
    }
    next();
  };
}

function validateQuantityBody(req, res, next) {
  const { quantity } = req.body;
  if (quantity === undefined) {
    return next(new ApiError(400, 'El campo "quantity" es requerido'));
  }
  if (typeof quantity !== 'number' && Number.isNaN(Number(quantity))) {
    return next(new ApiError(400, 'El campo "quantity" debe ser numérico'));
  }
  next();
}

module.exports = { validateObjectId, validateQuantityBody };
