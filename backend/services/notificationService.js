/**
 * Notification Service — Business Logic Layer
 *
 * Architecture:
 *   queue event → notificationService → notificationModel → DB/mockStore
 *
 * All notification creation is fire-and-forget (non-blocking).
 * Future channels (SMS, WhatsApp, push) can be added here without
 * touching queueService.js or any other business logic layer.
 *
 * Industry-neutral: messages use generic queue vocabulary.
 * The "approaching" threshold (peopleAhead <= 2) is configurable.
 */

import {
  createNotification,
  findNotificationsByUserId,
  findNotificationById,
  findExistingNotification,
  countUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../models/notificationModel.js';
import { dispatchCustomerAlert } from './messagingService.js';

// ─── NOTIFICATION TYPES ───────────────────────────────────────────────────────

export const NOTIFICATION_TYPES = {
  CUSTOMER_JOINED_QUEUE: 'CUSTOMER_JOINED_QUEUE',
  YOUR_TURN_APPROACHING: 'YOUR_TURN_APPROACHING',
  CUSTOMER_CALLED: 'CUSTOMER_CALLED',
  SERVICE_COMPLETED: 'SERVICE_COMPLETED',
  QUEUE_CANCELLED: 'QUEUE_CANCELLED',
};

// ─── APPROACHING THRESHOLD ────────────────────────────────────────────────────

const APPROACHING_THRESHOLD = 2; // Notify when <= 2 people ahead

// ─── EXTERNAL MESSAGING DISPATCHER ───────────────────────────────────────────

function logNotification(userId, type, message, customerPhone = null, metadata = {}) {
  console.log(`[NOTIFICATION][${type}] userId=${userId} → "${message}"`);
  if (customerPhone) {
    dispatchCustomerAlert({
      phone: customerPhone,
      message,
      metadata: { type, userId, ...metadata },
    });
  }
}

// ─── ERROR CLASS ──────────────────────────────────────────────────────────────

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 404;
  }
}

class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 403;
  }
}

class ValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

// ─── TRIGGER: CUSTOMER JOINED QUEUE ──────────────────────────────────────────

/**
 * Fire-and-forget. Called after a token is successfully created.
 * Only fires in-app notification when a userId is linked (authenticated customer).
 * Dispatches external SMS/WhatsApp if customerPhone is available.
 */
export async function notifyCustomerJoinedQueue({ userId, tokenNumber, position, estimatedWaitMinutes, businessName, customerPhone = null }) {
  try {
    const title = 'You have joined the queue';
    const message = `Your token ${tokenNumber} is confirmed. You are #${position} in line. Estimated wait: ${estimatedWaitMinutes} min.`;

    if (userId) {
      const existing = await findExistingNotification(userId, NOTIFICATION_TYPES.CUSTOMER_JOINED_QUEUE, tokenNumber);
      if (!existing) {
        await createNotification({
          userId,
          type: NOTIFICATION_TYPES.CUSTOMER_JOINED_QUEUE,
          title,
          message,
          metadata: { tokenNumber, position, estimatedWaitMinutes, businessName },
        });
      }
    }

    logNotification(userId, NOTIFICATION_TYPES.CUSTOMER_JOINED_QUEUE, message, customerPhone, {
      tokenNumber,
      position,
      estimatedWaitMinutes,
      businessName,
    });
  } catch (err) {
    console.error('[NOTIFICATION] Failed to create CUSTOMER_JOINED_QUEUE notification:', err.message);
  }
}

// ─── TRIGGER: YOUR TURN APPROACHING ──────────────────────────────────────────

/**
 * Fire-and-forget. Called when a customer's position drops to or below
 * the APPROACHING_THRESHOLD after "call next" advances the queue.
 */
export async function notifyTurnApproaching({ userId, tokenNumber, peopleAhead, businessName, customerPhone = null }) {
  if (peopleAhead > APPROACHING_THRESHOLD) return;

  try {
    const title = 'Your turn is approaching';
    const message = peopleAhead === 0
      ? `You're next! Token ${tokenNumber} — please be ready to proceed.`
      : `Please be ready. There ${peopleAhead === 1 ? 'is 1 person' : `are ${peopleAhead} people`} ahead of your token ${tokenNumber}.`;

    if (userId) {
      const existing = await findExistingNotification(userId, NOTIFICATION_TYPES.YOUR_TURN_APPROACHING, tokenNumber);
      if (!existing) {
        await createNotification({
          userId,
          type: NOTIFICATION_TYPES.YOUR_TURN_APPROACHING,
          title,
          message,
          metadata: { tokenNumber, peopleAhead, businessName },
        });
      }
    }

    logNotification(userId, NOTIFICATION_TYPES.YOUR_TURN_APPROACHING, message, customerPhone, {
      tokenNumber,
      peopleAhead,
      businessName,
    });
  } catch (err) {
    console.error('[NOTIFICATION] Failed to create YOUR_TURN_APPROACHING notification:', err.message);
  }
}

// ─── TRIGGER: CUSTOMER CALLED ─────────────────────────────────────────────────

