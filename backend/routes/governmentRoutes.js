import { Router } from 'express';
import {
  handleSearchCentres,
  handleGetCentreDetails,
  handleGetServices,
  handleGetServiceDetails,
  handleRegisterCentre,
  handleRequestToken,
  handleGetTokenStatus,
  handleGetDashboard,
  handleCreateCounter,
  handleToggleCounter,
  handleCallNext,
  handleCompleteToken,
  handleSkipToken,
} from '../controllers/governmentController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// ─── Public Government Services & Centre Discovery ───────────────────────────
router.get('/services', handleGetServices);
router.get('/services/:slug', handleGetServiceDetails);
router.get('/centres', handleSearchCentres);
router.get('/centres/:centreId', handleGetCentreDetails);
router.get('/token/:tokenId', handleGetTokenStatus);
router.post('/register-centre', handleRegisterCentre);
router.post('/token/join', handleRequestToken);

// ─── Protected Centre Administration Endpoints ──────────────────────────────
router.get('/dashboard', authenticateToken, requireRole('BUSINESS'), handleGetDashboard);
router.post('/counters', authenticateToken, requireRole('BUSINESS'), handleCreateCounter);
router.post('/counters/toggle', authenticateToken, requireRole('BUSINESS'), handleToggleCounter);

// ─── Queue Operations ────────────────────────────────────────────────────────
router.post('/queue/next', authenticateToken, requireRole('BUSINESS'), handleCallNext);
router.post('/queue/complete', authenticateToken, requireRole('BUSINESS'), handleCompleteToken);
router.post('/queue/skip', authenticateToken, requireRole('BUSINESS'), handleSkipToken);

export default router;
