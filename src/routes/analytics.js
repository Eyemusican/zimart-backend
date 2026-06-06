const express = require('express');
const {
  monthlySalesReport,
  dailySalesReport,
  topProducts,
  lowStockAlert,
  mostViewedVsPurchased,
  topBuyers,
  topSellers,
  systemStats,
} = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.use(auth, roleCheck('admin'));

router.get('/sales',                monthlySalesReport);
router.get('/sales/daily',          dailySalesReport);
router.get('/top-products',         topProducts);
router.get('/low-stock',            lowStockAlert);
router.get('/views-vs-purchases',   mostViewedVsPurchased);
router.get('/leaderboard/buyers',   topBuyers);
router.get('/leaderboard/sellers',  topSellers);
router.get('/system-stats',         systemStats);

module.exports = router;
