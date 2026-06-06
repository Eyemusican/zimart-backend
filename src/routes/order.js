const express = require('express');
const { placeOrder, getOrders, getOrderById, updateOrderStatus, cancelOrder } = require('../controllers/orderController');
const { auth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { orderRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(auth);

router.post('/', orderRateLimiter, placeOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);
router.put('/:id/status', roleCheck('admin'), updateOrderStatus);

module.exports = router;
