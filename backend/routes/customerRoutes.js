import { Router } from 'express';
import {
  handleGetCustomerProfile,
  handleGetActiveToken,
  handleGetCustomerTokens,
} from '../controllers/customerController.js';
import {
  handleGetNotifications,
  handleMarkNotificationRead,
  handleMarkAllNotificationsRead,
} from '../controllers/notificationController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all customer routes with JWT authentication & CUSTOMER role requirement
router.use(authenticateToken);
router.use(requireRole('CUSTOMER'));

router.get('/profile', handleGetCustomerProfile);
router.get('/active-token', handleGetActiveToken);
router.get('/tokens', handleGetCustomerTokens);

// In-App Notification Routes
router.get('/notifications', handleGetNotifications);
router.patch('/notifications/read-all', handleMarkAllNotificationsRead);
router.patch('/notifications/:notificationId/read', handleMarkNotificationRead);

export default router;

