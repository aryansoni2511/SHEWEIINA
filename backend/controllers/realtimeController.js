import jwt from 'jsonwebtoken';
import realtimeService from '../services/realtimeService.js';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Handle HTTP Server-Sent Events (SSE) Stream
 * Route: GET /api/v1/queue/stream?businessId=...&tokenId=...&public=true
 *
 * Query Params / Auth:
 * - tokenId: Optional. For customer watching their specific token.
 * - businessId: Optional. For business operator or public TV waiting room display.
 * - public / isPublic: 'true' for unauthenticated waiting room TV display.
 * - Authorization header or ?token= query param: Checked if businessId is supplied to enforce tenant isolation.
 */
export function handleQueueStream(req, res) {
  const { tokenId } = req.query;
  let { businessId } = req.query;
  const isPublicReq = req.query.public === 'true' || req.query.isPublic === 'true';

  let authorizedBusinessId = null;
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.slice(7) 
    : req.query.token;

  if (token && JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role === 'BUSINESS' && decoded.businessId) {
        authorizedBusinessId = decoded.businessId;
      }
    } catch (e) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token supplied',
      });
    }
  }

  // Enforce tenant isolation when an authenticated token is provided:
  if (businessId && token) {
    if (!authorizedBusinessId || authorizedBusinessId !== businessId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Cannot subscribe to queue stream of another business',
      });
    }
  }

  let subscriberType = 'customer';
  if (businessId) {
    if (authorizedBusinessId === businessId) {
      subscriberType = 'business';
    } else if (isPublicReq || !token) {
      subscriberType = 'public_display';
    }
  } else if (authorizedBusinessId) {
    businessId = authorizedBusinessId;
    subscriberType = 'business';
  }

  // Require at least a tokenId or a businessId
  if (!tokenId && !businessId) {
    return res.status(400).json({
      success: false,
      message: 'Bad Request: Must provide either tokenId or authorized businessId to subscribe',
    });
  }

  // Set standard SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  if (res.flushHeaders) {
    res.flushHeaders();
  }

  // Register client with realtimeService
  const clientId = realtimeService.registerClient({
    res,
    businessId,
    tokenId,
    isPublic: subscriberType === 'public_display',
  });

  // Clean up on connection close
  req.on('close', () => {
    realtimeService.removeClient(clientId);
  });
}
