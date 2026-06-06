const Order     = require('../models/Order');
const Inventory = require('../models/Inventory');
const User      = require('../models/User');
const redis     = require('../config/redis');

// GET /api/analytics/sales
//
// Pipeline:
//   $match  — Delivered orders only (revenue is real only when delivered)
//   $group  — bucket by calendar year+month; compute revenue, count, avg
//   $addFields — build a human-readable "YYYY-MM" label
//   $sort   — most recent month first
const monthlySalesReport = async (req, res) => {
  try {
    const report = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      {
        $group: {
          _id: {
            year:  { $year:  '$createdAt' },
            month: { $month: '$createdAt' },
          },
          totalRevenue:  { $sum:  '$totalAmount' },
          orderCount:    { $sum:  1 },
          avgOrderValue: { $avg:  '$totalAmount' },
        },
      },
      {
        $addFields: {
          period: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: {
                  if:   { $lt: ['$_id.month', 10] },
                  then: { $concat: ['0', { $toString: '$_id.month' }] },
                  else: { $toString: '$_id.month' },
                },
              },
            ],
          },
          totalRevenue:  { $round: ['$totalRevenue',  2] },
          avgOrderValue: { $round: ['$avgOrderValue', 2] },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $project: { _id: 0, period: 1, totalRevenue: 1, orderCount: 1, avgOrderValue: 1 } },
    ]);

    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate sales report', error: err.message });
  }
};

// GET /api/analytics/sales/daily?month=YYYY-MM
//
// Pipeline mirrors monthlySalesReport but groups by calendar day within the
// requested month (defaults to current month). Adding $dayOfMonth to the _id
// produces one bucket per day so operators can spot daily revenue spikes or
// quiet periods within a month without exporting the raw order collection.
const dailySalesReport = async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: 'month must be in YYYY-MM format' });
    }

    const [year, mo] = month.split('-').map(Number);
    const start = new Date(year, mo - 1, 1);
    const end   = new Date(year, mo,     1); // first day of next month (exclusive)

    const report = await Order.aggregate([
      { $match: { status: 'Delivered', createdAt: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: {
            year:  { $year:       '$createdAt' },
            month: { $month:      '$createdAt' },
            day:   { $dayOfMonth: '$createdAt' },
          },
          totalRevenue:  { $sum: '$totalAmount' },
          orderCount:    { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' },
        },
      },
      {
        $addFields: {
          date: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: {
                  if:   { $lt: ['$_id.month', 10] },
                  then: { $concat: ['0', { $toString: '$_id.month' }] },
                  else: { $toString: '$_id.month' },
                },
              },
              '-',
              {
                $cond: {
                  if:   { $lt: ['$_id.day', 10] },
                  then: { $concat: ['0', { $toString: '$_id.day' }] },
                  else: { $toString: '$_id.day' },
                },
              },
            ],
          },
          totalRevenue:  { $round: ['$totalRevenue',  2] },
          avgOrderValue: { $round: ['$avgOrderValue', 2] },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      { $project: { _id: 0, date: 1, totalRevenue: 1, orderCount: 1, avgOrderValue: 1 } },
    ]);

    res.json({ month, report });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate daily sales report', error: err.message });
  }
};

// GET /api/analytics/top-products
//
// Pipeline:
//   $match   — Delivered orders only
//   $unwind  — flatten items array; required before grouping across line items
//   $group   — sum quantity and revenue per product
//   $sort    — best-sellers first (by quantity)
//   $limit   — top 10
const topProducts = async (req, res) => {
  try {
    const products = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $unwind: '$items' },
      {
        $group: {
          _id:           '$items.productId',
          name:          { $first: '$items.name' },
          totalQuantity: { $sum:   '$items.quantity' },
          totalRevenue:  { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id:           0,
          productId:     '$_id',
          name:          1,
          totalQuantity: 1,
          totalRevenue:  { $round: ['$totalRevenue', 2] },
        },
      },
    ]);

    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch top products', error: err.message });
  }
};

// GET /api/analytics/low-stock
//
// Returns all Inventory records where current stock is at or below the
// configured lowStockThreshold. The $expr operator allows comparing two
// fields within the same document — not possible with a plain query filter.
// Results are sorted ascending by stock so the most critical items appear first.
const lowStockAlert = async (req, res) => {
  try {
    const inventory = await Inventory.find({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    })
      .populate('productId', 'name category isActive')
      .lean();

    const alerts = inventory
      .filter((inv) => inv.productId?.isActive !== false)
      .map((inv) => ({
        productId:         inv.productId?._id,
        name:              inv.productId?.name,
        currentStock:      inv.stock,
        lowStockThreshold: inv.lowStockThreshold,
        deficit:           inv.lowStockThreshold - inv.stock,
        lastUpdated:       inv.lastUpdated,
      }))
      .sort((a, b) => a.currentStock - b.currentStock);

    res.json({ count: alerts.length, alerts });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch low-stock alerts', error: err.message });
  }
};

