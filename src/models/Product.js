const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const featuresSchema = new mongoose.Schema(
  {
    size: { type: String, required: true, trim: true },
    cover: { type: String, required: true, trim: true },
    pages: { type: Number, required: true, min: 1 },
    // Costo de cada hoja adicional a las incluidas en "pages". 0 o ausente = no se ofrece la opción.
    extraPageCost: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    status: { type: Boolean, default: true },
    stock: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    thumbnails: { type: [String], default: [] },
    features: { type: featuresSchema, required: true }
  },
  { timestamps: true }
);

// code ya es único (unique: true genera su propio índice) — sirve para no permitir SKUs duplicados.
// category y status se consultan juntos en el filtro de catálogo (query=category:x / status:true).
productSchema.index({ category: 1, status: 1 });
// price se usa para el ordenamiento (sort=asc/desc) del catálogo.
productSchema.index({ price: 1 });

productSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Product', productSchema);
