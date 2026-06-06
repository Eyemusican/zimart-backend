const express = require('express');
const { register, login, logout, getProfile, updateProfile, addToWishlist, removeFromWishlist } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', register);
router.post('/login', loginRateLimiter, login);
router.post('/logout', auth, logout);
router.get('/profile',  auth, getProfile);
router.put('/profile',  auth, updateProfile);

router.post('/wishlist/:productId',   auth, addToWishlist);
router.delete('/wishlist/:productId', auth, removeFromWishlist);

module.exports = router;
