const mongoose = require('mongoose');

const cartProductSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    // Hojas adicionales a las que trae el álbum de base (ver features.extraPageCost).
    extraPages: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    products: { type: [cartProductSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
