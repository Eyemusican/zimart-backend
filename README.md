# ZiMart Backend API

> Production-ready e-commerce backend built with Node.js, Express, MongoDB Atlas, and Redis Cloud.

## Tech Stack

- Runtime: Node.js + Express 5
- Primary Database: MongoDB Atlas (3-node replica set)
- Cache / Session Store: Redis Cloud
- Authentication: JWT + bcryptjs
- Security: Helmet, CORS, Rate Limiting

## Features

- JWT Authentication with Redis session management and revocation
- Guest cart support via `X-Guest-Id` header (Redis Hash, no login required)
- Product catalogue with full-text search, filtering, sorting, and pagination
- Redis cache-aside pattern for product details (1 hr TTL, explicit invalidation on update)
- Shopping cart stored in Redis Hash (7-day sliding TTL)
- Recently viewed products using Redis List (capped at 10, LPUSH + LTRIM)
- Trending products leaderboard using Redis Sorted Set (ZINCRBY / ZREVRANGE)
- Monthly buyer and seller leaderboards using Redis Sorted Sets
- Unique visitor tracking using Redis HyperLogLog (PFADD / PFCOUNT)
- Rate limiting using Redis String counters (INCR / EXPIRE)
- ACID transactions for order placement + atomic stock decrement
- MongoDB aggregation pipelines for sales analytics, top products, low-stock alerts
- Most-viewed vs most-purchased conversion-rate analysis
- Role-based access control (customer / seller / admin)
- MongoDB replica set for high availability; Redis Cloud managed HA

## Prerequisites

- Node.js >= 18
- MongoDB Atlas account (free tier works)
- Redis Cloud account (free tier works)

## Installation

```bash
npm install
cp .env.example .env
```

Fill in `.env` with your MongoDB URI, Redis URL, and JWT secret.

## Running

```bash
npm run dev          # Development with nodemon
npm start            # Production
node scripts/seed.js # Seed database with 50 products, 10 users, 20 orders
```

## Test Credentials (after seeding)

All passwords: `Password123!`

| Role | Email |
|------|-------|
| Seller | alice@zimart.com |
| Seller | bob@zimart.com |
| Seller | frank@zimart.com |
| Customer | carol@zimart.com |
| Customer | david@zimart.com |
| Admin | Promote any user via MongoDB Atlas: set `role: "admin"` |

## API Endpoints

### Auth

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/auth/register | Register user (customer or seller) | No |
| POST | /api/auth/login | Login — returns JWT | No (rate-limited) |
| POST | /api/auth/logout | Revoke Redis session | JWT |
| GET | /api/auth/profile | Fetch own profile | JWT |

### Products

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/products | List with search, filter, sort, paginate | No |
| GET | /api/products/trending | Top 10 trending (Redis Sorted Set) | No |
| GET | /api/products/:id | Single product (Redis cache-aside) | No |
| POST | /api/products | Create product listing | Seller / Admin |
| PUT | /api/products/:id | Update product (invalidates cache) | Seller (own) / Admin |
| DELETE | /api/products/:id | Soft-delete product | Admin |

### Cart (Guest + Authenticated)

Cart routes accept either a `Bearer` JWT or an `X-Guest-Id` header for guest shoppers.

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/cart | Fetch cart with total | JWT or X-Guest-Id |
| POST | /api/cart | Add or increment item | JWT or X-Guest-Id |
| PUT | /api/cart/:productId | Update item quantity | JWT or X-Guest-Id |
| DELETE | /api/cart/:productId | Remove single item | JWT or X-Guest-Id |
| DELETE | /api/cart | Clear entire cart | JWT or X-Guest-Id |
| GET | /api/cart/recent | Recently viewed (Redis List) | JWT or X-Guest-Id |
| POST | /api/cart/recent | Add to recently viewed | JWT or X-Guest-Id |
| POST | /api/cart/merge | Merge guest cart into user cart after login | JWT |

**Guest cart usage:**
```http
POST /api/cart
X-Guest-Id: my-browser-uuid-12345678
Content-Type: application/json

{ "productId": "<id>", "quantity": 1 }
```

### Orders

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/orders | Place order (ACID transaction) | JWT (rate-limited) |
| GET | /api/orders | My orders with pagination | JWT |
| GET | /api/orders/:id | Order detail | JWT |
| PUT | /api/orders/:id/status | Advance status state machine | Admin |

### Analytics

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/analytics/sales | Monthly revenue aggregation | Admin |
| GET | /api/analytics/top-products | Top 10 products by units sold | Admin |
| GET | /api/analytics/low-stock | Products at or below low-stock threshold | Admin |
| GET | /api/analytics/views-vs-purchases | Most-viewed vs most-purchased with conversion rate | Admin |
| GET | /api/analytics/leaderboard/buyers?month=YYYY-MM | Top 10 buyers by spend (Redis) | Admin |
| GET | /api/analytics/leaderboard/sellers?month=YYYY-MM | Top 10 sellers by revenue (Redis) | Admin |

### System

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| GET | /api/routes | All registered routes (introspected) |

## Redis Data Structures Used

| Structure | Key Pattern | Purpose |
|-----------|-------------|---------|
| String | `session:{userId}` | User session (JWT revocation) |
| String | `product:{id}` | Cached product document (1 hr TTL) |
| String | `ratelimit:{ip}:{route}` | Rate limiting counter |
| Hash | `cart:{userId}` | Authenticated user cart |
| Hash | `cart:guest:{guestId}` | Guest user cart |
| Sorted Set | `trending:products` | Real-time trending leaderboard |
| Sorted Set | `leaderboard:buyers:{YYYY-MM}` | Monthly top buyers by spend |
| Sorted Set | `leaderboard:sellers:{YYYY-MM}` | Monthly top sellers by revenue |
| HyperLogLog | `product:views:{id}` | Unique visitor count per product |
| List | `recent:{userId/guestId}` | Recently viewed products (max 10) |

## MongoDB Collections

| Collection | Purpose |
|------------|---------|
| users | Customer / seller / admin accounts |
| products | Product catalogue (flexible `attributes` field) |
| categories | Hierarchical category tree (self-reference) |
| orders | Order records with embedded item snapshots |
| reviews | Product reviews (one per user per product) |
| inventories | Stock levels (separate from Product for write isolation) |

## Screenshots

See `/screenshot` directory and `report.md` for full documentation with diagrams.
