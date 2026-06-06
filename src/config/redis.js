const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
  lazyConnect: true,
  // Send TCP keepalive every 15s — prevents Redis Cloud from dropping idle connections (ECONNRESET)
  keepAlive: 15000,
  connectTimeout: 10000,
  // Exponential backoff retry: 200ms, 400ms, 800ms ... capped at 5s
  retryStrategy: (times) => Math.min(times * 200, 5000),
  // Reconnect automatically on ECONNRESET and ECONNREFUSED
  reconnectOnError: (err) => ['ECONNRESET', 'ECONNREFUSED'].includes(err.code),
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error(`Redis connection error: ${err.message}`));

redis.connect().catch((err) => {
  console.error(`Redis failed to connect: ${err.message}`);
});

module.exports = redis;
