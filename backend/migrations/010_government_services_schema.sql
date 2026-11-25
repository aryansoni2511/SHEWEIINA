-- Migration 010: Government & Citizen Services Queue Management Schema
-- Non-breaking addition for Seva Kendras, CSCs, citizen counters, and token tracking.
-- Zero modification to existing salon, clinic, or hospital tables.

BEGIN;

-- 1. Table: government_centres
-- Represents citizen facilitation desks, Maha E-Seva Kendras, CSCs, and municipal counters.
CREATE TABLE IF NOT EXISTS government_centres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    centre_code VARCHAR(50) NOT NULL UNIQUE,
    centre_type VARCHAR(100) NOT NULL DEFAULT 'Citizen Facilitation Centre',
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Mumbai',
    district VARCHAR(100) NOT NULL DEFAULT 'Mumbai',
    state VARCHAR(100) NOT NULL DEFAULT 'Maharashtra',
    pincode VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL DEFAULT 19.0760,
    longitude DECIMAL(10, 7) NOT NULL DEFAULT 72.8777,
    operating_hours VARCHAR(100) DEFAULT 'Mon - Sat (09:30 AM - 05:30 PM)',
    supported_categories TEXT[] DEFAULT ARRAY['Aadhaar', 'Passport', 'RTO', 'Municipal']::TEXT[],
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_govt_centres_slug ON government_centres(slug);
CREATE INDEX IF NOT EXISTS idx_govt_centres_city ON government_centres(city);
CREATE INDEX IF NOT EXISTS idx_govt_centres_pincode ON government_centres(pincode);
CREATE INDEX IF NOT EXISTS idx_govt_centres_active ON government_centres(is_active);

-- 2. Table: government_services
-- Master catalog of citizen services across the 4 categories with verified document checklists.
CREATE TABLE IF NOT EXISTS government_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL CHECK (category IN ('Aadhaar', 'Passport', 'RTO', 'Municipal')),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    estimated_duration_minutes INTEGER NOT NULL DEFAULT 15 CHECK (estimated_duration_minutes > 0),
    official_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (official_fee >= 0),
    facilitation_fee DECIMAL(10, 2) NOT NULL DEFAULT 50.00 CHECK (facilitation_fee >= 0),
    official_fee_source VARCHAR(255),
    official_portal_url VARCHAR(255),
    fee_last_verified_date DATE DEFAULT '2026-11-14',
    eligibility_criteria TEXT,
    required_documents JSONB NOT NULL DEFAULT '[]'::JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_govt_services_category ON government_services(category);
CREATE INDEX IF NOT EXISTS idx_govt_services_slug ON government_services(slug);
CREATE INDEX IF NOT EXISTS idx_govt_services_active ON government_services(is_active);

-- 3. Table: government_counters
-- Service desks / counters within a registered facilitation centre.
CREATE TABLE IF NOT EXISTS government_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id UUID NOT NULL REFERENCES government_centres(id) ON DELETE CASCADE,
    counter_number VARCHAR(20) NOT NULL,
    counter_name VARCHAR(100) NOT NULL DEFAULT 'General Desk',
    operator_name VARCHAR(255),
    assigned_category VARCHAR(50) NOT NULL DEFAULT 'All',
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    token_prefix VARCHAR(10) NOT NULL DEFAULT 'G',
    current_sequence INTEGER NOT NULL DEFAULT 0 CHECK (current_sequence >= 0),
    max_daily_capacity INTEGER NOT NULL DEFAULT 150 CHECK (max_daily_capacity > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_govt_centre_counter UNIQUE (centre_id, counter_number)
);

CREATE INDEX IF NOT EXISTS idx_govt_counters_centre ON government_counters(centre_id);
CREATE INDEX IF NOT EXISTS idx_govt_counters_open ON government_counters(is_open);

