-- 06_tokens_user_id.sql — Add optional user_id link to tokens table

ALTER TABLE tokens ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON tokens(user_id);
