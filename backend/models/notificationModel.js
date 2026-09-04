import { query } from '../config/db.js';

/**
 * Notification Model — Data Access Layer
 * Handles all persistence operations for the in-app notification system.
 * Falls back to an in-memory mock store only during offline dev/unit testing when PostgreSQL is unconfigured.
 */

function guardProduction() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database error: PostgreSQL connection is required in production mode. Mock fallback is disabled.');
  }
}

// In-Memory Fallback Store
const mockNotifications = [];

// ─── CREATE ──────────────────────────────────────────────────────────────────

export async function createNotification({ userId, type, title, message, metadata = null }) {
  const res = await query(
    `INSERT INTO notifications (user_id, type, title, message, is_read, metadata)
     VALUES ($1, $2, $3, $4, FALSE, $5)
     RETURNING *;`,
    [userId, type, title, message, metadata ? JSON.stringify(metadata) : null]
  );

  if (res) {
    return res.rows[0] || null;
  }
  guardProduction();

  // Fallback
  const notification = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    user_id: userId,
    type,
    title,
    message,
    is_read: false,
    metadata: metadata || null,
    created_at: new Date().toISOString(),
  };
  mockNotifications.push(notification);
  return notification;
}

// ─── READ ─────────────────────────────────────────────────────────────────────

export async function findNotificationsByUserId(userId, limit = 50) {
  const res = await query(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2;`,
    [userId, limit]
  );

  if (res) return res.rows;
  guardProduction();

  return [...mockNotifications]
    .filter((n) => n.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);
}

export async function findNotificationById(notificationId) {
  const res = await query(
    'SELECT * FROM notifications WHERE id = $1;',
    [notificationId]
  );

  if (res) return res.rows[0] || null;
  guardProduction();

  return mockNotifications.find((n) => n.id === notificationId) || null;
}

export async function countUnreadNotifications(userId) {
  const res = await query(
    'SELECT COUNT(*)::int as count FROM notifications WHERE user_id = $1 AND is_read = FALSE;',
    [userId]
  );

  if (res) return res.rows[0] ? res.rows[0].count : 0;
  guardProduction();

  return mockNotifications.filter((n) => n.user_id === userId && !n.is_read).length;
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function markNotificationRead(notificationId, userId) {
  const res = await query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1 AND user_id = $2
     RETURNING *;`,
    [notificationId, userId]
  );

  if (res) return res.rows[0] || null;
  guardProduction();

  // Fallback — enforces ownership: only update if user_id matches
  const notif = mockNotifications.find(
    (n) => n.id === notificationId && n.user_id === userId
  );
  if (!notif) return null;

  notif.is_read = true;
  return notif;
}

export async function markAllNotificationsRead(userId) {
  const res = await query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE user_id = $1 AND is_read = FALSE
     RETURNING *;`,
    [userId]
  );

  if (res) return res.rows;
  guardProduction();

  const updated = [];
  mockNotifications.forEach((n) => {
    if (n.user_id === userId && !n.is_read) {
      n.is_read = true;
      updated.push(n);
    }
  });
  return updated;
}

export async function findExistingNotification(userId, type, tokenNumber = null) {
  if (!tokenNumber) {
    const res = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1 AND type = $2
       LIMIT 1;`,
      [userId, type]
    );
    if (res) return res.rows[0] || null;
  } else {
    const res = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1 AND type = $2 AND (metadata->>'tokenNumber' = $3 OR metadata->>'token_number' = $3)
       LIMIT 1;`,
      [userId, type, String(tokenNumber)]
    );
    if (res) return res.rows[0] || null;
  }
  guardProduction();

  return (
    mockNotifications.find(
      (n) =>
        n.user_id === userId &&
        n.type === type &&
        (!tokenNumber ||
          n.metadata?.tokenNumber === tokenNumber ||
          n.metadata?.token_number === tokenNumber)
    ) || null
  );
}

export default {
  createNotification,
  findNotificationsByUserId,
  findNotificationById,
  findExistingNotification,
  countUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
