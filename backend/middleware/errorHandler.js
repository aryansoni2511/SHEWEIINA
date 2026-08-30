import { errorResponse } from '../utils/response.js';

/**
 * 404 Not Found Handler
 */
export function notFoundHandler(req, res, next) {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

/**
 * Global Error Handler
 *
 * Known custom errors (ValidationError, NotFoundError, ForbiddenError, etc.)
 * always have a `statusCode` set and a safe, user-facing `message`.
 * These are propagated to the client as-is.
 *
 * Unexpected errors (statusCode not set, i.e. true 500s) only receive a
 * generic message to avoid leaking internal implementation details.
 */
export function globalErrorHandler(err, req, res, next) {
  const isKnownError = typeof err.statusCode === 'number' && err.statusCode < 500;

  if (isKnownError) {
    // Known business logic error — safe to show the message to the client
    return errorResponse(res, err.message, err.statusCode);
  }

  // Unknown/unexpected error — log full details internally, show generic response
  console.error('[ERROR] Unhandled exception:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  return errorResponse(res, 'An unexpected error occurred. Please try again.', 500);
}
