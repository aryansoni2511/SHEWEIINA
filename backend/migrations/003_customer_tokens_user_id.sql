-- Migration 003: Add user_id relationship to tokens table

ALTER TABLE tokens ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON tokens(user_id);