/**
 * Fire-and-forget. Called when a token transitions WAITING → SERVING.
 */
export async function notifyCustomerCalled({ userId, tokenNumber, businessName, customerPhone = null }) {
  try {
    const title = "It's your turn!";
    const message = `Token ${tokenNumber} has been called. Please proceed to the service counter now.`;

    if (userId) {
      const existing = await findExistingNotification(userId, NOTIFICATION_TYPES.CUSTOMER_CALLED, tokenNumber);
      if (!existing) {
        await createNotification({
          userId,
          type: NOTIFICATION_TYPES.CUSTOMER_CALLED,
          title,
          message,
          metadata: { tokenNumber, businessName },
        });
      }
    }

    logNotification(userId, NOTIFICATION_TYPES.CUSTOMER_CALLED, message, customerPhone, {
      tokenNumber,
      businessName,
    });
  } catch (err) {
    console.error('[NOTIFICATION] Failed to create CUSTOMER_CALLED notification:', err.message);
  }
}

// ─── TRIGGER: SERVICE COMPLETED ───────────────────────────────────────────────

/**
 * Fire-and-forget. Called when a token transitions SERVING → SERVED.
 */
export async function notifyServiceCompleted({ userId, tokenNumber, businessName, customerPhone = null }) {
  try {
    const title = 'Service completed';
    const message = `Your service for token ${tokenNumber} has been completed. Thank you for your visit.`;

    if (userId) {
      const existing = await findExistingNotification(userId, NOTIFICATION_TYPES.SERVICE_COMPLETED, tokenNumber);
      if (!existing) {
        await createNotification({
          userId,
          type: NOTIFICATION_TYPES.SERVICE_COMPLETED,
          title,
          message,
          metadata: { tokenNumber, businessName },
        });
      }
    }

    logNotification(userId, NOTIFICATION_TYPES.SERVICE_COMPLETED, message, customerPhone, {
      tokenNumber,
      businessName,
    });
  } catch (err) {
    console.error('[NOTIFICATION] Failed to create SERVICE_COMPLETED notification:', err.message);
  }
}

// ─── TRIGGER: QUEUE CANCELLED ─────────────────────────────────────────────────

/**
 * Fire-and-forget. Called when a customer cancels their own token.
 */
export async function notifyQueueCancelled({ userId, tokenNumber, customerPhone = null }) {
  try {
    const title = 'Queue token cancelled';
    const message = `Your token ${tokenNumber} has been cancelled. You have left the queue.`;

    if (userId) {
      const existing = await findExistingNotification(userId, NOTIFICATION_TYPES.QUEUE_CANCELLED, tokenNumber);
      if (!existing) {
        await createNotification({
          userId,
          type: NOTIFICATION_TYPES.QUEUE_CANCELLED,
          title,
          message,
          metadata: { tokenNumber },
        });
      }
    }

    logNotification(userId, NOTIFICATION_TYPES.QUEUE_CANCELLED, message, customerPhone, {
      tokenNumber,
    });
  } catch (err) {
    console.error('[NOTIFICATION] Failed to create QUEUE_CANCELLED notification:', err.message);
  }
}

// ─── READ OPERATIONS ──────────────────────────────────────────────────────────

export async function processGetCustomerNotifications(userId) {
  if (!userId) throw new ValidationError('userId is required');

  const notifications = await findNotificationsByUserId(userId, 50);
  const unreadCount = await countUnreadNotifications(userId);

  return {
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: Boolean(n.is_read),
      metadata: n.metadata || null,
      createdAt: n.created_at,
    })),
    unreadCount,
    total: notifications.length,
  };
}

export async function processMarkNotificationRead(notificationId, userId) {
  if (!notificationId) throw new ValidationError('notificationId is required');
  if (!userId) throw new ValidationError('userId is required');

  // Fetch first to confirm existence and ownership
  const existing = await findNotificationById(notificationId);
  if (!existing) throw new NotFoundError(`Notification not found: ${notificationId}`);
  if (existing.user_id !== userId) throw new ForbiddenError('You can only read your own notifications');

  const updated = await markNotificationRead(notificationId, userId);
  if (!updated) throw new NotFoundError(`Notification not found or already deleted: ${notificationId}`);

  return {
    id: updated.id,
    type: updated.type,
    isRead: Boolean(updated.is_read),
    updatedAt: new Date().toISOString(),
  };
}

export async function processMarkAllNotificationsRead(userId) {
  if (!userId) throw new ValidationError('userId is required');

  const updated = await markAllNotificationsRead(userId);

  return {
    markedReadCount: updated.length,
  };
}

export default {
  notifyCustomerJoinedQueue,
  notifyTurnApproaching,
  notifyCustomerCalled,
  notifyServiceCompleted,
  notifyQueueCancelled,
  processGetCustomerNotifications,
  processMarkNotificationRead,
  processMarkAllNotificationsRead,
  NOTIFICATION_TYPES,
  APPROACHING_THRESHOLD,
};