// GET /api/analytics/views-vs-purchases
//
// Combines two data sources to produce a conversion-rate analysis:
//   - MongoDB aggregation for total units sold per product (Delivered orders)
//   - Redis PFCOUNT for estimated unique page visitors per product (HyperLogLog)
//
// The conversion rate = (totalPurchased / estimatedViews) × 100.
// A low conversion rate despite high views signals a product that attracts
// interest but fails to convert (pricing, description, reviews).
// A high conversion rate on low views signals a product needing more exposure.
const mostViewedVsPurchased = async (req, res) => {
  try {
    // Top 20 products by units sold from MongoDB
    const purchased = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $unwind: '$items' },
      {
        $group: {
          _id:            '$items.productId',
          name:           { $first: '$items.name' },
          totalPurchased: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalPurchased: -1 } },
      { $limit: 20 },
    ]);

    // Enrich each entry with Redis view counts in parallel
    const enriched = await Promise.all(
      purchased.map(async (p) => {
        const estimatedViews = await redis.pfcount(`product:views:${p._id}`);
        return {
          productId:      p._id,
          name:           p.name,
          totalPurchased: p.totalPurchased,
          estimatedViews,
          conversionRate: estimatedViews > 0
            ? `${((p.totalPurchased / estimatedViews) * 100).toFixed(2)}%`
            : 'N/A',
        };
      })
    );

    const mostViewed    = [...enriched].sort((a, b) => b.estimatedViews    - a.estimatedViews   ).slice(0, 10);
    const mostPurchased = [...enriched].sort((a, b) => b.totalPurchased    - a.totalPurchased   ).slice(0, 10);

    res.json({ mostViewed, mostPurchased });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch view vs purchase analysis', error: err.message });
  }
};

// GET /api/analytics/leaderboard/buyers?month=YYYY-MM
//
// Reads the monthly buyer leaderboard from the Redis Sorted Set
// `leaderboard:buyers:{YYYY-MM}`. Scores represent cumulative spend.
// Updated in real-time by orderController on every successful order placement.
const topBuyers = async (req, res) => {
  try {
    const period = req.query.month || new Date().toISOString().slice(0, 7);

    if (!/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({ message: 'month must be in YYYY-MM format' });
    }

    const raw = await redis.zrevrange(`leaderboard:buyers:${period}`, 0, 9, 'WITHSCORES');

    if (!raw.length) {
      return res.json({ period, buyers: [] });
    }

    const pairs = [];
    for (let i = 0; i < raw.length; i += 2) {
      pairs.push({ userId: raw[i], totalSpent: Number(Number(raw[i + 1]).toFixed(2)) });
    }

    const ids     = pairs.map((p) => p.userId);
    const users   = await User.find({ _id: { $in: ids } }).select('name email').lean();
    const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

    const buyers = pairs.map((p, i) => ({
      rank:       i + 1,
      userId:     p.userId,
      name:       userMap[p.userId]?.name  ?? 'Unknown',
      email:      userMap[p.userId]?.email ?? '',
      totalSpent: p.totalSpent,
    }));

    res.json({ period, buyers });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch buyer leaderboard', error: err.message });
  }
};

// GET /api/analytics/leaderboard/sellers?month=YYYY-MM
//
// Reads the monthly seller leaderboard from `leaderboard:sellers:{YYYY-MM}`.
// Scores represent cumulative revenue earned from items sold in confirmed orders.
const topSellers = async (req, res) => {
  try {
    const period = req.query.month || new Date().toISOString().slice(0, 7);

    if (!/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({ message: 'month must be in YYYY-MM format' });
    }

    const raw = await redis.zrevrange(`leaderboard:sellers:${period}`, 0, 9, 'WITHSCORES');

    if (!raw.length) {
      return res.json({ period, sellers: [] });
    }

    const pairs = [];
    for (let i = 0; i < raw.length; i += 2) {
      pairs.push({ sellerId: raw[i], totalRevenue: Number(Number(raw[i + 1]).toFixed(2)) });
    }

    const ids     = pairs.map((p) => p.sellerId);
    const users   = await User.find({ _id: { $in: ids } }).select('name email').lean();
    const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

    const sellers = pairs.map((p, i) => ({
      rank:         i + 1,
      sellerId:     p.sellerId,
      name:         userMap[p.sellerId]?.name  ?? 'Unknown',
      email:        userMap[p.sellerId]?.email ?? '',
      totalRevenue: p.totalRevenue,
    }));

    res.json({ period, sellers });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch seller leaderboard', error: err.message });
  }
};

module.exports = {
  monthlySalesReport,
  dailySalesReport,
  topProducts,
  lowStockAlert,
  mostViewedVsPurchased,
  topBuyers,
  topSellers,
};
