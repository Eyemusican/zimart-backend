const Category = require('../models/Category');

// GET /api/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('_id name slug description')
      .sort({ name: 1 })
      .lean();
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
  }
};

module.exports = { getCategories };
