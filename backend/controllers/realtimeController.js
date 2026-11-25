import jwt from 'jsonwebtoken';
import realtimeService from '../services/realtimeService.js';
import ticketService from '../services/ticketService.js';
import { findTokenById, findUserById } from '../models/queueModel.js';
import { findHospitalTokenById } from '../models/hospitalModel.js';
import { findGovernmentTokenById } from '../models/governmentModel.js';
import { successResponse, errorResponse } from '../utils/response.js';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Resolve phone for user to verify ownership across guest & registered tokens
 */
async function getUserPhone(userId) {
  if (!userId) return null;
  try {
    const user = await findUserById(userId);
    return user?.phone || null;
  } catch {
    return null;
  }
}

/**
 * Authoritatively verifies that the authenticated user owns the requested token.
 * Searches across Salon/Clinic, Hospital OPD, and Government Services modules.
 */
async function resolveAndVerifyTokenOwnership(user, tokenId) {
  if (!tokenId) {
    return { authorized: false, status: 400, message: 'Token ID is required' };
  }

  const userPhone = user.phone || (await getUserPhone(user.userId));

  // 1. Check Salon / Clinic token
  const salonToken = await findTokenById(tokenId);
  if (salonToken) {
    const isOwner = (salonToken.user_id && String(salonToken.user_id) === String(user.userId)) ||
                    (userPhone && salonToken.customer_phone === userPhone);
    if (!isOwner) {
      return { authorized: false, status: 403, message: 'Forbidden: You do not own this queue token' };
    }
    return {
      authorized: true,
      token: salonToken,
      module: 'salon',
      businessId: salonToken.business_id,
      queueId: salonToken.queue_id,
    };
  }

  // 2. Check Hospital OPD token
  const hospToken = await findHospitalTokenById(tokenId);
  if (hospToken) {
    const isOwner = (hospToken.user_id && String(hospToken.user_id) === String(user.userId)) ||
                    (userPhone && hospToken.patient_phone === userPhone);
    if (!isOwner) {
      return { authorized: false, status: 403, message: 'Forbidden: You do not own this OPD token' };
    }
    return {
      authorized: true,
      token: hospToken,
      module: 'hospital',
      businessId: hospToken.hospital_id,
      queueId: hospToken.queue_id,
    };
  }

  // 3. Check Government Services token
  const govtToken = await findGovernmentTokenById(tokenId);
  if (govtToken) {
    const isOwner = (govtToken.user_id && String(govtToken.user_id) === String(user.userId)) ||
                    (userPhone && govtToken.citizen_phone === userPhone);
    if (!isOwner) {
      return { authorized: false, status: 403, message: 'Forbidden: You do not own this government token' };
    }
    return {
      authorized: true,
      token: govtToken,
      module: 'government',
      businessId: govtToken.centre_id,
      queueId: govtToken.counter_id,
    };
  }

  return { authorized: false, status: 404, message: 'Token not found' };
}

/**
 * Exchange authenticated request for a short-lived single-use SSE stream ticket
 * Route: POST /api/v1/queue/stream-ticket (Protected by authenticateToken)
 */
export async function handleCreateStreamTicket(req, res, next) {
  try {
    const { tokenId, businessId } = req.body;
    const user = req.user;

    if (!tokenId && !businessId) {
      return errorResponse(res, 'Must provide tokenId or businessId to request a stream ticket', 400);
    }

    // 1. Business / Operator stream ticket request
    if (businessId) {
      if (user.role !== 'BUSINESS') {
        return errorResponse(res, 'Forbidden: Customer accounts cannot subscribe to business stream', 403);
      }
      const authorizedBizId = user.businessId || user.hospitalId || user.centreId;
      if (!authorizedBizId || String(authorizedBizId) !== String(businessId)) {
        return errorResponse(res, 'Forbidden: You cannot subscribe to another business queue stream', 403);
      }
      const ticket = ticketService.createTicket({
        userId: user.userId,
        role: user.role,
        businessId,
        module: user.hospitalId ? 'hospital' : (user.centreId ? 'government' : 'salon'),
      });
      return successResponse(res, 'Stream ticket issued', { ticket: ticket.id, expiresIn: 60 });
    }

    // 2. Customer token stream ticket request
    const authCheck = await resolveAndVerifyTokenOwnership(user, tokenId);
    if (!authCheck.authorized) {
      return errorResponse(res, authCheck.message, authCheck.status || 403);
    }

    const ticket = ticketService.createTicket({
      userId: user.userId,
      role: user.role,
      tokenId: authCheck.token.id,
      businessId: authCheck.businessId,
      queueId: authCheck.queueId,
      module: authCheck.module,
    });

    return successResponse(res, 'Stream ticket issued', { ticket: ticket.id, expiresIn: 60 });
  } catch (err) {
    next(err);
  }
}

