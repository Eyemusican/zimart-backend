const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const redis = require('../config/redis');

const PRODUCT_TTL = 60 * 60; // 1 hour in seconds
const cacheKey = (id) => `product:${id}`;

// Track unique views (HyperLogLog) and trending score (Sorted Set) for a product.
// Using the visitor IP as the HyperLogLog element gives a probabilistic unique-visitor
// count without storing the actual IPs. ZINCRBY increments the product's score in a
// global leaderboard so "trending" can be read with ZREVRANGE in O(log N).
const trackView = (id, req) => {
  const visitor = req.headers['x-forwarded-for'] || req.ip || 'unknown';
  return Promise.all([
    redis.pfadd(`product:views:${id}`, visitor),
    redis.zincrby('trending:products', 1, id),
  ]);
};

// POST /api/products
const createProduct = async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      sellerId: req.user.id,
    });

    // Create a paired Inventory record with 0 stock so stock can be managed
    // independently without waiting for a manual inventory setup step.
    await Inventory.create({ productId: product._id, stock: 0 });

    res.status(201).json({ product });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create product', error: err.message });
  }
};

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      search,
      sort = 'createdAt',
      order = 'desc',
    } = req.query;

    const filter = { isActive: true };

    if (category) filter.category = category;

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    // $text uses the compound text index defined on the Product model
    // (name + description + tags). Requires at least one text index on the collection.
    if (search) filter.$text = { $search: search };

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit))); // cap at 100 per page
    const skip = (pageNum - 1) * limitNum;

    // When a text search is active, sort by relevance score first then fall back
    // to the requested sort field. Without this, text results are unordered.
    const sortObj = search
      ? { score: { $meta: 'textScore' }, [sort]: order === 'desc' ? -1 : 1 }
      : { [sort]: order === 'desc' ? -1 : 1 };

    const projection = search ? { score: { $meta: 'textScore' } } : {};

    const [products, total] = await Promise.all([
      Product.find(filter, projection)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('category', 'name slug')
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products', error: err.message });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Cache-aside: serve from Redis if available, populate and cache on miss.
    const cached = await redis.get(cacheKey(id));
    if (cached) {
      await trackView(id, req);
      return res.json({ product: JSON.parse(cached) });
    }

    const product = await Product.findOne({ _id: id, isActive: true })
      .populate('category', 'name slug')
      .populate('sellerId', 'name email')
      .lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Write-through: cache the freshly fetched document for 1 hour.
    await redis.set(cacheKey(id), JSON.stringify(product), 'EX', PRODUCT_TTL);

    await trackView(id, req);

    res.json({ product });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch product', error: err.message });
  }
};

// GET /api/products/trending
const getTrendingProducts = async (req, res) => {
  try {
    // ZREVRANGE returns a flat array: [id, score, id, score, ...]
    const raw = await redis.zrevrange('trending:products', 0, 9, 'WITHSCORES');

    if (!raw.length) {
      return res.json({ products: [] });
    }

    // Pair up members and scores: [[id, score], ...]
    const pairs = [];
    for (let i = 0; i < raw.length; i += 2) {
      pairs.push({ id: raw[i], viewCount: Number(raw[i + 1]) });
    }

    const ids = pairs.map((p) => p.id);
    const docs = await Product.find({ _id: { $in: ids }, isActive: true })
      .populate('category', 'name slug')
      .lean();

    // Re-order docs to match the Redis ranking and attach viewCount
    const scoreMap = Object.fromEntries(pairs.map((p) => [p.id, p.viewCount]));
    const products = ids
      .map((id) => {
        const doc = docs.find((d) => d._id.toString() === id);
        if (!doc) return null;
        return { ...doc, viewCount: scoreMap[id] };
      })
      .filter(Boolean);

    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch trending products', error: err.message });
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Sellers may only edit their own listings; admins may edit any product.
    const filter = { _id: id };
    if (req.user.role === 'seller') filter.sellerId = req.user.id;

    const product = await Product.findOneAndUpdate(filter, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found or not authorised' });
    }

    // Invalidate cache so the next read fetches fresh data from MongoDB.
    await redis.del(cacheKey(id));

    res.json({ product });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update product', error: err.message });
  }
};

// DELETE /api/products/:id  (soft delete)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Remove stale cache entry so the product stops appearing in ID lookups.
    await redis.del(cacheKey(id));

    res.json({ message: 'Product removed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete product', error: err.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getTrendingProducts,
  updateProduct,
  deleteProduct,
};
