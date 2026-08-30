import { Router } from 'express';
import { handleJoinQueue, handleGetTokenStatus, handleCancelToken } from '../controllers/queueController.js';
import { handleQueueStream } from '../controllers/realtimeController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Public Realtime Queue Event Stream (SSE)
router.get('/stream', handleQueueStream);

// Public Customer Queue Endpoints
router.post('/join', handleJoinQueue);
router.get('/status/:tokenId', handleGetTokenStatus);

// Protected Customer Token Cancellation Endpoint (Requires CUSTOMER role & token ownership)
router.post('/cancel', authenticateToken, requireRole('CUSTOMER'), handleCancelToken);

export default router;
