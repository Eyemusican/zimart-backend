const Order = require('../models/Order');

// GET /api/analytics/sales
//
// Pipeline walkthrough:
//   $match  — only count Delivered orders so in-flight/cancelled orders don't
//             skew revenue figures (an order is only money-in-the-door when delivered)
//   $group  — bucket by calendar year+month; compute revenue, count, and avg
//   $addFields — build a human-readable "YYYY-MM" label for the client
//   $sort   — most recent month first so the caller gets a time-descending list
const monthlySalesReport = async (req, res) => {
  try {
    const report = await Order.aggregate([
      {
        $match: { status: 'Delivered' },
      },
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
      {
        $sort: { '_id.year': -1, '_id.month': -1 },
      },
      {
        $project: { _id: 0, period: 1, totalRevenue: 1, orderCount: 1, avgOrderValue: 1 },
      },
    ]);

    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate sales report', error: err.message });
  }
};

// GET /api/analytics/top-products
//
// Pipeline walkthrough:
//   $match   — include only Delivered orders so revenue figures are real earnings,
//              not speculative amounts from pending/cancelled orders
//   $unwind  — flatten the items array so each order line becomes its own document;
//              required before $group can aggregate across all line items globally
//   $group   — sum quantity sold and revenue per product; $first captures the name
//              from the first document in each group (name is denormalised in Order)
//   $sort    — by total quantity descending to surface best-sellers first
//   $limit   — top 10 only
//   $project — round revenue to 2 dp and rename _id to productId for clarity
const topProducts = async (req, res) => {
  try {
    const products = await Order.aggregate([
      {
        $match: { status: 'Delivered' },
      },
      {
        $unwind: '$items',
      },
      {
        $group: {
          _id:           '$items.productId',
          name:          { $first: '$items.name' },
          totalQuantity: { $sum:   '$items.quantity' },
          totalRevenue:  {
            $sum: { $multiply: ['$items.price', '$items.quantity'] },
          },
        },
      },
      {
        $sort: { totalQuantity: -1 },
      },
      {
        $limit: 10,
      },
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

module.exports = { monthlySalesReport, topProducts };
