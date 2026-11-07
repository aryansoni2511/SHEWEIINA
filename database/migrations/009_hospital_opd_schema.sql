-- Migration 009: Hospital Management and OPD Queue System
-- Enables multi-specialty hospitals, departments, doctors, and doctor-specific OPD queues
-- 100% Non-breaking: all new tables and columns do not affect existing salon/clinic records

BEGIN;

-- 1. Table: hospitals
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    registration_number VARCHAR(100) NOT NULL,
    hospital_type VARCHAR(50) NOT NULL DEFAULT 'General',
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL DEFAULT 'Maharashtra',
    pincode VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    facilities TEXT[] DEFAULT ARRAY['Emergency', 'Pharmacy', 'OPD']::TEXT[],
    opening_hours VARCHAR(100) DEFAULT '24x7 Emergency / OPD 09:00 AM - 05:00 PM',
    admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hospitals_slug ON hospitals(slug);
CREATE INDEX IF NOT EXISTS idx_hospitals_city ON hospitals(city);
CREATE INDEX IF NOT EXISTS idx_hospitals_pincode ON hospitals(pincode);
CREATE INDEX IF NOT EXISTS idx_hospitals_is_active ON hospitals(is_active);

-- 2. Table: hospital_departments
CREATE TABLE IF NOT EXISTS hospital_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    description TEXT,
    floor_room VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hospital_depts_hospital_id ON hospital_departments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_depts_active ON hospital_departments(is_active);

-- 3. Table: hospital_doctors
CREATE TABLE IF NOT EXISTS hospital_doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES hospital_departments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    qualification VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    room_number VARCHAR(50) NOT NULL,
    consultation_duration_minutes INTEGER NOT NULL DEFAULT 15 CHECK (consultation_duration_minutes > 0),
    consultation_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (consultation_fee >= 0),
    availability VARCHAR(100) DEFAULT 'Mon - Sat (09:00 AM - 01:00 PM)',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hospital_doctors_hospital_id ON hospital_doctors(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_doctors_department_id ON hospital_doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_hospital_doctors_active ON hospital_doctors(is_active);

-- 4. Table: patients
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    age INTEGER CHECK (age >= 0 AND age <= 130),
    dob DATE,
    gender VARCHAR(20) DEFAULT 'Not Specified',
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);

-- 5. Table: doctor_queues
CREATE TABLE IF NOT EXISTS doctor_queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL UNIQUE REFERENCES hospital_doctors(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES hospital_departments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_open BOOLEAN NOT NULL DEFAULT TRUE,
    token_prefix VARCHAR(10) NOT NULL DEFAULT 'H',
    current_sequence INTEGER NOT NULL DEFAULT 0 CHECK (current_sequence >= 0),
    max_daily_capacity INTEGER NOT NULL DEFAULT 100 CHECK (max_daily_capacity > 0),
    avg_consultation_duration INTEGER NOT NULL DEFAULT 15 CHECK (avg_consultation_duration > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctor_queues_hospital_id ON doctor_queues(hospital_id);
CREATE INDEX IF NOT EXISTS idx_doctor_queues_doctor_id ON doctor_queues(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_queues_is_open ON doctor_queues(is_open);

-- 6. Table: hospital_tokens
CREATE TABLE IF NOT EXISTS hospital_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID NOT NULL REFERENCES doctor_queues(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES hospital_doctors(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES hospital_departments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    patient_code VARCHAR(50),
    patient_name VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(20) NOT NULL,
    patient_age INTEGER,
    patient_gender VARCHAR(20),
    token_number VARCHAR(30) NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_hospital_tokens_queue_status ON hospital_tokens(queue_id, status);
CREATE INDEX IF NOT EXISTS idx_hospital_tokens_hospital_id ON hospital_tokens(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_tokens_doctor_id ON hospital_tokens(doctor_id);
CREATE INDEX IF NOT EXISTS idx_hospital_tokens_token_number ON hospital_tokens(token_number);
CREATE INDEX IF NOT EXISTS idx_hospital_tokens_created_at ON hospital_tokens(created_at);

COMMIT;

