const mongoose = require('mongoose');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const redis = require('../config/redis');

const cartKey = (userId) => `cart:${userId}`;

// Valid forward-only status transitions. Cancellation/returns are separate flows.
const STATUS_TRANSITIONS = {
  Placed:    'Confirmed',
  Confirmed: 'Shipped',
  Shipped:   'Delivered',
};

// POST /api/orders
//
// Uses a MongoDB multi-document ACID transaction so that stock decrements and
// order creation are atomic. If any item is out of stock, abortTransaction()
// rolls back ALL inventory decrements already applied in this loop — no partial
// fulfilments, no overselling.
//
// Redis cart clear happens OUTSIDE the transaction intentionally: Redis is not
// part of the MongoDB replica-set protocol, so it cannot join the two-phase
// commit. Clearing after commitTransaction() is safe — if the process dies
// between commit and DEL the cart will expire via its 7-day TTL.
const placeOrder = async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  if (!shippingAddress || !paymentMethod) {
    return res.status(400).json({ message: 'shippingAddress and paymentMethod are required' });
  }

  // Read cart before opening the session — Redis reads don't need a Mongo session.
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
      // Atomic check-and-decrement in a single findOneAndUpdate:
      // the { stock: { $gte: quantity } } filter acts as the guard —
      // if stock is too low the update matches nothing and returns null,
      // which we treat as an insufficient-stock signal.
      const inventory = await Inventory.findOneAndUpdate(
        { productId: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity }, lastUpdated: new Date() },
        { session, new: true }
      );

      if (!inventory) {
        // Abort rolls back every $inc applied earlier in this loop.
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

    // Order.create() inside a session requires the array form so Mongoose
    // passes the session option to insertMany internally.
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

    // Clear cart post-commit. Safe to fire-and-forget — see comment above.
    await redis.del(cartKey(req.user.id));

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

    // Customers may only see their own orders; admins see all.
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

    // Enforce the linear progression: Placed → Confirmed → Shipped → Delivered.
    // Prevents skipping steps or going backwards which would break fulfilment logic.
    const expected = STATUS_TRANSITIONS[order.status];
    if (!expected) {
      return res.status(400).json({
        message: `Order is already in a terminal state: ${order.status}`,
      });
    }
    if (status !== expected) {
      return res.status(400).json({
        message: `Invalid transition. "${order.status}" can only move to "${expected}"`,
      });
    }

    order.status = status;
    await order.save();

    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update order status', error: err.message });
  }
};

module.exports = { placeOrder, getOrders, getOrderById, updateOrderStatus };
