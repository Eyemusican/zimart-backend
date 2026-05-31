const express = require('express');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { auth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', auth, roleCheck('seller', 'admin'), createProduct);
router.put('/:id', auth, roleCheck('seller', 'admin'), updateProduct);
router.delete('/:id', auth, roleCheck('admin'), deleteProduct);

module.exports = router;
