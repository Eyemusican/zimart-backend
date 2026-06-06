# ZiMart Backend API

> Production-ready e-commerce backend built for DBS302 (NoSQL Database Management).  
> Demonstrates polyglot persistence using **MongoDB Atlas** as the primary document store and **Redis Cloud** as the in-memory cache, session, and real-time data layer.

---

## Table of Contents

1. [Project Description](#1-project-description)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Local Setup Instructions](#4-local-setup-instructions)
5. [Environment Variables](#5-environment-variables)
6. [Seeding the Database](#6-seeding-the-database)
7. [API Documentation](#7-api-documentation)
8. [Redis Data Structures](#8-redis-data-structures)
9. [MongoDB Collections](#9-mongodb-collections)
10. [Test Credentials](#10-test-credentials)
11. [Screenshots](#11-screenshots)

---

## 1. Project Description

ZiMart is a RESTful e-commerce backend that covers the full shopping lifecycle:

- User registration, login, and role-based access (Customer / Seller / Admin)
- Product catalogue with full-text search, filtering, sorting, and pagination
- Guest cart and authenticated cart (Redis Hash, 7-day sliding TTL)
- Cart merge on login — guest items migrate to the user's cart seamlessly
- Order placement with **ACID transactions** — atomic stock decrement across all line items, impossible to oversell
- Real-time trending leaderboard, recently viewed history, monthly buyer/seller leaderboards (all Redis-driven)
- Unique visitor counting per product using HyperLogLog
- Rate limiting on sensitive endpoints using Redis counters
- Analytics: monthly/daily sales reports, top products, low-stock alerts, views-vs-purchases conversion analysis

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| HTTP Framework | Express 5 |
| Primary Database | MongoDB Atlas (3-node replica set, M0 free tier) |
| In-Memory Store | Redis Cloud (managed, equivalent to Redis Sentinel HA) |
| ODM | Mongoose 9 |
| Redis Client | ioredis |
| Authentication | JSON Web Tokens (jsonwebtoken) |
| Password Hashing | bcryptjs (12 rounds) |
| Security Headers | Helmet |
| Process Manager | nodemon (dev) |

---

## 3. Architecture Overview

```
Client (Postman / Browser / Frontend)
        │
        ▼
Express 5 API (Node.js — port 5000)
  ├── Helmet (security headers)
  ├── CORS (origin whitelist via ALLOWED_ORIGINS env)
  ├── JWT Auth Middleware
  ├── Redis Rate Limiter Middleware
  └── Routers → Controllers
        │                    │
        ▼                    ▼
  MongoDB Atlas         Redis Cloud
  (6 collections)       (5 data types)
  ├── users             ├── String  — sessions, product cache, rate limits
  ├── products          ├── Hash    — carts (user + guest)
  ├── categories        ├── Sorted Set — trending, leaderboards
  ├── orders            ├── List    — recently viewed
  ├── reviews           └── HyperLogLog — unique visitors
  └── inventories
```

---

## 4. Local Setup Instructions

### Step 1 — Clone the repository

```bash
git clone https://github.com/Rynorbu/DBS302_Project.git
cd DBS302_Project
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Create your environment file

```bash
cp .env.example .env
```

Open `.env` and fill in your credentials (see [Section 5](#5-environment-variables) for details).

### Step 4 — Set up MongoDB Atlas (free tier)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create a free M0 cluster.
2. Under **Database Access**, create a database user with read/write access.
3. Under **Network Access**, click **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`) for development.
4. Click **Connect** on your cluster → **Drivers** → copy the connection string.
5. Paste it into `.env` as `MONGODB_URI`, replacing `<password>` with your database user's password.

### Step 5 — Set up Redis Cloud (free tier)

1. Go to [app.redislabs.com](https://app.redislabs.com) and create a free database.
2. Copy the **Public endpoint** (host:port) and the **Default user password**.
3. Paste into `.env` as `REDIS_URL` in the format:  
   `redis://default:<password>@<host>:<port>`

### Step 6 — Run the server

```bash
npm run dev      # Development (nodemon, auto-restarts on file changes)
npm start        # Production
```

You should see:
```
ZiMart server running on port 5000
MongoDB connected: cluster0-shard-00-00.me0fez6.mongodb.net
Redis connected
```

### Step 7 — Seed the database

```bash
node scripts/seed.js
```

This creates **50 products**, **10 users** (3 sellers, 7 customers), **20 orders**, and matching reviews and inventory records.

### Step 8 — Verify the server is running

```bash
curl http://localhost:5000/health
# → {"status":"ok","message":"ZiMart API is running"}
```

---

## 5. Environment Variables

Copy `.env.example` to `.env` and fill in the values below. **Never commit your real `.env` file.**

| Variable | Required | Example | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Port the Express server listens on |
| `MONGODB_URI` | Yes | `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/zimart` | MongoDB Atlas connection string |
| `REDIS_URL` | Yes | `redis://default:pass@redis.xxx.com:11276` | Redis Cloud connection string |
| `JWT_SECRET` | Yes | `a-long-random-secret-string` | Secret used to sign and verify JWTs |
| `ALLOWED_ORIGINS` | Yes | `http://localhost:5173,http://localhost:5174` | Comma-separated list of CORS-allowed frontend origins |
| `NODE_ENV` | No | `development` | Set to `production` for stricter CORS |

---

## 6. Seeding the Database

```bash
node scripts/seed.js
```

**What the seed script creates:**

| Data | Count | Details |
|---|---|---|
| Categories | 3 | Electronics, Clothing, Food |
| Users | 10 | 3 sellers (Alice, Bob, Frank), 7 customers |
| Products | 50 | 25 Electronics, 10 Clothing, 15 Food — each with variants, attributes, and ratings |
| Inventory | 50 | One record per product, stock aggregated from variants |
| Orders | 20 | Random customers, 1–4 items each, mixed statuses |
| Reviews | ~12 | Generated only for Delivered orders |

All passwords: `Password123!`

---

## 7. API Documentation

Base URL: `http://localhost:5000`

Authentication: `Authorization: Bearer <jwt_token>`  
Guest cart: `X-Guest-Id: <8-64 char alphanumeric string>`

---

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user. Body: `{ name, email, password, role? }` |
| POST | `/api/auth/login` | Public (rate-limited: 10/60s) | Login. Returns `{ token, user }` |
| POST | `/api/auth/logout` | JWT | Revokes Redis session. Token is immediately invalidated. |
| GET | `/api/auth/profile` | JWT | Get own user profile |
| PUT | `/api/auth/profile` | JWT | Update name, addresses, payment preferences |
| POST | `/api/auth/wishlist/:productId` | JWT | Add product to wishlist |
| DELETE | `/api/auth/wishlist/:productId` | JWT | Remove product from wishlist |

**Register example:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "role": "customer"
}
```

---

### Products — `/api/products`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | Public | List products with filtering, search, sort, and pagination |
| GET | `/api/products/trending` | Public | Top 10 trending products (Redis Sorted Set) |
| GET | `/api/products/:id` | Public | Single product — served from Redis cache if warm |
| POST | `/api/products` | Seller / Admin | Create new product listing |
| PUT | `/api/products/:id` | Seller (own) / Admin | Update product — invalidates Redis cache entry |
| DELETE | `/api/products/:id` | Admin | Soft-delete product (sets `isActive: false`) |

**Product list query parameters:**

| Parameter | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20, max: 100) |
| `category` | ObjectId | Filter by category |
| `minPrice` | number | Minimum price (inclusive) |
| `maxPrice` | number | Maximum price (inclusive) |
| `search` | string | Full-text search on name, description, and tags |
| `sort` | string | Sort field (default: `createdAt`) |
| `order` | `asc` \| `desc` | Sort direction (default: `desc`) |

**Search example:**
```http
GET /api/products?search=laptop&category=<id>&minPrice=500&maxPrice=2000&sort=price&order=asc&page=1&limit=10
```

---

### Cart — `/api/cart`

Cart routes support both **authenticated users** (Bearer JWT) and **guest users** (`X-Guest-Id` header).

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/cart` | JWT or X-Guest-Id | Fetch cart items with running total |
| POST | `/api/cart` | JWT or X-Guest-Id | Add item to cart. Body: `{ productId, quantity }` |
| PUT | `/api/cart/:productId` | JWT or X-Guest-Id | Update item quantity. Body: `{ quantity }` |
| DELETE | `/api/cart/:productId` | JWT or X-Guest-Id | Remove single item from cart |
| DELETE | `/api/cart` | JWT or X-Guest-Id | Clear entire cart |
| GET | `/api/cart/recent` | JWT or X-Guest-Id | Recently viewed products (Redis List, max 10) |
| POST | `/api/cart/recent` | JWT or X-Guest-Id | Add product to recently viewed. Body: `{ productId }` |
| POST | `/api/cart/merge` | JWT | Merge guest cart into user cart after login. Body: `{ guestId }` |

**Guest cart example:**
```http
POST /api/cart
X-Guest-Id: my-browser-uuid-12345678
Content-Type: application/json

{ "productId": "<id>", "quantity": 2 }
```

**Merge guest cart after login:**
```http
POST /api/cart/merge
Authorization: Bearer <jwt>
Content-Type: application/json

{ "guestId": "my-browser-uuid-12345678" }
```

---

### Orders — `/api/orders`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/orders` | JWT (rate-limited: 5/60s) | Place order from cart — uses ACID transaction for stock decrement |
| GET | `/api/orders` | JWT | List own orders. Query: `?page=1&limit=10&status=Placed` |
| GET | `/api/orders/:id` | JWT | Single order detail |
| PUT | `/api/orders/:id/status` | Admin | Advance status: Placed → Confirmed → Shipped → Delivered |
| PUT | `/api/orders/:id/cancel` | JWT (customer) | Cancel own order (only while Placed or Confirmed) |

**Place order example:**
```http
POST /api/orders
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Thimphu",
    "country": "Bhutan"
  },
  "paymentMethod": "card"
}
```

**Order status workflow:**
```
Placed → Confirmed → Shipped → Delivered
   ↓          ↓
Cancelled  Cancelled
                           ↓
                        Returned
```

---

### Reviews — `/api/products/:productId/reviews`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/products/:productId/reviews` | Public | Paginated review list for a product |
| POST | `/api/products/:productId/reviews` | JWT | Submit a review (one per user per product). Body: `{ rating, comment }` |
| DELETE | `/api/products/:productId/reviews/:reviewId` | JWT | Delete own review (or any review if Admin) |

---

### Analytics — `/api/analytics` (Admin only)

| Method | Path | Description |
|---|---|---|
| GET | `/api/analytics/sales` | Monthly revenue, order count, and average order value |
| GET | `/api/analytics/sales/daily?month=YYYY-MM` | Daily revenue breakdown for a given month |
| GET | `/api/analytics/top-products` | Top 10 products by units sold (aggregation pipeline) |
| GET | `/api/analytics/low-stock` | Products at or below their low-stock threshold |
| GET | `/api/analytics/views-vs-purchases` | Unique views (HyperLogLog) vs purchases — with conversion rate |
| GET | `/api/analytics/leaderboard/buyers?month=YYYY-MM` | Top 10 buyers by spend (Redis Sorted Set) |
| GET | `/api/analytics/leaderboard/sellers?month=YYYY-MM` | Top 10 sellers by revenue (Redis Sorted Set) |
| GET | `/api/analytics/system-stats` | Live Redis INFO (memory, cache hit ratio, eviction policy) + MongoDB state |

---

### System

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | Public | Health check — returns `{ status: "ok" }` |
| GET | `/api/routes` | Public | Introspected list of all registered method + path combinations |

---

## 8. Redis Data Structures

| Structure | Key Pattern | TTL | Purpose |
|---|---|---|---|
| String | `session:{userId}` | 7 days | User session (JWT revocation on logout) |
| String | `product:{id}` | ~1 hour (jittered ±3 min) | Cached product document (cache-aside pattern) |
| String | `ratelimit:{ip}:{route}` | 60 s | Request counter for rate limiting |
| Hash | `cart:{userId}` | 7 days (sliding) | Authenticated user cart |
| Hash | `cart:guest:{guestId}` | 7 days (sliding) | Guest user cart |
| Sorted Set | `trending:products` | Persistent | Real-time product popularity (score = view count) |
| Sorted Set | `leaderboard:buyers:{YYYY-MM}` | 35 days | Top buyers by monthly spend |
| Sorted Set | `leaderboard:sellers:{YYYY-MM}` | 35 days | Top sellers by monthly revenue |
| HyperLogLog | `product:views:{id}` | Persistent | Unique visitor count per product (≤0.81% error) |
| List | `recent:{userId/guestId}` | 7 days (sliding) | Recently viewed products (max 10, LIFO) |

---

## 9. MongoDB Collections

| Collection | Documents | Key Design Decision |
|---|---|---|
| `users` | User accounts | Addresses and payment preferences **embedded** (always fetched together); wishlist **referenced** (product data changes independently) |
| `products` | Product catalogue | Variants and ratings **embedded** (intrinsic to product); category and seller **referenced** (shared entities) |
| `categories` | Category tree | Self-referencing `parentCategory` ObjectId enables arbitrarily deep hierarchies |
| `orders` | Order records | Items **embedded with price snapshot** (preserves purchase-time price even if product price changes later) |
| `reviews` | Product reviews | Separate collection (reviews are queried independently; a popular product could have thousands) |
| `inventories` | Stock levels | Separate from Product to allow atomic stock decrements without locking the large product document |

**Indexes:**

| Collection | Index | Type |
|---|---|---|
| Product | `name + description + tags` | Compound text |
| Product | `category + price` | Compound |
| Order | `userId + createdAt` | Compound |
| Order | `status` | Single-field |
| Review | `userId + productId` | Compound unique |
| Review | `productId + createdAt` | Compound |
| Category | `parentCategory` | Single-field |
| Inventory | `stock` | Single-field |

---

## 10. Test Credentials

After running `node scripts/seed.js`:

| Role | Email | Password |
|---|---|---|
| Seller | alice@zimart.com | Password123! |
| Seller | bob@zimart.com | Password123! |
| Seller | frank@zimart.com | Password123! |
| Customer | carol@zimart.com | Password123! |
| Customer | david@zimart.com | Password123! |
| Customer | eva@zimart.com | Password123! |
| Customer | grace@zimart.com | Password123! |
| Customer | henry@zimart.com | Password123! |
| Customer | iris@zimart.com | Password123! |
| Customer | jay@zimart.com | Password123! |

**To create an admin account:** Log in to MongoDB Atlas Compass or mongosh, find any user document, and set `role: "admin"`.

---

## 11. Screenshots

Screenshots are located in the `/screenshot` directory. See `report.md` for annotated versions with descriptions.

| Screenshot | Description |
|---|---|
| `postman-register.png` | User registration response |
| `postman-login.png` | Login response with JWT token |
| `postman-products.png` | Product listing with pagination |
| `postman-trending.png` | Trending products from Redis Sorted Set |
| `postman-order.png` | Successful order placement (ACID transaction) |
| `postman-order-rate-limit.png` | 429 response when order rate limit exceeded |
| `postman-rate-limit.png` | Login rate limit response |
| `mongodb-collections.png` | All 6 collections in MongoDB Atlas |
| `mongodb-indexes-products.png` | Compound and text indexes on products collection |
| `mongodb-product-document.png` | Sample product document with embedded variants |
| `mongodb-replica-set.png` | Atlas 3-node replica set status |
| `redis-all-keys.png` | All Redis key namespaces in RedisInsight |

---

## Project Structure

```
zimart-backend/
├── src/
│   ├── config/
│   │   ├── db.js          # MongoDB connection with retry and Google DNS override
│   │   └── redis.js       # ioredis singleton
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   ├── analyticsController.js
│   │   └── reviewController.js
│   ├── middleware/
│   │   ├── auth.js          # JWT verification + Redis session check
│   │   ├── optionalAuth.js  # JWT or X-Guest-Id for cart routes
│   │   ├── rateLimiter.js   # Redis INCR/EXPIRE rate limiting factory
│   │   └── roleCheck.js     # Role-based access control
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── Order.js
│   │   ├── Review.js
│   │   └── Inventory.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── product.js
│   │   ├── cart.js
│   │   ├── order.js
│   │   ├── analytics.js
│   │   └── review.js
│   └── index.js            # Express app entry point
├── scripts/
│   └── seed.js             # Seeds 50 products, 10 users, 20 orders
├── screenshot/             # Postman + Atlas + Redis screenshots for report
├── .env.example
├── report.md               # Full technical report (DBS302 submission)
├── package.json
└── README.md
```
