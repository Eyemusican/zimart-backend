const redis = require('../config/redis');
const Product = require('../models/Product');

const CART_TTL = 7 * 24 * 60 * 60;    // 7 days in seconds
const RECENT_MAX = 10;

const cartKey   = (userId) => `cart:${userId}`;
const recentKey = (userId) => `recent:${userId}`;

// Refresh TTL on every cart write so active users never get evicted mid-session.
const refreshCartTTL = (userId) => redis.expire(cartKey(userId), CART_TTL);

// POST /api/cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }
    if (quantity < 1) {
      return res.status(400).json({ message: 'quantity must be at least 1' });
    }

    const product = await Product.findOne({ _id: productId, isActive: true })
      .select('name price')
      .lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const key = cartKey(req.user.id);

    // If the item already exists in the cart, add to its quantity rather than
    // overwriting — consistent with how every major e-commerce cart works.
    const existing = await redis.hget(key, productId);
    const currentQty = existing ? JSON.parse(existing).quantity : 0;

    const item = {
      name:     product.name,
      price:    product.price,
      quantity: currentQty + Number(quantity),
    };

    await redis.hset(key, productId, JSON.stringify(item));
    await refreshCartTTL(req.user.id);

    res.status(201).json({ message: 'Item added to cart', item: { productId, ...item } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add to cart', error: err.message });
  }
};

// GET /api/cart
const getCart = async (req, res) => {
  try {
    const data = await redis.hgetall(cartKey(req.user.id));

    if (!data) {
      return res.json({ items: [], total: 0 });
    }

    const items = Object.entries(data).map(([productId, raw]) => ({
      productId,
      ...JSON.parse(raw),
    }));

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    res.json({ items, total: Number(total.toFixed(2)) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch cart', error: err.message });
  }
};

// PUT /api/cart/:productId
const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'quantity must be at least 1' });
    }

    const key = cartKey(req.user.id);
    const existing = await redis.hget(key, productId);

    if (!existing) {
      return res.status(404).json({ message: 'Item not in cart' });
    }

    const item = { ...JSON.parse(existing), quantity: Number(quantity) };

    await redis.hset(key, productId, JSON.stringify(item));
    await refreshCartTTL(req.user.id);

    res.json({ message: 'Cart updated', item: { productId, ...item } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update cart', error: err.message });
  }
};

// DELETE /api/cart/:productId
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const key = cartKey(req.user.id);

    const removed = await redis.hdel(key, productId);

    if (!removed) {
      return res.status(404).json({ message: 'Item not in cart' });
    }

    await refreshCartTTL(req.user.id);

    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove item', error: err.message });
  }
};

// DELETE /api/cart
const clearCart = async (req, res) => {
  try {
    await redis.del(cartKey(req.user.id));
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear cart', error: err.message });
  }
};

// POST /api/cart/recent  (called internally or explicitly by the client)
// LPUSH puts the newest item at the head; LTRIM keeps only the 10 most recent.
// This gives O(1) insert and O(1) trim — no sorting or scoring needed.
const addToRecentlyViewed = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    const key = recentKey(req.user.id);

    // Use a pipeline so LPUSH + LTRIM execute atomically in one round-trip.
    await redis
      .pipeline()
      .lpush(key, productId)
      .ltrim(key, 0, RECENT_MAX - 1)
      .expire(key, CART_TTL)
      .exec();

    res.status(201).json({ message: 'Added to recently viewed' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update recently viewed', error: err.message });
  }
};

// GET /api/cart/recent
const getRecentlyViewed = async (req, res) => {
  try {
    // LRANGE 0 -1 returns all elements; the list is already capped at 10 by LTRIM.
    const productIds = await redis.lrange(recentKey(req.user.id), 0, -1);

    if (!productIds.length) {
      return res.json({ products: [] });
    }

    // Fetch product summaries in one $in query rather than N individual lookups.
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    })
      .select('name price ratings')
      .lean();

    // Re-order results to match the Redis list order (most recent first).
    const ordered = productIds
      .map((id) => products.find((p) => p._id.toString() === id))
      .filter(Boolean);

    res.json({ products: ordered });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch recently viewed', error: err.message });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  addToRecentlyViewed,
  getRecentlyViewed,
};
