const express = require('express');
const { register, login, logout, getProfile } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', register);
router.post('/login', loginRateLimiter, login);
router.post('/logout', auth, logout);
router.get('/profile', auth, getProfile);

module.exports = router;
