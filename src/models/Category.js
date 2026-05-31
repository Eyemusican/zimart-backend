const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },

    // parentCategory is a SELF-REFERENCE (same collection) rather than an embedded
    // subdocument. Categories form a tree of arbitrary depth (Electronics →
    // Computers → Laptops). Embedding would mean duplicating the entire ancestor
    // chain inside every leaf node and making tree updates a cascade of rewrites.
    // Referencing keeps each node lightweight; tree traversal is done with
    // recursive queries or a $graphLookup aggregation when needed.
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },

    slug:     { type: String, unique: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ parentCategory: 1 });

module.exports = mongoose.model('Category', categorySchema);
