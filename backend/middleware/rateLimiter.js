/**
 * Shewwina — Rate Limiter Middleware
 *
 * Implements a sliding-window in-memory rate limiter.
 * Returns HTTP 429 with Retry-After header and { success: false, message } JSON body.
 *
 * Limits:
 * - authRateLimiter:       10 requests / 60s per IP (login, register)
 * - queueJoinRateLimiter:  20 requests / 60s per IP (queue join)
 * - generalRateLimiter:   100 requests / 60s per IP (all other routes)
 *
 * NOTE: This is an in-memory implementation — not suitable for multi-instance deployments.
 * Replace with Redis-backed rate limiter before horizontal scaling.
 */

// store: Map<ip, { count: number, windowStart: number }>
const stores = {
  auth: new Map(),
  queueJoin: new Map(),
  general: new Map(),
};

/**
 * Clear all in-memory rate-limit stores.
 * ONLY for use in tests — resets state so tests do not bleed into each other.
 */
export function clearAllRateLimitStores() {
  stores.auth.clear();
  stores.queueJoin.clear();
  stores.general.clear();
}

function createRateLimiter({ windowMs, max, store, message }) {
  return function rateLimiterMiddleware(req, res, next) {
    // Use X-Forwarded-For if behind a proxy; fall back to socket address
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now - entry.windowStart > windowMs) {
      // New window
      store.set(ip, { count: 1, windowStart: now });
      res.set('X-RateLimit-Limit', String(max));
      res.set('X-RateLimit-Remaining', String(max - 1));
      res.set('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));
      return next();
    }

    if (entry.count >= max) {
      const retryAfterSeconds = Math.ceil((windowMs - (now - entry.windowStart)) / 1000);
      res.set('Retry-After', String(retryAfterSeconds));
      res.set('X-RateLimit-Limit', String(max));
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', String(Math.ceil((entry.windowStart + windowMs) / 1000)));
      return res.status(429).json({
        success: false,
        message: message || `Too many requests. Please wait ${retryAfterSeconds} seconds before trying again.`,
      });
    }

    entry.count += 1;
    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));
    res.set('X-RateLimit-Reset', String(Math.ceil((entry.windowStart + windowMs) / 1000)));
    return next();
  };
}

export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  store: stores.auth,
  message: 'Too many authentication attempts. Please try again in a minute.',
});

export const queueJoinRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  store: stores.queueJoin,
  message: 'Too many queue join requests. Please wait before trying again.',
});

export const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  store: stores.general,
  message: 'Too many requests. Please slow down.',
});

export default { authRateLimiter, queueJoinRateLimiter, generalRateLimiter };
