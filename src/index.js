require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
require('./config/redis');

// Register all Mongoose models before any route handler references them
require('./models/User');
require('./models/Product');
require('./models/Category');
require('./models/Order');
require('./models/Review');
require('./models/Inventory');
const authRoutes     = require('./routes/auth');
const productRoutes  = require('./routes/product');
const cartRoutes     = require('./routes/cart');
const orderRoutes    = require('./routes/order');
const analyticsRoutes = require('./routes/analytics');
const reviewRoutes   = require('./routes/review');

const app = express();

connectDB();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no origin) only in development
      if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',                         authRoutes);
app.use('/api/products',                     productRoutes);
app.use('/api/products/:productId/reviews',  reviewRoutes);
app.use('/api/cart',                         cartRoutes);
app.use('/api/orders',                       orderRoutes);
app.use('/api/analytics',                    analyticsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'ZiMart API is running' });
});

// Express 5 stores the raw path on layer.path; Express 4 requires regexp parsing.
const getMountPath = (layer) => {
  if (typeof layer.path === 'string' && layer.path) return layer.path;
  if (!layer.regexp?.source) return '';
  const parsed = layer.regexp.source
    .replace(/^\^/, '')
    .replaceAll(String.raw`\/`, '/')
    .replace(/\/\?\(\?=\/\|\$\).*$/, '')
    .replace(/\(\?.*$/, '')
    .replace(/\?$/, '');
  return parsed && !parsed.startsWith('/') ? `/${parsed}` : parsed;
};

// Walks the Express router stack to collect every registered method + path.
const listRoutes = (stack, prefix = '') => {
  const routes = [];
  for (const layer of stack) {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase());
      routes.push({ method: methods.join(','), path: prefix + layer.route.path });
    } else if (layer.handle?.stack) {
      routes.push(...listRoutes(layer.handle.stack, prefix + getMountPath(layer)));
    }
  }
  return routes;
};

app.get('/api/routes', (req, res) => {
  // app._router is the lazily-created internal router (Express 4 + 5).
  // Guard with ?. so a cold hit before any route fires never throws.
  const router = app._router ?? app.router;
  if (!router?.stack) {
    return res.json({ count: 0, routes: [] });
  }
  const routes = listRoutes(router.stack);
  res.json({ count: routes.length, routes });
});

app.listen(PORT, () => {
  console.log(`ZiMart server running on port ${PORT}`);
});

module.exports = app;
