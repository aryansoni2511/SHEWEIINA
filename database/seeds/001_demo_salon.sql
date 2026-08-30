-- Shewwina Seed 001: Demo Salon & Initial Tokens

-- 1. Demo Business
INSERT INTO businesses (id, name, slug, category, phone, email, address, city)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Shewwina Salon & Spa',
    'demo',
    'salon',
    '+919876543210',
    'contact@shewwinasalon.com',
    'Shop 12, Phoenix Mall, Lower Parel',
    'Mumbai'
) ON CONFLICT (slug) DO NOTHING;

-- 2. Demo Services
INSERT INTO services (id, business_id, name, description, duration_minutes, price)
VALUES 
(
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Haircut & Styling',
    'Premium haircut, wash, and styling',
    30,
    500.00
),
(
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Beard Trim & Grooming',
    'Precision beard shape and hot towel',
    15,
    250.00
) ON CONFLICT DO NOTHING;

-- 3. Demo Queue
INSERT INTO queues (id, business_id, name, is_open, current_sequence)
VALUES (
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Main Express Queue',
    TRUE,
    2
) ON CONFLICT DO NOTHING;

-- 4. Demo Tokens
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
) ON CONFLICT DO NOTHING;
