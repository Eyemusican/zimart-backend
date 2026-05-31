const mongoose = require('mongoose');

// Reviews are stored in their OWN COLLECTION (referenced from Product) rather
// than embedded inside the product document for two reasons:
// 1. Volume — a popular product can accumulate thousands of reviews. MongoDB
//    documents have a 16 MB cap; embedding would hit that limit and degrade
//    read performance on every product fetch even when reviews aren't needed.
// 2. Independent queries — reviews are paginated, filtered by rating, and
//    displayed on their own page. A separate collection makes these queries
//    straightforward without pulling the entire product document.
//
// The trade-off is an extra lookup, offset by keeping a cached ratings summary
// (average + count) embedded directly in the Product document.
const reviewSchema = new mongoose.Schema(
  {
    // Both userId and productId are REFERENCES. Reviews belong to independent
    // entities (users and products) that have their own lifecycle and are queried
    // separately (e.g. "all reviews by this user", "all reviews for this product").
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },

    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

// One review per user per product
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
