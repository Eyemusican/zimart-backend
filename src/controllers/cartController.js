const redis = require('../config/redis');
const Product = require('../models/Product');

const CART_TTL  = 7 * 24 * 60 * 60; // 7 days in seconds
const RECENT_MAX = 10;

// req.cartId is set by optionalAuth:
//   authenticated user → userId string
//   guest             → 'guest:{guestId}'
const cartKey   = (id) => `cart:${id}`;
const recentKey = (id) => `recent:${id}`;

const refreshCartTTL = (id) => redis.expire(cartKey(id), CART_TTL);

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

    const key = cartKey(req.cartId);

    const existing    = await redis.hget(key, productId);
    const currentQty  = existing ? JSON.parse(existing).quantity : 0;

    const item = {
      name:     product.name,
      price:    product.price,
      quantity: currentQty + Number(quantity),
    };

    await redis.hset(key, productId, JSON.stringify(item));
    await refreshCartTTL(req.cartId);

    res.status(201).json({ message: 'Item added to cart', item: { productId, ...item } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add to cart', error: err.message });
  }
};

// GET /api/cart
const getCart = async (req, res) => {
  try {
    const data = await redis.hgetall(cartKey(req.cartId));

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
    const { quantity }  = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'quantity must be at least 1' });
    }

    const key      = cartKey(req.cartId);
    const existing = await redis.hget(key, productId);

    if (!existing) {
      return res.status(404).json({ message: 'Item not in cart' });
    }

    const item = { ...JSON.parse(existing), quantity: Number(quantity) };

    await redis.hset(key, productId, JSON.stringify(item));
    await refreshCartTTL(req.cartId);

    res.json({ message: 'Cart updated', item: { productId, ...item } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update cart', error: err.message });
  }
};

// DELETE /api/cart/:productId
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const removed = await redis.hdel(cartKey(req.cartId), productId);

    if (!removed) {
      return res.status(404).json({ message: 'Item not in cart' });
    }

    await refreshCartTTL(req.cartId);

    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove item', error: err.message });
  }
};

// DELETE /api/cart
const clearCart = async (req, res) => {
  try {
    await redis.del(cartKey(req.cartId));
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear cart', error: err.message });
  }
};

// POST /api/cart/recent
// LPUSH + LTRIM in a single pipeline: O(1) insert, O(1) trim, one round-trip.
const addToRecentlyViewed = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    const key = recentKey(req.cartId);

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
    const productIds = await redis.lrange(recentKey(req.cartId), 0, -1);

    if (!productIds.length) {
      return res.json({ products: [] });
    }

    const products = await Product.find({ _id: { $in: productIds }, isActive: true })
      .select('name price ratings')
      .lean();

    // Preserve Redis list order (most recent first)
    const ordered = productIds
      .map((id) => products.find((p) => p._id.toString() === id))
      .filter(Boolean);

    res.json({ products: ordered });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch recently viewed', error: err.message });
  }
};

// POST /api/cart/merge  (auth required)
// After a guest logs in, call this to pull the guest cart into the user cart.
// Guest items are merged only if the product is not already in the user cart;
// the user cart takes precedence on duplicates to avoid overwriting quantities
// the user manually set while logged in.
const mergeGuestCart = async (req, res) => {
  try {
    const { guestId } = req.body;

    if (!guestId || !/^[a-zA-Z0-9_-]{8,64}$/.test(guestId)) {
      return res.status(400).json({ message: 'A valid guestId (8–64 alphanumeric chars) is required' });
    }

    const guestKey = cartKey(`guest:${guestId}`);
    const userKey  = cartKey(req.user.id);

    const [guestData, userData] = await Promise.all([
      redis.hgetall(guestKey),
      redis.hgetall(userKey),
    ]);

    if (!guestData || Object.keys(guestData).length === 0) {
      return res.json({ message: 'Guest cart is empty — nothing to merge', merged: 0 });
    }

    const pipeline = redis.pipeline();
    let merged = 0;

    for (const [productId, raw] of Object.entries(guestData)) {
      if (!userData || !userData[productId]) {
        pipeline.hset(userKey, productId, raw);
        merged++;
      }
    }

    pipeline.expire(userKey, CART_TTL);
    pipeline.del(guestKey);
    await pipeline.exec();

    res.json({ message: `Merged ${merged} item(s) from guest cart`, merged });
  } catch (err) {
    res.status(500).json({ message: 'Failed to merge cart', error: err.message });
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
  mergeGuestCart,
};