-- 4. Table: government_tokens
-- Live citizen queue tokens and appointment passes.
CREATE TABLE IF NOT EXISTS government_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centre_id UUID NOT NULL REFERENCES government_centres(id) ON DELETE CASCADE,
    counter_id UUID REFERENCES government_counters(id) ON DELETE SET NULL,
    service_id UUID NOT NULL REFERENCES government_services(id) ON DELETE CASCADE,
    citizen_name VARCHAR(255) NOT NULL,
    citizen_phone VARCHAR(20) NOT NULL,
    citizen_email VARCHAR(255),
    token_number VARCHAR(30) NOT NULL,
    sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
    appointment_type VARCHAR(20) NOT NULL DEFAULT 'WALK_IN' CHECK (appointment_type IN ('WALK_IN', 'APPOINTMENT')),
    appointment_date DATE DEFAULT CURRENT_DATE,
    appointment_slot VARCHAR(50) DEFAULT 'Morning (10:00 AM - 01:00 PM)',
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING'
        CHECK (status IN ('WAITING', 'SERVING', 'SERVED', 'CANCELLED', 'SKIPPED')),
    position INTEGER NOT NULL DEFAULT 1 CHECK (position >= 0),
    estimated_wait_minutes INTEGER NOT NULL DEFAULT 0 CHECK (estimated_wait_minutes >= 0),
    checklist_completed BOOLEAN NOT NULL DEFAULT FALSE,
    verified_documents_count INTEGER NOT NULL DEFAULT 0,
    called_at TIMESTAMP WITH TIME ZONE,
    served_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_govt_tokens_centre_status ON government_tokens(centre_id, status);
CREATE INDEX IF NOT EXISTS idx_govt_tokens_counter_status ON government_tokens(counter_id, status);
CREATE INDEX IF NOT EXISTS idx_govt_tokens_citizen_phone ON government_tokens(citizen_phone);

