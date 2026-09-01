import { Router } from 'express';
import {
  handleGetBusinessQueue,
  handleCallNextCustomer,
  handleGetBusinessServices,
  handleCompleteService,
  handleGetBusinessProfile,
  handleUpdateBusinessProfile,
  handleCreateBusinessService,
  handleUpdateBusinessService,
  handleToggleServiceStatus,
  handleGetQueueSettings,
  handleUpdateQueueSettings,
  handleSkipToken,
  handleTestAlert,
} from '../controllers/businessQueueController.js';
import { authenticateToken, requireRole, requireBusinessTenant } from '../middleware/authMiddleware.js';

const router = Router();

// Public Business Services lookup (for customers joining queue)
router.get('/services', handleGetBusinessServices);

// Protected Business Profile Endpoints (Requires BUSINESS role)
router.get('/profile', authenticateToken, requireRole('BUSINESS'), requireBusinessTenant, handleGetBusinessProfile);
router.put('/profile', authenticateToken, requireRole('BUSINESS'), requireBusinessTenant, handleUpdateBusinessProfile);

// Protected Business Service Management Endpoints (Requires BUSINESS role)
router.post('/services', authenticateToken, requireRole('BUSINESS'), requireBusinessTenant, handleCreateBusinessService);
router.put('/services/:serviceId', authenticateToken, requireRole('BUSINESS'), requireBusinessTenant, handleUpdateBusinessService);
router.patch('/services/:serviceId/status', authenticateToken, requireRole('BUSINESS'), requireBusinessTenant, handleToggleServiceStatus);

// Protected Business Queue Configuration Endpoints (Requires BUSINESS role)
router.get('/queue/settings', authenticateToken, requireRole('BUSINESS'), requireBusinessTenant, handleGetQueueSettings);
router.put('/queue/settings', authenticateToken, requireRole('BUSINESS'), requireBusinessTenant, handleUpdateQueueSettings);

// Protected Business Queue Management Endpoints (Requires BUSINESS role & matching business ID)
router.get('/queue', authenticateToken, requireRole('BUSINESS'), requireBusinessTenant, handleGetBusinessQueue);
router.post('/queue/next', authenticateToken, requireRole('BUSINESS'), requireBusinessTenant, handleCallNextCustomer);
router.post('/queue/complete', authenticateToken, requireRole('BUSINESS'), requireBusinessTenant, handleCompleteService);
router.post('/queue/skip', authenticateToken, requireRole('BUSINESS'), requireBusinessTenant, handleSkipToken);

// Protected Merchant Messaging Test Alert Endpoint (Requires BUSINESS role)
router.post('/messaging/test', authenticateToken, requireRole('BUSINESS'), requireBusinessTenant, handleTestAlert);

export default router;
