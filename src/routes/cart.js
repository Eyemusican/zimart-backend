const express = require('express');
const {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  addToRecentlyViewed,
  getRecentlyViewed,
} = require('../controllers/cartController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// All cart routes require authentication — carts are user-scoped
router.use(auth);

// /api/cart/recent must be declared before /api/cart/:productId so Express
// does not treat the literal string "recent" as a productId param.
router.get('/recent', getRecentlyViewed);
router.post('/recent', addToRecentlyViewed);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:productId', updateCartItem);
router.delete('/:productId', removeFromCart);
router.delete('/', clearCart);

module.exports = router;