-- 5. SEED DATA: Master Government Services (Verified Requirements)
INSERT INTO government_services (category, name, slug, description, estimated_duration_minutes, official_fee, facilitation_fee, official_fee_source, official_portal_url, eligibility_criteria, required_documents)
VALUES
-- Aadhaar Category
(
    'Aadhaar',
    'Aadhaar Demographic Update',
    'aadhaar-demographic-update',
    'Update Name, Address, Date of Birth, Gender, Mobile Number, or Email ID in your Aadhaar record.',
    15,
    50.00,
    30.00,
    'UIDAI Circular No. 14/2020 (Official Update Fee)',
    'https://uidai.gov.in',
    'Any existing Aadhaar holder with valid documentary proof of requested update.',
    '[
        {"title": "Existing Aadhaar Card / Letter", "mandatory": true, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Must present physical Aadhaar card or e-Aadhaar printout"},
        {"title": "Proof of Identity (PoI)", "mandatory": false, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Passport, PAN, Voter ID, or Driving Licence (mandatory if changing Name)"},
        {"title": "Proof of Address (PoA)", "mandatory": false, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Electricity Bill, Ration Card, Bank Passbook, or Rent Agreement (mandatory if changing Address)"},
        {"title": "Proof of Date of Birth (DoB)", "mandatory": false, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Birth Certificate or SSC Marksheet (mandatory if updating DoB)"}
    ]'::JSONB
),
(
    'Aadhaar',
    'Aadhaar Biometric Update',
    'aadhaar-biometric-update',
    'Update photo, 10 fingerprints, and iris scans. Mandatory for children attaining age 5 and 15.',
    20,
    100.00,
    50.00,
    'UIDAI Schedule of Fees',
    'https://uidai.gov.in',
    'All Aadhaar holders needing biometric refreshment. Free for mandatory child updates (5 & 15 yrs).',
    '[
        {"title": "Existing Aadhaar Card", "mandatory": true, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Original Aadhaar or valid enrolment slip"},
        {"title": "Parent / Guardian Aadhaar (for Minors)", "mandatory": false, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Required if applicant is below 18 years"},
        {"title": "Birth Certificate (for Children)", "mandatory": false, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Required for mandatory updates at ages 5 and 15"}
    ]'::JSONB
),
-- Passport Category
(
    'Passport',
    'Fresh Passport Application & PSK Guidance',
    'fresh-passport-guidance',
    'Document pre-verification, application check, and Passport Seva Kendra (PSK/POPSK) token assistance.',
    25,
    1500.00,
    100.00,
    'CPV Division, Ministry of External Affairs',
    'https://passportindia.gov.in',
    'Indian citizens residing in India without existing passport or criminal disqualifications.',
    '[
        {"title": "Proof of Present Address (PoA)", "mandatory": true, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Aadhaar, Electricity Bill, Water Bill, or Bank Passbook of last 1 year"},
        {"title": "Proof of Date of Birth (DoB)", "mandatory": true, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Birth Certificate issued by Municipal Authority or School Leaving Certificate"},
        {"title": "Educational Qualification Proof (ECNR)", "mandatory": true, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "10th standard matriculation certificate or higher degree certificate for Non-ECR status"},
        {"title": "PAN Card / Voter ID", "mandatory": false, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Supporting government photo identity"}
    ]'::JSONB
),
(
    'Passport',
    'Passport Reissue / Renewal',
    'passport-reissue-renewal',
    'Reissue assistance for expiring passports, exhausted pages, lost/damaged passports, or change in details.',
    20,
    1500.00,
    100.00,
    'Ministry of External Affairs Passport Rules',
    'https://passportindia.gov.in',
    'Citizens holding a previously issued Indian passport nearing expiry (within 1 yr) or expired.',
    '[
        {"title": "Original Old Passport", "mandatory": true, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Self-attested copies of first 2 pages, last 2 pages, and ECR/Non-ECR page"},
        {"title": "Proof of Present Address", "mandatory": true, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Only required if current address differs from old passport"},
        {"title": "Annexure / Police FIR (if Lost or Stolen)", "mandatory": false, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Mandatory only in case of lost, stolen, or damaged passport"}
    ]'::JSONB
),
-- RTO Category
(
    'RTO',
    'Learner Licence (LL) Slot Guidance',
    'learner-licence-guidance',
    'Application assistance, slot booking, and computerized theory test checklist for Learner Licence.',
    15,
    150.00,
    50.00,
    'Ministry of Road Transport and Highways (MoRTH)',
    'https://parivahan.gov.in',
    'Minimum age 16 for non-geared 50cc two-wheelers, age 18 for geared motor vehicles (MCWG/LMV).',
    '[
        {"title": "Proof of Age", "mandatory": true, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Birth Certificate, 10th marksheet, PAN, or Passport"},
        {"title": "Proof of Address", "mandatory": true, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Aadhaar Card, Voter ID, or Utility bill in applicant name"},
        {"title": "Form 1 (Self Physical Fitness Declaration)", "mandatory": true, "isOriginalRequired": true, "isPhotocopyRequired": false, "notes": "Available online via Sarathi Parivahan"},
        {"title": "Form 1A (Medical Certificate by Registered Doctor)", "mandatory": false, "isOriginalRequired": true, "isPhotocopyRequired": false, "notes": "Mandatory if age is 40+ years or applying for Transport category"}
    ]'::JSONB
),
(
    'RTO',
    'Permanent Driving Licence (DL) & Renewal',
    'permanent-dl-and-renewal',
    'Driving test appointment slot assistance, DL renewal after expiry, and biometric counter queue pass.',
    20,
    300.00,
    75.00,
    'Central Motor Vehicles Rules (CMVR)',
    'https://parivahan.gov.in',
    'Valid Learner Licence held for minimum 30 days and within 180 days of issue.',
    '[
        {"title": "Original Valid Learner Licence", "mandatory": true, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Must be at least 30 days old and unexpired"},
        {"title": "Vehicle Registration Certificate (RC) for Test Vehicle", "mandatory": true, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "RC, valid PUC, and Insurance of vehicle brought for practical test"},
        {"title": "Original Existing DL (if Renewal)", "mandatory": false, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Mandatory for driving licence renewal or address change"}
    ]'::JSONB
),
-- Municipal Category
(
    'Municipal',
    'Birth & Death Certificate Issuance',
    'birth-death-certificate',
    'Civil Registration System (CRS) counter token and application checklist for official vital records.',
    15,
    20.00,
    30.00,
    'Registration of Births and Deaths Act (RBD)',
    'https://crsorgi.gov.in',
    'Event occurred within municipal corporation jurisdiction and reported within prescribed period.',
    '[
        {"title": "Hospital Discharge / Birth Summary Slip", "mandatory": true, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Original hospital institutional discharge summary or letter"},
        {"title": "Parents / Informant Identity Proof", "mandatory": true, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Aadhaar cards of both parents/spouse"},
        {"title": "Marriage Certificate of Parents", "mandatory": false, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Required if parents names differ on hospital admission records"}
    ]'::JSONB
),
(
    'Municipal',
    'Property Tax Assessment & Counter Pass',
    'property-tax-counter-pass',
    'Municipal ward office counter queue token for property assessment, bill correction, and payment receipt.',
    15,
    0.00,
    25.00,
    'Municipal Corporation Act',
    'https://mcgm.gov.in',
    'Property owner or authorized representative within municipal municipal ward boundaries.',
    '[
        {"title": "Previous Property Tax Bill / Receipt", "mandatory": true, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Previous Property Assessment Number (SAC / Property ID)"},
        {"title": "Title Deed / Index-II / Registered Sale Deed", "mandatory": false, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Required if applying for ownership name transfer in municipal records"},
        {"title": "Owner Identity Proof", "mandatory": true, "isOriginalRequired": true, "isPhotocopyRequired": true, "notes": "Aadhaar, PAN, or Passport"}
    ]'::JSONB
)
ON CONFLICT (slug) DO NOTHING;

-- 6. SEED DATA: Verified Facilitation Centres
INSERT INTO government_centres (name, slug, centre_code, centre_type, phone, email, address, city, district, state, pincode, latitude, longitude, operating_hours, supported_categories, is_verified)
VALUES
(
    'Maha E-Seva Kendra — Dadar Citizen Facility',
    'maha-e-seva-dadar',
    'MSK-MUM-400028',
    'Maha E-Seva Kendra / Citizen Service Desk',
    '02224156789',
    'dadar.seva@shewwina.org',
    'Shop 12, Ground Floor, Chhabildas Road, Near Dadar Railway Station (West)',
    'Mumbai',
    'Mumbai City',
    'Maharashtra',
    '400028',
    19.0178,
    72.8478,
    'Mon - Sat (09:30 AM - 05:30 PM)',
    ARRAY['Aadhaar', 'Passport', 'RTO', 'Municipal']::TEXT[],
    TRUE
),
(
    'Aadhaar Seva Kendra — Andheri Facilitation Desk',
    'aadhaar-seva-andheri',
    'ASK-MUM-400058',
    'Aadhaar Enrolment & Update Centre',
    '02226201234',
    'andheri.ask@shewwina.org',
    'Unit 4, Crystal Point Mall, New Link Road, Andheri West',
    'Mumbai',
    'Mumbai Suburban',
    'Maharashtra',
    '400058',
    19.1363,
    72.8276,
    'Mon - Sat (09:00 AM - 06:00 PM)',
    ARRAY['Aadhaar', 'Municipal']::TEXT[],
    TRUE
),
(
    'Civic Facilitation Desk — Bandra Kurla Complex',
    'civic-desk-bkc',
    'CFD-MUM-400051',
    'Citizen Assistance & Municipal Facilitation Desk',
    '02226590001',
    'bkc.civic@shewwina.org',
    'Building C-15, G Block, Bandra Kurla Complex, Bandra East',
    'Mumbai',
    'Mumbai Suburban',
    'Maharashtra',
    '400051',
    19.0657,
    72.8685,
    'Mon - Fri (10:00 AM - 05:00 PM)',
    ARRAY['Passport', 'RTO', 'Municipal']::TEXT[],
    TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- 7. SEED DATA: Active Counters for the Kendras
INSERT INTO government_counters (centre_id, counter_number, counter_name, operator_name, assigned_category, is_open, token_prefix, current_sequence)
SELECT
    c.id,
    'Counter 1',
    'Aadhaar Biometric & Demographic Desk',
    'Sanjay Deshmukh',
    'Aadhaar',
    TRUE,
    'ADH',
    0
FROM government_centres c
WHERE c.slug = 'maha-e-seva-dadar'
ON CONFLICT (centre_id, counter_number) DO NOTHING;

INSERT INTO government_counters (centre_id, counter_number, counter_name, operator_name, assigned_category, is_open, token_prefix, current_sequence)
SELECT
    c.id,
    'Counter 2',
    'Passport & RTO Documentation Desk',
    'Pooja Kulkarni',
    'Passport',
    TRUE,
    'DOC',
    0
FROM government_centres c
WHERE c.slug = 'maha-e-seva-dadar'
ON CONFLICT (centre_id, counter_number) DO NOTHING;

INSERT INTO government_counters (centre_id, counter_number, counter_name, operator_name, assigned_category, is_open, token_prefix, current_sequence)
SELECT
    c.id,
    'Counter 3',
    'Municipal & Vital Records Desk',
    'Amit Patil',
    'Municipal',
    TRUE,
    'MUN',
    0
FROM government_centres c
WHERE c.slug = 'maha-e-seva-dadar'
ON CONFLICT (centre_id, counter_number) DO NOTHING;

COMMIT;
