const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', (err) => {
  console.error(`Redis connection error: ${err.message}`);
});

redis.connect().catch((err) => {
  console.error(`Redis failed to connect: ${err.message}`);
});

module.exports = redis;
