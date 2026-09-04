-- Shewwina Migration 006: Add Notification & Messaging Settings to Queues Table
-- Adds queue-level communication preferences: SMS toggle, WhatsApp toggle, and alert threshold.

BEGIN;

ALTER TABLE queues
  ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS turn_alert_threshold INTEGER NOT NULL DEFAULT 2
    CHECK (turn_alert_threshold >= 1 AND turn_alert_threshold <= 5);

COMMIT;
