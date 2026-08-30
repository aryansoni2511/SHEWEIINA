import { successResponse } from '../utils/response.js';
import {
  processGetCustomerNotifications,
  processMarkNotificationRead,
  processMarkAllNotificationsRead,
} from '../services/notificationService.js';

/**
 * GET /api/v1/customer/notifications
 * Returns all notifications for the authenticated customer, newest first.
 */
export async function handleGetNotifications(req, res, next) {
  try {
    const userId = req.user.userId;
    const result = await processGetCustomerNotifications(userId);
    return successResponse(res, 'Notifications retrieved successfully', result, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/customer/notifications/:notificationId/read
 * Marks a single notification as read. Enforces ownership — customer can only
 * mark their own notifications.
 */
export async function handleMarkNotificationRead(req, res, next) {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;
    const result = await processMarkNotificationRead(notificationId, userId);
    return successResponse(res, 'Notification marked as read', result, 200);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/customer/notifications/read-all
 * Marks all unread notifications as read for the authenticated customer.
 */
export async function handleMarkAllNotificationsRead(req, res, next) {
  try {
    const userId = req.user.userId;
    const result = await processMarkAllNotificationsRead(userId);
    return successResponse(res, 'All notifications marked as read', result, 200);
  } catch (error) {
    next(error);
  }
}

export default {
  handleGetNotifications,
  handleMarkNotificationRead,
  handleMarkAllNotificationsRead,
};
