/**
 * Standardized API Response Helper
 */

export function successResponse(res, message, data = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

export function errorResponse(res, message, statusCode = 500, details = null) {
  const code = (typeof details === 'object' && details !== null && details.code) ? details.code : undefined;
  return res.status(statusCode).json({
    success: false,
    message,
    ...(code && { code }),
    ...(details && { details }),
    timestamp: new Date().toISOString(),
  });
}
