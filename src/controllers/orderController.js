const mongoose = require('mongoose');
const Order     = require('../models/Order');
const Inventory = require('../models/Inventory');
const Product   = require('../models/Product');
const redis     = require('../config/redis');

const cartKey = (userId) => `cart:${userId}`;

// Each state maps to the set of valid next states.
// Forward path: Placed → Confirmed → Shipped → Delivered
// Cancellation: Placed or Confirmed can be cancelled (not after shipping)
// Return: only a Delivered order can be returned
const STATUS_TRANSITIONS = {
  Placed:    ['Confirmed', 'Cancelled'],
  Confirmed: ['Shipped',   'Cancelled'],
  Shipped:   ['Delivered'],
  Delivered: ['Returned'],
};

// Updates the monthly buyer and seller Redis sorted-set leaderboards.
// Runs fire-and-forget after commitTransaction() so it never blocks the response
// and a Redis failure cannot roll back an already-committed order.
//
// Buyer leaderboard  — key: leaderboard:buyers:{YYYY-MM}
//   Score = cumulative order total spent by this user in the current month.
//
// Seller leaderboard — key: leaderboard:sellers:{YYYY-MM}
//   Score = cumulative revenue earned by each seller from items in this order.
//   Requires a Product lookup per item to resolve sellerId; acceptable as
//   fire-and-forget since it runs outside the critical response path.
const updateLeaderboards = async (userId, orderItems, totalAmount) => {
  const period = new Date().toISOString().slice(0, 7); // YYYY-MM
  const TTL    = 35 * 24 * 60 * 60;                   // 35 days — outlasts the full month

  // Buyer leaderboard
  await redis.zincrby(`leaderboard:buyers:${period}`, totalAmount, userId.toString());
  await redis.expire(`leaderboard:buyers:${period}`, TTL);

  // Seller leaderboard — aggregate revenue per seller across all line items
  const sellerRevenue = {};

  for (const item of orderItems) {
    const product = await Product.findById(item.productId).select('sellerId').lean();
    if (!product?.sellerId) continue;
    const sid = product.sellerId.toString();
    sellerRevenue[sid] = (sellerRevenue[sid] || 0) + item.price * item.quantity;
  }

  if (Object.keys(sellerRevenue).length > 0) {
    const sellerKey = `leaderboard:sellers:${period}`;
    const pipeline  = redis.pipeline();
    for (const [sellerId, revenue] of Object.entries(sellerRevenue)) {
      pipeline.zincrby(sellerKey, revenue, sellerId);
    }
    pipeline.expire(sellerKey, TTL);
    await pipeline.exec();
  }
};

// POST /api/orders
//
// Uses a MongoDB multi-document ACID transaction so that stock decrements and
// order creation are atomic. If any item is out of stock, abortTransaction()
// rolls back ALL inventory decrements already applied in this loop — no partial
// fulfilments, no overselling.
//
// Redis cart clear and leaderboard updates happen OUTSIDE the transaction
// intentionally: Redis is not part of the MongoDB replica-set protocol and cannot
// join the two-phase commit. Clearing after commitTransaction() is safe — if the
// process dies between commit and DEL the cart will expire via its 7-day TTL.
const placeOrder = async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  if (!shippingAddress || !paymentMethod) {
    return res.status(400).json({ message: 'shippingAddress and paymentMethod are required' });
  }

  const cartData = await redis.hgetall(cartKey(req.user.id));

  if (!cartData || Object.keys(cartData).length === 0) {
    return res.status(400).json({ message: 'Cart is empty' });
  }

  const cartItems = Object.entries(cartData).map(([productId, raw]) => ({
    productId,
    ...JSON.parse(raw),
  }));

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orderItems  = [];
    let   totalAmount = 0;

    for (const item of cartItems) {
      // Atomic check-and-decrement: the { stock: { $gte: quantity } } filter acts
      // as a guard — if stock is too low the update matches nothing and returns null.
      const inventory = await Inventory.findOneAndUpdate(
        { productId: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity }, lastUpdated: new Date() },
        { session, new: true }
      );

      if (!inventory) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: `Insufficient stock for "${item.name}". Please update your cart.`,
        });
      }

      orderItems.push({
        productId: item.productId,
        name:      item.name,
        quantity:  item.quantity,
        price:     item.price,
      });

      totalAmount += item.price * item.quantity;
    }

    const [order] = await Order.create(
      [
        {
          userId:          req.user.id,
          items:           orderItems,
          totalAmount:     Number(totalAmount.toFixed(2)),
          status:          'Placed',
          shippingAddress,
          paymentMethod,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Post-commit side-effects (non-blocking)
    await redis.del(cartKey(req.user.id));
    updateLeaderboards(req.user.id, orderItems, Number(totalAmount.toFixed(2))).catch((err) =>
      console.error('Leaderboard update failed:', err.message)
    );

    res.status(201).json({ order });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: 'Order placement failed', error: err.message });
  }
};

// GET /api/orders
const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));

    const filter = { userId: req.user.id };
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
};

// GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.role !== 'admin' && order.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch order', error: err.message });
  }
};

// PUT /api/orders/:id/status  (admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const allowed = STATUS_TRANSITIONS[order.status];
    if (!allowed) {
      return res.status(400).json({
        message: `Order is already in a terminal state: ${order.status}`,
      });
    }
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Invalid transition. "${order.status}" can move to: ${allowed.join(', ')}`,
      });
    }

    order.status = status;
    await order.save();

    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update order status', error: err.message });
  }
};

// PUT /api/orders/:id/cancel  (customer — own orders only)
// Customers can cancel their own order while it hasn't shipped yet.
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const allowed = STATUS_TRANSITIONS[order.status];
    if (!allowed?.includes('Cancelled')) {
      return res.status(400).json({
        message: `Cannot cancel an order with status "${order.status}"`,
      });
    }

    order.status = 'Cancelled';
    await order.save();

    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel order', error: err.message });
  }
};

module.exports = { placeOrder, getOrders, getOrderById, updateOrderStatus, cancelOrder };
