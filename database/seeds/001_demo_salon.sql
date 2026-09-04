-- Shewwina Seed 001: Demo Salon, Services, Queue, Tokens & Owner User
-- Idempotent seed script for development and automated test environments.

BEGIN;

-- 1. Demo Business
INSERT INTO businesses (id, name, slug, category, phone, email, address, city, is_active)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Shewwina Salon & Spa',
    'demo',
    'salon',
    '+919876543210',
    'contact@shewwinasalon.com',
    'Shop 12, Phoenix Mall, Lower Parel',
    'Mumbai',
    TRUE
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    is_active = TRUE;

-- 2. Demo Services
INSERT INTO services (id, business_id, name, description, duration_minutes, price, is_active)
VALUES 
(
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Haircut & Styling',
    'Premium haircut, wash, and styling',
    30,
    500.00,
    TRUE
),
(
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Beard Trim & Grooming',
    'Precision beard shape and hot towel',
    15,
    250.00,
    TRUE
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    is_active = TRUE;

-- 3. Demo Queue
INSERT INTO queues (id, business_id, name, is_open, current_sequence, token_prefix, avg_service_duration, sms_notifications_enabled, whatsapp_notifications_enabled, turn_alert_threshold)
VALUES (
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Main Express Queue',
    TRUE,
    2,
    'S',
    15,
    TRUE,
    TRUE,
    2
) ON CONFLICT (id) DO UPDATE SET
    is_open = TRUE,
    name = EXCLUDED.name;

-- 4. Demo Owner User (password: 'password123')
INSERT INTO users (id, name, email, phone, password_hash, role, business_id)
VALUES (
    'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
    'Salon Owner',
    'owner@shewwina.com',
    '+919876543210',
    '$2a$10$tUG5WnY2Ky2X.IvcNq7F2eOvCGXohvTtL47.2wSWKuA9ru2eKepwe',
    'BUSINESS',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    business_id = EXCLUDED.business_id,
    role = EXCLUDED.role;

-- 5. Demo Tokens
INSERT INTO tokens (id, queue_id, business_id, service_id, customer_name, customer_phone, token_number, sequence_number, status, position, estimated_wait_minutes)
VALUES 
(
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Rahul Sharma',
    '+919800011122',
    'S-101',
    1,
    'SERVING',
    0,
    0
),
(
    'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'Priya Verma',
    '+919800033344',
    'S-102',
    2,
    'WAITING',
    1,
    15
) ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    position = EXCLUDED.position;

COMMIT;
