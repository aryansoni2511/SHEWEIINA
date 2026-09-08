import { Router } from 'express';
import {
  handleJoinQueue,
  handleGetTokenStatus,
  handleCancelToken,
  handleGetPublicQueueDisplay,
} from '../controllers/queueController.js';
import { handleQueueStream } from '../controllers/realtimeController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { queueJoinRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public Realtime Queue Event Stream (SSE)
router.get('/stream', handleQueueStream);

// Public Customer & Waiting Room Display Endpoints
router.get('/display/:businessId', handleGetPublicQueueDisplay);

// Queue join: apply the stricter 20/min per-IP rate limiter
router.post('/join', queueJoinRateLimiter, handleJoinQueue);

router.get('/status/:tokenId', handleGetTokenStatus);

// Protected Customer Token Cancellation Endpoint (Requires CUSTOMER role & token ownership)
router.post('/cancel', authenticateToken, requireRole('CUSTOMER'), handleCancelToken);

export default router;
