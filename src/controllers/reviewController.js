const Review  = require('../models/Review');
const Product = require('../models/Product');

// POST /api/products/:productId/reviews  (auth required, customers only)
//
// After saving the review, the Product's embedded ratings summary is updated
// with a fresh aggregation so the average and count stay accurate.
// Using an aggregation re-compute (rather than incremental arithmetic) is
// safer — it self-heals if any reviews are deleted later.
const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'rating must be an integer between 1 and 5' });
    }

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const review = await Review.create({
      userId:    req.user.id,
      productId,
      rating:    Number(rating),
      comment,
    });

    // Recalculate and persist the embedded ratings summary on the Product document
    const [agg] = await Review.aggregate([
      { $match: { productId: product._id } },
      {
        $group: {
          _id:     '$productId',
          average: { $avg: '$rating' },
          count:   { $sum: 1 },
        },
      },
    ]);

    if (agg) {
      product.ratings.average = Math.round(agg.average * 10) / 10;
      product.ratings.count   = agg.count;
      await product.save();
    }

    res.status(201).json({ review });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You have already reviewed this product' });
    }
    res.status(500).json({ message: 'Failed to create review', error: err.message });
  }
};

// GET /api/products/:productId/reviews
// Paginated list of reviews for a product, newest first.
const getReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));

    const [reviews, total] = await Promise.all([
      Review.find({ productId })
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('userId', 'name')
        .lean(),
      Review.countDocuments({ productId }),
    ]);

    res.json({
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reviews', error: err.message });
  }
};

// DELETE /api/products/:productId/reviews/:reviewId
// Customers may delete their own review; admins may delete any review.
const deleteReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;

    const filter = { _id: reviewId, productId };
    if (req.user.role !== 'admin') filter.userId = req.user.id;

    const review = await Review.findOneAndDelete(filter);
    if (!review) {
      return res.status(404).json({ message: 'Review not found or not authorised' });
    }

    // Recalculate ratings summary after deletion
    const [agg] = await Review.aggregate([
      { $match: { productId: review.productId } },
      { $group: { _id: '$productId', average: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    await Product.findByIdAndUpdate(productId, {
      'ratings.average': agg ? Math.round(agg.average * 10) / 10 : 0,
      'ratings.count':   agg ? agg.count : 0,
    });

    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete review', error: err.message });
  }
};

module.exports = { createReview, getReviews, deleteReview };
