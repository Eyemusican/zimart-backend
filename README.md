# ZiMart

Production-ready e-commerce backend API built with Node.js, Express, MongoDB, and Redis.

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB
- Redis

### Installation

```bash
npm install
```

Copy the environment file and fill in your values:

```bash
cp .env.example .env
```

### Running

```bash
# Development
npm run dev

# Production
npm start
```

### Seed Database

```bash
node scripts/seed.js
```

## Project Structure

```
zimart/
├── src/
│   ├── config/         # DB and Redis connection configs
│   ├── controllers/    # Route handler logic
│   ├── middleware/     # Auth, error handling, validation
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routers
│   └── index.js        # App entry point
├── scripts/
│   └── seed.js         # Database seeder
├── .env.example
└── package.json
```

## API

| Method | Path      | Description        |
|--------|-----------|--------------------|
| GET    | /health   | Health check       |


![alt text](image.png)