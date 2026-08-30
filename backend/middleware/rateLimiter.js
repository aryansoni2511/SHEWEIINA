/**
 * Rate Limiter Middleware -- Shewwina Backend
 *
 * Simple in-memory sliding-window rate limiter with no external dependencies.
 * Suitable for single-server MVP. For multi-server deployment, replace the
 * requestStore Map with a Redis adapter.
 */

// In-memory store: Map<"ip:limiterId", number[]>
const requestStore = new Map();

let lastCleanup = Date.now();
function maybeCleanupStore() {
  const now = Date.now();
  if (now - lastCleanup < 60000) return;
  lastCleanup = now;
  const cutoff = now - 60000;
  for (const [key, timestamps] of requestStore.entries()) {
    const fresh = timestamps.filter((t) => t > cutoff);
    if (fresh.length === 0) {
      requestStore.delete(key);
    } else {
      requestStore.set(key, fresh);
    }
  }
}

function createRateLimiter({ id, maxRequests, windowMs, message }) {
  const msg = message || 'Too many requests. Please wait before trying again.';

  return function rateLimiterMiddleware(req, res, next) {
    maybeCleanupStore();

    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';

    const key = `${ip}:${id}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    const timestamps = (requestStore.get(key) || []).filter((t) => t > windowStart);

    if (timestamps.length >= maxRequests) {
      const oldestTimestamp = timestamps[0];
      const retryAfterSec = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

      res.setHeader('Retry-After', retryAfterSec);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil((oldestTimestamp + windowMs) / 1000));

      return res.status(429).json({
        success: false,
        message: msg,
        retryAfterSeconds: retryAfterSec,
      });
    }

    timestamps.push(now);
    requestStore.set(key, timestamps);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - timestamps.length);

    next();
  };
}

/**
 * Auth Rate Limiter: 10 requests per minute per IP
 * Applied to: /api/v1/auth/*
 */
export const authRateLimiter = createRateLimiter({
  id: 'auth',
  maxRequests: 10,
  windowMs: 60000,
  message: 'Too many authentication attempts. Please wait 1 minute before trying again.',
});

/**
 * Queue Join Rate Limiter: 20 requests per minute per IP
 * Applied to: POST /api/v1/queue/join
 */
export const queueJoinRateLimiter = createRateLimiter({
  id: 'queue-join',
  maxRequests: 20,
  windowMs: 60000,
  message: 'Too many queue join attempts. Please wait before trying again.',
});

/**
 * General Rate Limiter: 100 requests per minute per IP
 * Applied to: all other routes
 */
export const generalRateLimiter = createRateLimiter({
  id: 'general',
  maxRequests: 100,
  windowMs: 60000,
  message: 'Too many requests. Please slow down.',
});

export default {
  authRateLimiter,
  queueJoinRateLimiter,
  generalRateLimiter,
};
