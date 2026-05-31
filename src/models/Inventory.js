const mongoose = require('mongoose');

// Inventory is a SEPARATE COLLECTION rather than a field embedded in Product
// for two reasons:
// 1. Write isolation — stock levels are updated on every sale, restock, and
//    reservation. If embedded in Product, every stock update would lock and
//    rewrite the entire product document (including description, images, etc.),
//    increasing write contention under high traffic.
// 2. Separation of concerns — inventory management (warehouse ops, low-stock
//    alerts, restock workflows) is a distinct bounded context from the product
//    catalogue. A separate collection lets each domain evolve independently and
//    supports role-based access (warehouse staff vs. catalogue editors).
//
// productId is a REFERENCE (not embedded) because Product is the source of truth
// for product identity; duplicating product fields here would create drift.
const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true,
    },

    stock:             { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    lastUpdated:       { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Quickly find all products below their low-stock threshold for alerts
inventorySchema.index({ stock: 1 });

inventorySchema.methods.isLowStock = function () {
  return this.stock <= this.lowStockThreshold;
};

module.exports = mongoose.model('Inventory', inventorySchema);
