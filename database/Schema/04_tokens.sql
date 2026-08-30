-- Table: tokens (Queue Entries)
CREATE TABLE IF NOT EXISTS tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    token_number VARCHAR(20) NOT NULL,
    sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING' 
        CHECK (status IN ('WAITING', 'SERVING', 'SERVED', 'CANCELLED', 'SKIPPED')),
    position INTEGER NOT NULL DEFAULT 1 CHECK (position >= 0),
    estimated_wait_minutes INTEGER NOT NULL DEFAULT 0 CHECK (estimated_wait_minutes >= 0),
    called_at TIMESTAMP WITH TIME ZONE,
    served_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tokens_queue_status ON tokens(queue_id, status);
CREATE INDEX IF NOT EXISTS idx_tokens_business_id ON tokens(business_id);
CREATE INDEX IF NOT EXISTS idx_tokens_token_number ON tokens(token_number);
CREATE INDEX IF NOT EXISTS idx_tokens_sequence_number ON tokens(sequence_number);
