-- Table: queues
CREATE TABLE IF NOT EXISTS queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Main Queue',
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    current_sequence INTEGER NOT NULL DEFAULT 0 CHECK (current_sequence >= 0),
    max_daily_capacity INTEGER DEFAULT 200 CHECK (max_daily_capacity > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_queues_business_id ON queues(business_id);
CREATE INDEX IF NOT EXISTS idx_queues_is_open ON queues(is_open);
