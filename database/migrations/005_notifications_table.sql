-- Migration 005: In-App Notification System
-- Creates the notifications table for customer queue event notifications.
-- Industry-neutral: type field drives message content, not hard-coded categories.

BEGIN;

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL
        CHECK (type IN (
            'CUSTOMER_JOINED_QUEUE',
            'YOUR_TURN_APPROACHING',
            'CUSTOMER_CALLED',
            'SERVICE_COMPLETED',
            'QUEUE_CANCELLED'
        )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read)
    WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

COMMIT;
