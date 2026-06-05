const express = require('express');
const {
  monthlySalesReport,
  topProducts,
  lowStockAlert,
  mostViewedVsPurchased,
  topBuyers,
  topSellers,
} = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.use(auth, roleCheck('admin'));

router.get('/sales',                monthlySalesReport);
router.get('/top-products',         topProducts);
router.get('/low-stock',            lowStockAlert);
router.get('/views-vs-purchases',   mostViewedVsPurchased);
router.get('/leaderboard/buyers',   topBuyers);
router.get('/leaderboard/sellers',  topSellers);

module.exports = router;
