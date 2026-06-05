const express = require('express');
const {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  addToRecentlyViewed,
  getRecentlyViewed,
  mergeGuestCart,
} = require('../controllers/cartController');
const { auth }        = require('../middleware/auth');
const optionalAuth    = require('../middleware/optionalAuth');

const router = express.Router();

// Guest-compatible routes use optionalAuth — accepts Bearer token or X-Guest-Id header.
// /api/cart/recent must be declared before /api/cart/:productId to prevent Express
// from binding the literal string "recent" to the :productId param.
router.get('/recent',        optionalAuth, getRecentlyViewed);
router.post('/recent',       optionalAuth, addToRecentlyViewed);

// POST /api/cart/merge is auth-only: the user must be logged in to own a target cart.
router.post('/merge', auth, mergeGuestCart);

router.get('/',              optionalAuth, getCart);
router.post('/',             optionalAuth, addToCart);
router.put('/:productId',    optionalAuth, updateCartItem);
router.delete('/:productId', optionalAuth, removeFromCart);
router.delete('/',           optionalAuth, clearCart);

module.exports = router;
