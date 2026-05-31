const mongoose = require('mongoose');

// Variants (size/color/stock combinations) are EMBEDDED because they are
// inseparable from the product — you never query a variant without its parent.
// Embedding keeps the product document self-contained and makes listing pages
// fast with a single read. The trade-off is larger documents, acceptable here
// since a product rarely has more than ~20 variants.
const variantSchema = new mongoose.Schema({
  size:  { type: String },
  color: { type: String },
  stock: { type: Number, required: true, min: 0, default: 0 },
  sku:   { type: String },
});

const productSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price:       { type: Number, required: true, min: 0 },

    // Category uses a REFERENCE because categories exist independently, are
    // shared across thousands of products, and need their own CRUD lifecycle.
    // Embedding would duplicate category data in every product document.
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },

    subcategory: { type: String, trim: true },
    variants:    [variantSchema],

    // Attributes use Schema.Types.Mixed to support heterogeneous product types:
    // a laptop may have { ram: '16GB', storage: '512GB' } while a t-shirt has
    // { fabric: 'cotton', fit: 'slim' }. A rigid schema would require a separate
    // model per category or many sparse nullable fields, both worse options.
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} },

    tags: [{ type: String, trim: true }],

    // Ratings are EMBEDDED as a summary subdocument. Storing the running average
    // and count here avoids an aggregation query every time a product card renders.
    // Individual reviews live in the Review collection for full detail.
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count:   { type: Number, default: 0 },
    },

    // sellerId REFERENCES User. Sellers are independent entities with their own
    // profiles; referencing avoids duplicating seller data and keeps it consistent
    // if a seller updates their name or contact info.
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1 });

module.exports = mongoose.model('Product', productSchema);
