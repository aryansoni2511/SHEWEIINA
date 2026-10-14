-- Shewwina Migration 007: Add service_price_at_join snapshot to tokens table
--
-- Purpose:
--   Preserve the service price at the exact moment a customer joins the queue.
--   This ensures the Estimated Revenue metric remains historically correct even
--   when a business owner edits a service price after tokens have been served.
--
-- Background:
--   services.price is mutable (updateService allows price changes at any time).
--   Without a snapshot, a naive JOIN on services.price would silently alter
--   historical revenue figures every time a price is edited.
--
-- Data model decision:
--   NULL is valid for rows created before this migration — they lack a snapshot.
--   For those, the revenue query falls back to the current services.price (best-effort).
--   All new tokens created after this migration will always have the field populated.
--
-- Backwards compatibility: fully safe.
--   ADD COLUMN IF NOT EXISTS is idempotent.
--   Existing rows are not touched (DEFAULT NULL).
--   No constraint is added that would reject existing data.

BEGIN;

ALTER TABLE tokens
  ADD COLUMN IF NOT EXISTS service_price_at_join DECIMAL(10, 2) DEFAULT NULL;

-- Partial index to accelerate daily estimated revenue queries:
--   business_id + status=SERVED + served_at
-- Using a partial (WHERE status = 'SERVED') index keeps it compact and fast.
CREATE INDEX IF NOT EXISTS idx_tokens_business_served_at
  ON tokens (business_id, served_at)
  WHERE status = 'SERVED';

COMMIT;
