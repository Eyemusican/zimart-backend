const redis = require('../config/redis');

// Factory that returns an Express middleware enforcing a request-count limit
// over a sliding fixed window stored as a Redis String.
//
// Algorithm — INCR + conditional EXPIRE:
//   1. INCR the key.  If the key didn't exist, Redis creates it with value 1.
//   2. Only set EXPIRE when count === 1 (first hit in the window).
//      Setting it on every request would keep resetting the window, allowing
//      unlimited requests as long as they keep arriving before expiry.
//   3. If count exceeds the limit, read TTL and return 429 with Retry-After.
//
// Key pattern: ratelimit:{ip}:{route}  — scoped per client IP and endpoint
// so a burst on /login does not consume the budget for /orders and vice versa.
const createRateLimiter = (limit, windowSecs) => async (req, res, next) => {
  try {
    const ip    = req.headers['x-forwarded-for']?.split(',')[0].trim() ?? req.ip ?? 'unknown';
    const route = req.path.replaceAll('/', '_').replace(/^_/, '');
    const key   = `ratelimit:${ip}:${route}`;

    const count = await redis.incr(key);

    // EXPIRE is set only once — on the request that creates the key (count === 1).
    // This starts the window at the first request, not at every request.
    if (count === 1) {
      await redis.expire(key, windowSecs);
    }

    if (count > limit) {
      const retryAfter = await redis.ttl(key);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
        retryAfter,
      });
    }

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', limit - count);
    res.setHeader('X-RateLimit-Reset', windowSecs);

    next();
  } catch (err) {
    // If Redis is unavailable, fail open rather than blocking all traffic.
    console.error('Rate limiter error:', err.message);
    next();
  }
};

// 10 requests per 60 s on authentication endpoints
const loginRateLimiter = createRateLimiter(10, 60);

// 5 requests per 60 s on order placement (prevents checkout abuse)
const orderRateLimiter = createRateLimiter(5, 60);

module.exports = { loginRateLimiter, orderRateLimiter };
