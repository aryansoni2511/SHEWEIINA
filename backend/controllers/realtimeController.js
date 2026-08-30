import jwt from 'jsonwebtoken';
import realtimeService from '../services/realtimeService.js';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Handle HTTP Server-Sent Events (SSE) Stream
 * Route: GET /api/v1/queue/stream?businessId=...&tokenId=...
 *
 * Query Params / Auth:
 * - tokenId: Optional. For customer watching their specific token.
 * - businessId: Optional. For business operator watching their queue.
 * - Authorization header or ?token= query param: Checked if businessId is supplied to enforce business tenant isolation.
 */
export function handleQueueStream(req, res) {
  const { tokenId } = req.query;
  let { businessId } = req.query;

  // If businessId is requested, verify the requester has access to that businessId
  // (via Authorization header or query param token)
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
      // Invalid token
    }
  }

  // Enforce business tenant isolation:
  // If businessId is supplied in query, it MUST match the authenticated business token.
  if (businessId) {
    if (!authorizedBusinessId || authorizedBusinessId !== businessId) {
      // Forbidden: cannot subscribe to another business's event stream
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Cannot subscribe to queue stream of another business',
      });
    }
  } else if (authorizedBusinessId) {
    businessId = authorizedBusinessId;
  }

  // Require at least a tokenId or an authorized businessId
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
    'X-Accel-Buffering': 'no', // Disable buffering for Nginx/proxies
  });

  // Flush headers immediately if method exists
  if (res.flushHeaders) {
    res.flushHeaders();
  }

  // Register client with realtimeService
  const clientId = realtimeService.registerClient({
    res,
    businessId,
    tokenId,
  });

  // Clean up on connection close
  req.on('close', () => {
    realtimeService.removeClient(clientId);
  });
}
