const jwt = require('jsonwebtoken');
const User = require('../models/User');
const redis = require('../config/redis');

const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

const signToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const storeSession = (userId, token) =>
  redis.set(`session:${userId}`, token, 'EX', SESSION_TTL);

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Prevent arbitrary role escalation — only allow customer/seller on self-register
    const allowedRoles = ['customer', 'seller'];
    const assignedRole = allowedRoles.includes(role) ? role : 'customer';

    const user = await User.create({ name, email, password, role: assignedRole });

    const token = signToken(user);
    await storeSession(user._id, token);

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    await storeSession(user._id, token);

    // Remove password from response via the toJSON override on User model
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// POST /api/auth/logout  (protected)
const logout = async (req, res) => {
  try {
    await redis.del(`session:${req.user.id}`);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Logout failed', error: err.message });
  }
};

// GET /api/auth/profile  (protected)
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch profile', error: err.message });
  }
};

// PUT /api/auth/profile  (protected)
// Updates name, addresses, paymentPreferences, and/or wishlist.
// Password changes are intentionally excluded — use a dedicated change-password
// endpoint so accidental profile saves can never overwrite the password hash.
const updateProfile = async (req, res) => {
  try {
    const { name, addresses, paymentPreferences, wishlist } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined)               user.name               = name;
    if (addresses !== undefined)          user.addresses          = addresses;
    if (paymentPreferences !== undefined) user.paymentPreferences = paymentPreferences;
    if (wishlist !== undefined)           user.wishlist           = wishlist;

    await user.save();
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Could not update profile', error: err.message });
  }
};

// POST /api/auth/wishlist/:productId  (protected)
// Adds a product to the wishlist; ignores duplicates via $addToSet.
const addToWishlist = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { wishlist: req.params.productId } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: 'Could not update wishlist', error: err.message });
  }
};

// DELETE /api/auth/wishlist/:productId  (protected)
const removeFromWishlist = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { wishlist: req.params.productId } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ message: 'Could not update wishlist', error: err.message });
  }
};

module.exports = { register, login, logout, getProfile, updateProfile, addToWishlist, removeFromWishlist };
