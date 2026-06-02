# ZiMart Backend API

> Production-ready e-commerce backend built with Node.js, Express, MongoDB Atlas, and Redis Cloud.

## Tech Stack

- Runtime: Node.js + Express
- Primary Database: MongoDB Atlas (3-node replica set)
- Cache/Session Store: Redis Cloud
- Authentication: JWT + bcryptjs
- Security: Helmet, CORS, Rate Limiting

## Features

- JWT Authentication with Redis session management
- Product catalog with full-text search, filtering, pagination
- Redis cache-aside pattern for product details (1hr TTL)
- Shopping cart stored in Redis Hash (7-day TTL)
- Recently viewed products using Redis List (capped at 10)
- Trending products leaderboard using Redis Sorted Set
- Unique visitor tracking using Redis HyperLogLog
- Rate limiting using Redis String (INCR/EXPIRE)
- ACID transactions for order placement + stock decrement
- MongoDB aggregation pipelines for sales analytics
- Role-based access control (customer/seller/admin)
- 3-node MongoDB replica set for high availability

## Prerequisites

- Node.js >= 18
- MongoDB Atlas account (free tier)
- Redis Cloud account (free tier)

## Installation

bash
npm install
cp .env.example .env

Fill in .env with your MongoDB URI, Redis URL, and JWT secret.

## Running

bash
npm run dev # Development with nodemon
npm start # Production
node scripts/seed.js # Seed database with test data

## Test Credentials (after seeding)

All passwords: Password123!

- Seller: alice@zimart.com
- Seller: bob@zimart.com
- Customer: carol@zimart.com
- Admin: promote via MongoDB Atlas

## API Endpoints

### Auth

| Method | Path               | Description   | Auth |
| ------ | ------------------ | ------------- | ---- |
| POST   | /api/auth/register | Register user | No   |
| POST   | /api/auth/login    | Login         | No   |
| POST   | /api/auth/logout   | Logout        | Yes  |
| GET    | /api/auth/profile  | Get profile   | Yes  |

### Products

| Method | Path              | Description                              | Auth         |
| ------ | ----------------- | ---------------------------------------- | ------------ |
| GET    | /api/products     | List products (search, filter, paginate) | No           |
| GET    | /api/products/:id | Get product (cached in Redis)            | No           |
| POST   | /api/products     | Create product                           | Seller/Admin |
| PUT    | /api/products/:id | Update product                           | Seller/Admin |
| DELETE | /api/products/:id | Delete product                           | Admin        |

### Cart

| Method | Path                 | Description     | Auth |
| ------ | -------------------- | --------------- | ---- |
| GET    | /api/cart            | Get cart        | Yes  |
| POST   | /api/cart            | Add to cart     | Yes  |
| PUT    | /api/cart/:productId | Update quantity | Yes  |
| DELETE | /api/cart/:productId | Remove item     | Yes  |
| DELETE | /api/cart            | Clear cart      | Yes  |
| GET    | /api/cart/recent     | Recently viewed | Yes  |

### Orders

| Method | Path                   | Description                    | Auth  |
| ------ | ---------------------- | ------------------------------ | ----- |
| POST   | /api/orders            | Place order (ACID transaction) | Yes   |
| GET    | /api/orders            | My orders                      | Yes   |
| GET    | /api/orders/:id        | Order details                  | Yes   |
| PUT    | /api/orders/:id/status | Update status                  | Admin |

### Analytics

| Method | Path                        | Description          | Auth  |
| ------ | --------------------------- | -------------------- | ----- |
| GET    | /api/analytics/sales        | Monthly sales report | Admin |
| GET    | /api/analytics/top-products | Top 10 products      | Admin |

## Redis Data Structures Used

| Structure   | Key Pattern            | Purpose                  |
| ----------- | ---------------------- | ------------------------ |
| Hash        | session:{userId}       | User sessions            |
| String      | product:{id}           | Cached product details   |
| Sorted Set  | trending:products      | Trending leaderboard     |
| HyperLogLog | visitors:{productId}   | Unique visitor count     |
| List        | recent:{userId}        | Recently viewed products |
| String      | ratelimit:{ip}:{route} | Rate limiting            |

## MongoDB Collections

| Collection  | Documents | Purpose                        |
| ----------- | --------- | ------------------------------ |
| users       | 10        | Customer/seller/admin accounts |
| products    | 40        | Product catalog                |
| orders      | 20        | Order records                  |
| categories  | 3         | Product categories             |
| reviews     | 17        | Product reviews                |
| inventories | 40        | Stock levels                   |