/**
 * Handle HTTP Server-Sent Events (SSE) Stream
 * Route: GET /api/v1/queue/stream?ticket=...&tokenId=...&businessId=...&public=true
 *
 * Security Model:
 * 1. Single-Use Ticket: EventSource passes ?ticket=<ticketId> (obtained via POST /stream-ticket).
 * 2. Direct Bearer Header: HTTP clients pass Authorization: Bearer <jwt> with tokenId or businessId.
 * 3. Public Display TV: Unauthenticated query ?public=true&businessId=... (strictly scoped, zero PII).
 * 4. All other unauthenticated or unauthorized requests are rejected (401 / 403).
 */
export async function handleQueueStream(req, res) {
  const { ticket, tokenId } = req.query;
  let { businessId } = req.query;
  const isPublicReq = req.query.public === 'true' || req.query.isPublic === 'true';

  let resolvedTokenId = null;
  let resolvedBusinessId = null;
  let resolvedQueueId = null;
  let resolvedModule = 'salon';
  let isPublicDisplay = false;

  // 1. Ticket-based authentication (Native EventSource path)
  if (ticket) {
    const consumed = ticketService.consumeTicket(ticket);
    if (!consumed) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid or expired stream ticket',
      });
    }
    resolvedTokenId = consumed.tokenId;
    resolvedBusinessId = consumed.businessId;
    resolvedQueueId = consumed.queueId;
    resolvedModule = consumed.module || 'salon';
  }
  // 2. Direct Bearer token or Authorization Header
  else {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const bearerToken = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.slice(7) : req.query.token;

    if (bearerToken && JWT_SECRET) {
      let decoded;
      try {
        decoded = jwt.verify(bearerToken, JWT_SECRET);
      } catch (e) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Invalid authentication token',
        });
      }

      // Business subscription
      if (businessId) {
        if (decoded.role !== 'BUSINESS') {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: Customers cannot subscribe to business streams',
          });
        }
        const userBizId = decoded.businessId || decoded.hospitalId || decoded.centreId;
        if (!userBizId || String(userBizId) !== String(businessId)) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: Cannot subscribe to queue stream of another business',
          });
        }
        resolvedBusinessId = businessId;
        resolvedModule = decoded.hospitalId ? 'hospital' : (decoded.centreId ? 'government' : 'salon');
      }
      // Customer subscription with Bearer token
      else if (tokenId) {
        const authCheck = await resolveAndVerifyTokenOwnership(decoded, tokenId);
        if (!authCheck.authorized) {
          return res.status(authCheck.status || 403).json({
            success: false,
            message: authCheck.message,
          });
        }
        resolvedTokenId = authCheck.token.id;
        resolvedBusinessId = authCheck.businessId;
        resolvedQueueId = authCheck.queueId;
        resolvedModule = authCheck.module;
      }
    }
    // 3. Public Display TV waiting room (unauthenticated, strictly businessId only)
    else if (isPublicReq && businessId && !tokenId) {
      resolvedBusinessId = businessId;
      isPublicDisplay = true;
    }
    // 4. Missing parameter validation
    else if (!tokenId && !businessId) {
      return res.status(400).json({
        success: false,
        message: 'Bad Request: Must provide either tokenId or authorized businessId to subscribe',
      });
    }
    // 5. Unauthenticated customer or operator connection attempt -> REJECT
    else {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required. Please provide a valid stream ticket or authorization token.',
      });
    }
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
    businessId: resolvedBusinessId,
    tokenId: resolvedTokenId,
    queueId: resolvedQueueId,
    module: resolvedModule,
    isPublic: isPublicDisplay,
  });

  // Clean up on connection close
  req.on('close', () => {
    realtimeService.removeClient(clientId);
  });
}
