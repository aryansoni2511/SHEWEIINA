-- Shewwina Migration 008: Add analytics indexes for high-performance range aggregation
--
-- Purpose:
--   Accelerate date-bounded analytics and reporting queries for Today, 7-Day,
--   and 30-Day performance summaries on the business dashboard.
--
-- Indexes added:
--   1. idx_tokens_business_created_at: (business_id, created_at)
--      Enables fast range scans for customer intake volume and hourly/daily aggregation.
--   2. idx_tokens_business_status_created: (business_id, status, created_at)
--      Accelerates grouped status queries and filtered aggregations (SERVED, CANCELLED, etc.).
--
-- Backwards compatibility: fully safe.
--   - Uses CREATE INDEX IF NOT EXISTS.
--   - Does not alter schema definitions or constraints.
--   - Does not touch existing data.

BEGIN;

CREATE INDEX IF NOT EXISTS idx_tokens_business_created_at
  ON tokens (business_id, created_at);

CREATE INDEX IF NOT EXISTS idx_tokens_business_status_created
  ON tokens (business_id, status, created_at);

COMMIT;
