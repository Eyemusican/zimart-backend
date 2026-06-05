const jwt = require('jsonwebtoken');
const redis = require('../config/redis');

// Middleware that accepts either an authenticated user OR a guest session.
// Sets req.cartId to the appropriate namespace:
//   authenticated → req.cartId = userId  (string)
//   guest         → req.cartId = 'guest:{guestId}'
// Also sets req.user for authenticated requests so downstream role checks work.
//
// Guest callers must supply an X-Guest-Id header: an 8–64 character alphanumeric
// string (no spaces, no path separators). The client is responsible for generating
// and persisting this ID (e.g., stored in localStorage).
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const session = await redis.get(`session:${decoded.id}`);
      if (session) {
        req.user   = decoded;
        req.cartId = decoded.id;
        return next();
      }
    } catch (_) {
      // Token invalid or expired — fall through to guest path
    }
  }

  const guestId = req.headers['x-guest-id'];
  if (guestId && /^[a-zA-Z0-9_-]{8,64}$/.test(guestId)) {
    req.cartId = `guest:${guestId}`;
    return next();
  }

  return res.status(401).json({
    message: 'Provide a Bearer token (logged-in user) or an X-Guest-Id header (guest)',
  });
};

module.exports = optionalAuth;
