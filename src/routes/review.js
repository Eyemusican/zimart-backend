const express = require('express');
const { createReview, getReviews, deleteReview } = require('../controllers/reviewController');
const { auth } = require('../middleware/auth');

// Mounted at /api/products/:productId/reviews (mergeParams: true lets us read productId)
const router = express.Router({ mergeParams: true });

router.get('/',            getReviews);
router.post('/',   auth,   createReview);
router.delete('/:reviewId', auth, deleteReview);

module.exports = router;
