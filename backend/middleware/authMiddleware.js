import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to authenticate requests via JWT in Authorization header.
 * Expects header format: Authorization: Bearer <token>
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing. Please log in to access this resource.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      businessId: decoded.businessId || null,
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.',
    });
  }
}

/**
 * Middleware to authorize requests based on user role.
 * Example: requireRole('BUSINESS') or requireRole('BUSINESS', 'ADMIN')
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires role: ${allowedRoles.join(' or ')}.`,
      });
    }

    next();
  };
}

/**
 * Middleware to enforce business tenant isolation.
 * Verifies that the authenticated business user can only access their own business queue resources.
 */
export function requireBusinessTenant(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  const requestedBusinessId = req.query.businessId || req.body?.businessId || req.params?.businessId;

  // If request explicitly targets a business, ensure it matches the authenticated user's assigned businessId
  if (requestedBusinessId && req.user.businessId && requestedBusinessId !== req.user.businessId) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You cannot view or modify another business's queue.",
    });
  }

  next();
}

export default {
  authenticateToken,
  requireRole,
  requireBusinessTenant,
};
