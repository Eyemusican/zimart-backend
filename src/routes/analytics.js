const express = require('express');
const { monthlySalesReport, topProducts } = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.use(auth, roleCheck('admin'));

router.get('/sales', monthlySalesReport);
router.get('/top-products', topProducts);

module.exports = router;
