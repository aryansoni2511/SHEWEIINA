-- Migration 004: Add queue configuration columns and business description
-- Safe: uses ADD COLUMN IF NOT EXISTS throughout — idempotent, no duplicate column risk.
--
-- Context:
--   - max_daily_capacity:    ALREADY EXISTS in Migration 001 (queues). NOT repeated.
--   - cancelled_at:          ALREADY EXISTS in Migration 001 (tokens). NOT repeated.
--   - token_prefix:          NEW — queues table.
--   - avg_service_duration:  NEW — queues table.
--   - description:           NEW — businesses table (referenced by updateBusiness SQL).

BEGIN;

-- queues: add token_prefix (e.g. 'S', 'GOV', 'CLI')
ALTER TABLE queues
  ADD COLUMN IF NOT EXISTS token_prefix VARCHAR(10) NOT NULL DEFAULT 'S';

-- queues: add avg_service_duration (minutes, used for wait time estimation)
ALTER TABLE queues
  ADD COLUMN IF NOT EXISTS avg_service_duration INTEGER NOT NULL DEFAULT 15
    CHECK (avg_service_duration > 0);

-- businesses: add description (optional business bio shown on customer pages)
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS description TEXT;

COMMIT;
