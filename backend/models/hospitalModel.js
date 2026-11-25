import { query, getClient } from '../config/db.js';

/**
 * Validates if a string is a standard UUID v4
 */
export function isValidUuid(val) {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

/**
 * In-memory Mock Store for Hospitals, Departments, Doctors, Patients & OPD Tokens
 * Used in development/test or when PostgreSQL pool is in fallback mode.
 */
export const mockHospitalStore = {
  hospitals: [
    {
      id: 'hosp-101',
      business_id: null,
      name: 'City Care Multi-Specialty Hospital',
      slug: 'city-care-hospital-mumbai',
      registration_number: 'MAH-HOSP-2018-8472',
      hospital_type: 'Multi-Specialty',
      phone: '9820112233',
      email: 'opd@citycaremumbai.org',
      address: 'Plot 42, Health City Avenue, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400058',
      latitude: 19.1197,
      longitude: 72.8464,
      facilities: ['Emergency 24x7', 'ICU', 'Pharmacy', 'Diagnostic Lab', 'Ambulance', 'Radiology / CT Scan'],
      opening_hours: '24x7 Emergency / OPD: 08:30 AM - 08:00 PM',
      admin_user_id: null,
      is_active: true,
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    },
    {
      id: 'hosp-102',
      business_id: null,
      name: 'Apex Super-Specialty Medical Institute',
      slug: 'apex-super-specialty-mumbai',
      registration_number: 'MAH-HOSP-2015-1109',
      hospital_type: 'Super-Specialty',
      phone: '9820223344',
      email: 'contact@apexhospital.in',
      address: '15 Dr. Ambedkar Road, Dadar East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400014',
      latitude: 19.0178,
      longitude: 72.8478,
      facilities: ['Emergency 24x7', 'Cardiac ICU', 'Pharmacy', 'Dialysis Center', 'Ambulance', 'Blood Bank'],
      opening_hours: '24x7 Emergency / OPD: 09:00 AM - 07:00 PM',
      admin_user_id: null,
      is_active: true,
      created_at: new Date('2026-01-15T08:00:00Z').toISOString(),
    },
    {
      id: 'hosp-103',
      business_id: null,
      name: 'Metro LifeLine District Hospital',
      slug: 'metro-lifeline-hospital-pune',
      registration_number: 'MAH-PUN-2020-4491',
      hospital_type: 'General',
      phone: '9820334455',
      email: 'reception@metrolifeline.org',
      address: 'Survey 108, Pune-Bangalore Highway, Baner',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411045',
      latitude: 18.5590,
      longitude: 73.7868,
      facilities: ['Emergency 24x7', 'Pharmacy', 'Ambulance', 'General OPD', 'Pathology Lab'],
      opening_hours: '24x7 Emergency / OPD: 08:00 AM - 06:00 PM',
      admin_user_id: null,
      is_active: true,
      created_at: new Date('2026-02-01T08:00:00Z').toISOString(),
    },
    {
      id: 'hosp-104',
      business_id: null,
      name: 'Sanjeevani Children & Maternity Hospital',
      slug: 'sanjeevani-children-hospital-bangalore',
      registration_number: 'KAR-BLR-2021-9923',
      hospital_type: 'Multi-Specialty',
      phone: '9820445566',
      email: 'care@sanjeevanikids.com',
      address: '77 100 Feet Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      latitude: 12.9784,
      longitude: 77.6408,
      facilities: ['NICU / PICU', 'Pharmacy', 'Pediatric OPD', 'Emergency 24x7', 'Vaccination Clinic'],
      opening_hours: '24x7 Emergency / OPD: 09:00 AM - 08:00 PM',
      admin_user_id: null,
      is_active: true,
      created_at: new Date('2026-02-10T08:00:00Z').toISOString(),
    },
  ],

  departments: [
    {
      id: 'dept-101',
      hospital_id: 'hosp-101',
      name: 'General Medicine',
      code: 'GEN',
      description: 'Primary care, fever clinic, hypertension, diabetes and acute medical illnesses.',
      floor_room: 'Ground Floor, Wing A, OPD Rooms 1-4',
      is_active: true,
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    },
    {
      id: 'dept-102',
      hospital_id: 'hosp-101',
      name: 'Cardiology',
      code: 'CARD',
      description: 'Cardiac evaluations, ECG, 2D Echo, blood pressure management, and heart conditions.',
      floor_room: '1st Floor, Heart Wing, OPD Rooms 101-103',
      is_active: true,
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    },
    {
      id: 'dept-103',
      hospital_id: 'hosp-101',
      name: 'Orthopedics & Joint Care',
      code: 'ORTHO',
      description: 'Bone fractures, arthritis, spine care, joint pain and sports injuries.',
      floor_room: '2nd Floor, Wing B, OPD Rooms 201-204',
      is_active: true,
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    },
    {
      id: 'dept-104',
      hospital_id: 'hosp-101',
      name: 'Pediatrics',
      code: 'PED',
      description: 'Child health, neonatal follow-up, immunizations, and pediatric wellness.',
      floor_room: 'Ground Floor, Child Wellness Wing, OPD 10-12',
      is_active: true,
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    },
    {
      id: 'dept-105',
      hospital_id: 'hosp-101',
      name: 'Dermatology & Skin',
      code: 'DERM',
      description: 'Skin allergies, hair disorders, cosmetic dermatology and infection management.',
      floor_room: '3rd Floor, OPD Room 305',
      is_active: true,
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    },
    {
      id: 'dept-106',
      hospital_id: 'hosp-101',
      name: 'ENT (Ear, Nose & Throat)',
      code: 'ENT',
      description: 'Sinus, hearing issues, throat infections, and audiometry evaluations.',
      floor_room: '2nd Floor, Room 210',
      is_active: true,
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    },
  ],

  doctors: [
    {
      id: 'doc-101',
      hospital_id: 'hosp-101',
      department_id: 'dept-101',
      user_id: null,
      name: 'Dr. Ramesh Kulkarni',
      qualification: 'MBBS, MD (General Medicine)',
      specialization: 'Senior Physician & Diabetologist',
      room_number: 'OPD Cabin 101',
      consultation_duration_minutes: 12,
      consultation_fee: 500,
      availability: 'Mon - Sat (09:00 AM - 01:00 PM, 05:00 PM - 08:00 PM)',
      is_active: true,
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    },
    {
      id: 'doc-102',
      hospital_id: 'hosp-101',
      department_id: 'dept-102',
      user_id: null,
      name: 'Dr. Sunita Deshmukh',
      qualification: 'MBBS, MD, DM (Cardiology), FACC',
      specialization: 'Interventional Cardiologist',
      room_number: 'OPD Cabin 103 (Heart Wing)',
      consultation_duration_minutes: 15,
      consultation_fee: 800,
      availability: 'Mon - Fri (10:00 AM - 02:00 PM)',
      is_active: true,
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    },
    {
      id: 'doc-103',
      hospital_id: 'hosp-101',
      department_id: 'dept-103',
      user_id: null,
      name: 'Dr. Amitav Sen',
      qualification: 'MBBS, MS (Orthopedics), MCh (Ortho)',
      specialization: 'Joint Replacement & Spine Specialist',
      room_number: 'OPD Cabin 202',
      consultation_duration_minutes: 15,
      consultation_fee: 700,
      availability: 'Tue, Thu, Sat (11:00 AM - 03:00 PM)',
      is_active: true,
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    },
    {
      id: 'doc-104',
      hospital_id: 'hosp-101',
      department_id: 'dept-104',
      user_id: null,
      name: 'Dr. Priya V. Nair',
      qualification: 'MBBS, DCH, DNB (Pediatrics)',
      specialization: 'Consultant Pediatrician & Neonatologist',
      room_number: 'OPD Cabin 11',
      consultation_duration_minutes: 10,
      consultation_fee: 450,
      availability: 'Mon - Sat (09:30 AM - 01:30 PM)',
      is_active: true,
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    },
    {
      id: 'doc-105',
      hospital_id: 'hosp-101',
      department_id: 'dept-105',
      user_id: null,
      name: 'Dr. Farhan Qureshi',
      qualification: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
      specialization: 'Dermatologist & Dermato-Surgeon',
      room_number: 'OPD Cabin 305',
      consultation_duration_minutes: 12,
      consultation_fee: 600,
      availability: 'Mon - Fri (02:00 PM - 06:00 PM)',
      is_active: true,
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    },
  ],

  doctorQueues: [
    {
      id: 'q-doc-101',
      hospital_id: 'hosp-101',
      doctor_id: 'doc-101',
      department_id: 'dept-101',
      name: 'Dr. Ramesh Kulkarni OPD Queue',
      is_open: true,
      token_prefix: 'H-GEN',
      current_sequence: 3,
      max_daily_capacity: 80,
      avg_consultation_duration: 12,
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    },
    {
      id: 'q-doc-102',
      hospital_id: 'hosp-101',
      doctor_id: 'doc-102',
      department_id: 'dept-102',
      name: 'Dr. Sunita Deshmukh Cardio Queue',
      is_open: true,
      token_prefix: 'H-CARD',
      current_sequence: 2,
      max_daily_capacity: 50,
      avg_consultation_duration: 15,
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    },
    {
      id: 'q-doc-103',
      hospital_id: 'hosp-101',
      doctor_id: 'doc-103',
      department_id: 'dept-103',
      name: 'Dr. Amitav Sen Ortho Queue',
      is_open: true,
      token_prefix: 'H-ORTHO',
      current_sequence: 1,
      max_daily_capacity: 60,
      avg_consultation_duration: 15,
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    },
    {
      id: 'q-doc-104',
      hospital_id: 'hosp-101',
      doctor_id: 'doc-104',
      department_id: 'dept-104',
      name: 'Dr. Priya Nair Pediatrics Queue',
      is_open: true,
      token_prefix: 'H-PED',
      current_sequence: 2,
      max_daily_capacity: 90,
      avg_consultation_duration: 10,
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    },
    {
      id: 'q-doc-105',
      hospital_id: 'hosp-101',
      doctor_id: 'doc-105',
      department_id: 'dept-105',
      name: 'Dr. Farhan Qureshi Skin Queue',
      is_open: true,
      token_prefix: 'H-DERM',
      current_sequence: 1,
      max_daily_capacity: 60,
      avg_consultation_duration: 12,
      created_at: new Date('2026-01-10T08:00:00Z').toISOString(),
    },
  ],

  patients: [
    {
      id: 'pat-101',
      patient_id: 'SHW-P-100201',
      name: 'Aakash Verma',
      age: 38,
      dob: '1988-04-12',
      gender: 'Male',
      phone: '9820556677',
      email: 'aakash.verma@example.com',
      address: 'B-204, Sea Green Apartments, Andheri West, Mumbai',
      user_id: null,
      created_at: new Date('2026-03-01T09:00:00Z').toISOString(),
    },
    {
      id: 'pat-102',
      patient_id: 'SHW-P-100202',
      name: 'Meera Iyer',
      age: 29,
      dob: '1997-08-23',
      gender: 'Female',
      phone: '9820667788',
      email: 'meera.iyer@example.com',
      address: 'Flat 12, Sunrise Residency, Dadar West, Mumbai',
      user_id: null,
      created_at: new Date('2026-03-01T09:15:00Z').toISOString(),
    },
    {
      id: 'pat-103',
      patient_id: 'SHW-P-100203',
      name: 'Vikram Jadhav',
      age: 52,
      dob: '1974-11-05',
      gender: 'Male',
      phone: '9820778899',
      email: null,
      address: 'Room 5, Shanti Bhuvan, Bandra, Mumbai',
      user_id: null,
      created_at: new Date('2026-03-01T09:30:00Z').toISOString(),
    },
  ],

  tokens: [
    {
      id: 'htok-101',
      queue_id: 'q-doc-101',
      hospital_id: 'hosp-101',
      doctor_id: 'doc-101',
      department_id: 'dept-101',
      patient_id: 'pat-101',
      patient_code: 'SHW-P-100201',
      patient_name: 'Aakash Verma',
      patient_phone: '9820556677',
      patient_age: 38,
      patient_gender: 'Male',
      token_number: 'H-GEN-101',
      sequence_number: 1,
      status: 'SERVING',
      position: 0,
      estimated_wait_minutes: 0,
      called_at: new Date().toISOString(),
      served_at: null,
      cancelled_at: null,
      created_at: new Date(Date.now() - 35 * 60000).toISOString(),
    },
    {
      id: 'htok-102',
      queue_id: 'q-doc-101',
      hospital_id: 'hosp-101',
      doctor_id: 'doc-101',
      department_id: 'dept-101',
      patient_id: 'pat-102',
      patient_code: 'SHW-P-100202',
      patient_name: 'Meera Iyer',
      patient_phone: '9820667788',
      patient_age: 29,
      patient_gender: 'Female',
      token_number: 'H-GEN-102',
      sequence_number: 2,
      status: 'WAITING',
      position: 1,
      estimated_wait_minutes: 12,
      called_at: null,
      served_at: null,
      cancelled_at: null,
      created_at: new Date(Date.now() - 20 * 60000).toISOString(),
    },
    {
      id: 'htok-103',
      queue_id: 'q-doc-101',
      hospital_id: 'hosp-101',
      doctor_id: 'doc-101',
      department_id: 'dept-101',
      patient_id: 'pat-103',
      patient_code: 'SHW-P-100203',
      patient_name: 'Vikram Jadhav',
      patient_phone: '9820778899',
      patient_age: 52,
      patient_gender: 'Male',
      token_number: 'H-GEN-103',
      sequence_number: 3,
      status: 'WAITING',
      position: 2,
      estimated_wait_minutes: 24,
      called_at: null,
      served_at: null,
      cancelled_at: null,
      created_at: new Date(Date.now() - 10 * 60000).toISOString(),
    },
  ],
};

/* ─── Query Helper ──────────────────────────────────────────────────────── */

let customHospitalClientHandler = null;

export function setCustomHospitalClientHandler(handler) {
  customHospitalClientHandler = handler;
}

async function getDbClient() {
  if (customHospitalClientHandler) {
    return customHospitalClientHandler();
  }
  return await getClient();
}

async function runQuery(sql, params = []) {
  try {
    return await query(sql, params);
  } catch (err) {
    if (process.env.NODE_ENV === 'production') throw err;
    return null;
  }
}

/* ─── Hospital Operations ───────────────────────────────────────────────── */

export async function findHospitalById(id) {
  if (!id) return null;
  if (isValidUuid(id)) {
    const res = await runQuery('SELECT * FROM hospitals WHERE id = $1;', [id]);
    if (res && res.rows && res.rows[0]) return res.rows[0];
  }
  return mockHospitalStore.hospitals.find((h) => h.id === id) || null;
}

export async function findHospitalBySlug(slug) {
  if (!slug) return null;
  const res = await runQuery('SELECT * FROM hospitals WHERE slug = $1;', [slug]);
  if (res && res.rows && res.rows[0]) return res.rows[0];
  return mockHospitalStore.hospitals.find((h) => h.slug === slug || h.id === slug) || null;
}

export async function findHospitalByAdminUserId(userId) {
  if (!userId) return null;
  if (isValidUuid(userId)) {
    const res = await runQuery('SELECT * FROM hospitals WHERE admin_user_id = $1;', [userId]);
    if (res && res.rows && res.rows[0]) return res.rows[0];
  }
  return mockHospitalStore.hospitals.find((h) => h.admin_user_id === userId) || null;
}

export async function searchHospitals({ search = '', city = '', pincode = '', facility = '', hospitalType = '' }) {
  const s = search.trim().toLowerCase();
  const c = city.trim().toLowerCase();
  const p = pincode.trim();
  const fac = facility.trim().toLowerCase();
  const hType = hospitalType.trim().toLowerCase();

  const dbRes = await runQuery(
    `SELECT * FROM hospitals
     WHERE is_active = TRUE
       AND ($1 = '' OR LOWER(name) LIKE $1 OR LOWER(address) LIKE $1 OR LOWER(city) LIKE $1)
       AND ($2 = '' OR LOWER(city) = $2)
       AND ($3 = '' OR pincode = $3)
       AND ($4 = '' OR LOWER(hospital_type) = $4)
     ORDER BY name ASC;`,
    [s ? `%${s}%` : '', c, p, hType]
  );

  if (dbRes && dbRes.rows) {
    let rows = dbRes.rows;
    if (fac) {
      rows = rows.filter((h) =>
        Array.isArray(h.facilities) && h.facilities.some((f) => f.toLowerCase().includes(fac))
      );
    }
    const seen = new Set();
    const deduped = [];
    for (const h of rows) {
      const key = h.id || h.registration_number;
      if (key && !seen.has(key)) {
        seen.add(key);
        deduped.push(h);
      }
    }
    return deduped;
  }

  // Fallback to mockHospitalStore
  const filtered = mockHospitalStore.hospitals.filter((h) => {
    if (!h.is_active) return false;
    const matchesSearch =
      !s ||
      h.name.toLowerCase().includes(s) ||
      h.address.toLowerCase().includes(s) ||
      h.city.toLowerCase().includes(s);
    const matchesCity = !c || h.city.toLowerCase() === c;
    const matchesPincode = !p || h.pincode === p;
    const matchesType = !hType || h.hospital_type.toLowerCase() === hType;
    const matchesFacility =
      !fac ||
      (Array.isArray(h.facilities) && h.facilities.some((f) => f.toLowerCase().includes(fac)));

    return matchesSearch && matchesCity && matchesPincode && matchesType && matchesFacility;
  });

  const seen = new Set();
  const deduped = [];
  for (const h of filtered) {
    const key = h.id || h.registration_number;
    if (key && !seen.has(key)) {
      seen.add(key);
      deduped.push(h);
    }
  }
  return deduped;
}

export async function createHospital({
  name,
  registrationNumber,
  hospitalType = 'General',
  phone,
  email,
  address,
  city,
  state = 'Maharashtra',
  pincode,
  latitude = null,
  longitude = null,
  facilities = [],
  openingHours = '24x7 Emergency / OPD 09:00 AM - 05:00 PM',
  adminUserId = null,
  businessId = null,
}) {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || `hosp-${Date.now()}`;
  let slug = baseSlug;

  if (isValidUuid(adminUserId) || isValidUuid(businessId)) {
    const res = await runQuery(
      `INSERT INTO hospitals
        (name, slug, registration_number, hospital_type, phone, email, address, city, state, pincode, latitude, longitude, facilities, opening_hours, admin_user_id, business_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, TRUE)
       RETURNING *;`,
      [
        name.trim(),
        slug,
        registrationNumber.trim(),
        hospitalType,
        phone.trim(),
        email.trim().toLowerCase(),
        address.trim(),
        city.trim(),
        state.trim(),
        pincode.trim(),
        latitude,
        longitude,
        facilities,
        openingHours,
        adminUserId,
        businessId,
      ]
    );

    if (res && res.rows && res.rows[0]) return res.rows[0];
  }

  // Fallback to in-memory store
  const existingIdx = mockHospitalStore.hospitals.findIndex(
    (h) => h.registration_number && h.registration_number.toLowerCase() === registrationNumber.trim().toLowerCase()
  );
  if (existingIdx !== -1) {
    mockHospitalStore.hospitals[existingIdx] = {
      ...mockHospitalStore.hospitals[existingIdx],
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      address: address.trim(),
      city: city.trim(),
      hospital_type: hospitalType,
    };
    return mockHospitalStore.hospitals[existingIdx];
  }

  let mockSlug = baseSlug;
  if (mockHospitalStore.hospitals.some((h) => h.slug === mockSlug)) {
    mockSlug = `${baseSlug}-${Date.now().toString(36)}`;
  }

  const newHosp = {
    id: `hosp-${Date.now()}`,
    business_id: businessId,
    name: name.trim(),
    slug: mockSlug,
    registration_number: registrationNumber.trim(),
    hospital_type: hospitalType,
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
    address: address.trim(),
    city: city.trim(),
    state: state.trim(),
    pincode: pincode.trim(),
    latitude: latitude || 19.076,
    longitude: longitude || 72.8777,
    facilities: facilities.length > 0 ? facilities : ['Emergency 24x7', 'Pharmacy', 'OPD'],
    opening_hours: openingHours,
    admin_user_id: adminUserId,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  mockHospitalStore.hospitals.push(newHosp);
  return newHosp;
}

/* ─── Departments Operations ────────────────────────────────────────────── */

export async function findDepartmentsByHospitalId(hospitalId, includeInactive = false) {
  if (isValidUuid(hospitalId)) {
    const res = await runQuery(
      `SELECT * FROM hospital_departments
       WHERE hospital_id = $1 AND ($2 = TRUE OR is_active = TRUE)
       ORDER BY name ASC;`,
      [hospitalId, includeInactive]
    );
    if (res && res.rows) return res.rows;
  }

  return mockHospitalStore.departments
    .filter((d) => d.hospital_id === hospitalId && (includeInactive || d.is_active))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function findDepartmentById(id) {
  if (isValidUuid(id)) {
    const res = await runQuery('SELECT * FROM hospital_departments WHERE id = $1;', [id]);
    if (res && res.rows && res.rows[0]) return res.rows[0];
  }
  return mockHospitalStore.departments.find((d) => d.id === id) || null;
}

export async function createDepartment({ hospitalId, name, code, description = '', floorRoom = '' }) {
  if (isValidUuid(hospitalId)) {
    const res = await runQuery(
      `INSERT INTO hospital_departments (hospital_id, name, code, description, floor_room, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING *;`,
      [hospitalId, name.trim(), code ? code.trim().toUpperCase() : null, description.trim(), floorRoom.trim()]
    );
    if (res && res.rows && res.rows[0]) return res.rows[0];
  }

  const newDept = {
    id: `dept-${Date.now()}`,
    hospital_id: hospitalId,
    name: name.trim(),
    code: (code || name.slice(0, 4)).trim().toUpperCase(),
    description: description.trim(),
    floor_room: floorRoom.trim() || 'OPD Wing',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  mockHospitalStore.departments.push(newDept);
  return newDept;
}

export async function updateDepartment(id, hospitalId, { name, code, description, floorRoom, isActive }) {
  if (isValidUuid(id)) {
    const res = await runQuery(
      `UPDATE hospital_departments
       SET name = COALESCE($3, name),
           code = COALESCE($4, code),
           description = COALESCE($5, description),
           floor_room = COALESCE($6, floor_room),
           is_active = COALESCE($7, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND hospital_id = $2
       RETURNING *;`,
      [id, hospitalId, name, code, description, floorRoom, isActive]
    );
    if (res && res.rows && res.rows[0]) return res.rows[0];
  }

  const dept = mockHospitalStore.departments.find((d) => d.id === id && d.hospital_id === hospitalId);
  if (dept) {
    if (name !== undefined) dept.name = name;
    if (code !== undefined) dept.code = code.toUpperCase();
    if (description !== undefined) dept.description = description;
    if (floorRoom !== undefined) dept.floor_room = floorRoom;
    if (isActive !== undefined) dept.is_active = isActive;
    return dept;
  }
  return null;
}

/* ─── Doctors & Queues Operations ───────────────────────────────────────── */

export async function findDoctorsByHospitalId(hospitalId, departmentId = null, includeInactive = false) {
  if (isValidUuid(hospitalId)) {
    const res = await runQuery(
      `SELECT d.*, dept.name as department_name, dept.code as department_code,
              q.id as queue_id, q.is_open as queue_is_open, q.token_prefix, q.max_daily_capacity
       FROM hospital_doctors d
       JOIN hospital_departments dept ON d.department_id = dept.id
       LEFT JOIN doctor_queues q ON q.doctor_id = d.id
       WHERE d.hospital_id = $1
         AND ($2::UUID IS NULL OR d.department_id = $2::UUID)
         AND ($3 = TRUE OR d.is_active = TRUE)
       ORDER BY d.name ASC;`,
      [hospitalId, departmentId, includeInactive]
    );
    if (res && res.rows) return res.rows;
  }

  return mockHospitalStore.doctors
    .filter((doc) => {
      if (doc.hospital_id !== hospitalId) return false;
      if (departmentId && doc.department_id !== departmentId) return false;
      if (!includeInactive && !doc.is_active) return false;
      return true;
    })
    .map((doc) => {
      const dept = mockHospitalStore.departments.find((d) => d.id === doc.department_id);
      const queue = mockHospitalStore.doctorQueues.find((q) => q.doctor_id === doc.id);
      return {
        ...doc,
        department_name: dept?.name || 'General',
        department_code: dept?.code || 'GEN',
        queue_id: queue?.id || null,
        queue_is_open: queue ? queue.is_open : true,
        token_prefix: queue?.token_prefix || 'H',
        max_daily_capacity: queue?.max_daily_capacity || 100,
      };
    });
}

export async function findDoctorById(id) {
  if (isValidUuid(id)) {
    const res = await runQuery(
      `SELECT d.*, dept.name as department_name, dept.code as department_code
       FROM hospital_doctors d
       JOIN hospital_departments dept ON d.department_id = dept.id
       WHERE d.id = $1;`,
      [id]
    );
    if (res && res.rows && res.rows[0]) return res.rows[0];
  }

  const doc = mockHospitalStore.doctors.find((d) => d.id === id);
  if (!doc) return null;
  const dept = mockHospitalStore.departments.find((d) => d.id === doc.department_id);
  return {
    ...doc,
    department_name: dept?.name || 'General',
    department_code: dept?.code || 'GEN',
  };
}

export async function createDoctorWithQueue({
  hospitalId,
  departmentId,
  name,
  qualification,
  specialization = '',
  roomNumber,
  consultationDuration = 15,
  consultationFee = 0,
  availability = 'Mon - Sat (09:00 AM - 01:00 PM)',
  tokenPrefix = null,
}) {
  const dept = await findDepartmentById(departmentId);
  const prefix = (tokenPrefix || (dept?.code ? `H-${dept.code}` : 'H-OPD')).trim().toUpperCase();

  if (isValidUuid(hospitalId) && isValidUuid(departmentId)) {
    const docRes = await runQuery(
      `INSERT INTO hospital_doctors
        (hospital_id, department_id, name, qualification, specialization, room_number, consultation_duration_minutes, consultation_fee, availability, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
       RETURNING *;`,
      [
        hospitalId,
        departmentId,
        name.trim(),
        qualification.trim(),
        specialization.trim(),
        roomNumber.trim(),
        consultationDuration,
        consultationFee,
        availability.trim(),
      ]
    );

    if (docRes && docRes.rows && docRes.rows[0]) {
      const doctor = docRes.rows[0];
      const qRes = await runQuery(
        `INSERT INTO doctor_queues
          (hospital_id, doctor_id, department_id, name, is_open, token_prefix, current_sequence, max_daily_capacity, avg_consultation_duration)
         VALUES ($1, $2, $3, $4, TRUE, $5, 0, 100, $6)
         RETURNING *;`,
        [hospitalId, doctor.id, departmentId, `${doctor.name} OPD Queue`, prefix, consultationDuration]
      );

      return {
        doctor,
        queue: qRes?.rows?.[0] || null,
      };
    }
  }

  const doctorId = `doc-${Date.now()}`;
  const queueId = `q-${doctorId}`;

  const doctor = {
    id: doctorId,
    hospital_id: hospitalId,
    department_id: departmentId,
    name: name.trim(),
    qualification: qualification.trim(),
    specialization: specialization.trim(),
    room_number: roomNumber.trim(),
    consultation_duration_minutes: consultationDuration,
    consultation_fee: consultationFee,
    availability: availability.trim(),
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const queue = {
    id: queueId,
    hospital_id: hospitalId,
    doctor_id: doctorId,
    department_id: departmentId,
    name: `${doctor.name} OPD Queue`,
    is_open: true,
    token_prefix: prefix,
    current_sequence: 0,
    max_daily_capacity: 100,
    avg_consultation_duration: consultationDuration,
    created_at: new Date().toISOString(),
  };

  mockHospitalStore.doctors.push(doctor);
  mockHospitalStore.doctorQueues.push(queue);

  return { doctor, queue };
}

export async function findDoctorQueueByDoctorId(doctorId) {
  if (isValidUuid(doctorId)) {
    const res = await runQuery('SELECT * FROM doctor_queues WHERE doctor_id = $1;', [doctorId]);
    if (res && res.rows && res.rows[0]) return res.rows[0];
  }
  return mockHospitalStore.doctorQueues.find((q) => q.doctor_id === doctorId) || null;
}

export async function findDoctorQueueById(queueId) {
  if (isValidUuid(queueId)) {
    const res = await runQuery('SELECT * FROM doctor_queues WHERE id = $1;', [queueId]);
    if (res && res.rows && res.rows[0]) return res.rows[0];
  }
  return mockHospitalStore.doctorQueues.find((q) => q.id === queueId) || null;
}

export async function toggleDoctorQueueStatus(queueId, hospitalId, isOpen) {
  if (isValidUuid(queueId)) {
    const res = await runQuery(
      `UPDATE doctor_queues
       SET is_open = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND hospital_id = $2
       RETURNING *;`,
      [queueId, hospitalId, isOpen]
    );
    if (res && res.rows && res.rows[0]) return res.rows[0];
  }

  const q = mockHospitalStore.doctorQueues.find((item) => item.id === queueId && item.hospital_id === hospitalId);
  if (q) {
    q.is_open = isOpen;
    return q;
  }
  return null;
}

/* ─── Patients Operations ───────────────────────────────────────────────── */

export async function findPatientByPhone(phone) {
  if (!phone) return null;
  const clean = String(phone).replace(/\D/g, '');
  const res = await runQuery('SELECT * FROM patients WHERE phone = $1 OR phone = $2;', [phone, clean]);
  if (res && res.rows && res.rows[0]) return res.rows[0];
  return mockHospitalStore.patients.find((p) => p.phone === phone || p.phone === clean) || null;
}

export async function findPatientById(id) {
  if (isValidUuid(id)) {
    const res = await runQuery('SELECT * FROM patients WHERE id = $1;', [id]);
    if (res && res.rows && res.rows[0]) return res.rows[0];
  }
  return (
    mockHospitalStore.patients.find((p) => p.id === id || p.patient_id === id) || null
  );
}

export async function createPatient({ name, age = null, dob = null, gender = 'Not Specified', phone, email = null, address = '', userId = null }) {
  const patientCode = `SHW-P-${Math.floor(100000 + Math.random() * 900000)}`;
  const cleanName = (name || '').trim();
  const cleanPhone = (phone || '').trim();
  const cleanEmail = email ? String(email).trim() : null;
  const cleanAddress = address ? String(address).trim() : '';
  const validUserId = isValidUuid(userId) ? userId : null;

  const res = await runQuery(
    `INSERT INTO patients (patient_id, name, age, dob, gender, phone, email, address, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *;`,
    [patientCode, cleanName, age ? Number(age) : null, dob || null, gender || 'Not Specified', cleanPhone, cleanEmail, cleanAddress, validUserId]
  );
  if (res && res.rows && res.rows[0]) return res.rows[0];

  const newPatient = {
    id: `pat-${Date.now()}`,
    patient_id: patientCode,
    name: cleanName,
    age: age ? Number(age) : null,
    dob: dob || null,
    gender: gender || 'Not Specified',
    phone: cleanPhone,
    email: cleanEmail,
    address: cleanAddress,
    user_id: userId,
    created_at: new Date().toISOString(),
  };

  mockHospitalStore.patients.push(newPatient);
  return newPatient;
}

/* ─── OPD Token Operations ──────────────────────────────────────────────── */

export async function findHospitalTokensByQueueId(queueId) {
  if (isValidUuid(queueId)) {
    const res = await runQuery(
      `SELECT * FROM hospital_tokens
       WHERE queue_id = $1
       ORDER BY sequence_number ASC;`,
      [queueId]
    );
    if (res && res.rows) return res.rows;
  }

  return mockHospitalStore.tokens
    .filter((t) => t.queue_id === queueId)
    .sort((a, b) => a.sequence_number - b.sequence_number);
}

export async function findHospitalTokensByDoctorId(doctorId) {
  if (isValidUuid(doctorId)) {
    const res = await runQuery(
      `SELECT * FROM hospital_tokens
       WHERE doctor_id = $1
       ORDER BY sequence_number ASC;`,
      [doctorId]
    );
    if (res && res.rows) return res.rows;
  }

  return mockHospitalStore.tokens
    .filter((t) => t.doctor_id === doctorId)
    .sort((a, b) => a.sequence_number - b.sequence_number);
}

export async function findHospitalTokenById(tokenId) {
  if (tokenId) {
    const isUuid = isValidUuid(tokenId);
    const whereClause = isUuid ? 't.id = $1::uuid' : 't.token_number = $1';
    const res = await runQuery(
      `SELECT t.*, d.name as doctor_name, d.qualification as doctor_qualification, d.room_number,
              dept.name as department_name, h.name as hospital_name, h.slug as hospital_slug, h.phone as hospital_phone
       FROM hospital_tokens t
       JOIN hospital_doctors d ON t.doctor_id = d.id
       JOIN hospital_departments dept ON t.department_id = dept.id
       JOIN hospitals h ON t.hospital_id = h.id
       WHERE ${whereClause};`,
      [tokenId]
    );
    if (res && res.rows && res.rows[0]) return res.rows[0];
  }

  const tok = mockHospitalStore.tokens.find((t) => t.id === tokenId || t.token_number === tokenId);
  if (!tok) return null;

  const doc = mockHospitalStore.doctors.find((d) => d.id === tok.doctor_id);
  const dept = mockHospitalStore.departments.find((d) => d.id === tok.department_id);
  const hosp = mockHospitalStore.hospitals.find((h) => h.id === tok.hospital_id);

  return {
    ...tok,
    doctor_name: doc?.name || 'Attending Physician',
    doctor_qualification: doc?.qualification || 'MBBS',
    room_number: doc?.room_number || 'OPD Room',
    department_name: dept?.name || 'OPD',
    hospital_name: hosp?.name || 'City Hospital',
    hospital_slug: hosp?.slug || 'city-hospital',
    hospital_phone: hosp?.phone || '',
  };
}

export async function createHospitalToken({
  queueId,
  hospitalId,
  doctorId,
  departmentId,
  patientId,
  patientCode,
  patientName,
  patientPhone,
  patientAge = null,
  patientGender = null,
  estimatedWaitMinutes = 0,
}) {
  const isDbEligible =
    (isValidUuid(queueId) && isValidUuid(hospitalId) && isValidUuid(doctorId)) ||
    Boolean(customHospitalClientHandler);

  if (isDbEligible) {
    const client = await getDbClient();
    if (client) {
      try {
        await client.query('BEGIN');

        // 1. Lock doctor queue row for update
        const qLock = await client.query(
          `SELECT id, token_prefix, current_sequence, is_open, max_daily_capacity
           FROM doctor_queues
           WHERE id = $1
           FOR UPDATE;`,
          [queueId]
        );

        if (qLock.rows.length === 0) {
          throw new Error(`Doctor OPD queue not found: ${queueId}`);
        }

        const queueRow = qLock.rows[0];
        if (!queueRow.is_open) {
          const err = new Error('Doctor OPD queue is currently paused or closed.');
          err.statusCode = 409;
          err.name = 'ConflictError';
          throw err;
        }

        // 2. Prevent duplicate active token for same patient and same queue today
        const dupCheck = await client.query(
          `SELECT id, token_number, status FROM hospital_tokens
           WHERE queue_id = $1
             AND patient_phone = $2
             AND status IN ('WAITING', 'SERVING')
             AND created_at >= CURRENT_DATE
           FOR UPDATE LIMIT 1;`,
          [queueId, patientPhone.trim()]
        );

        if (dupCheck.rows.length > 0) {
          const dup = dupCheck.rows[0];
          const err = new Error(
            `You already have an active token (${dup.token_number}) in this OPD queue today.`
          );
          err.statusCode = 409;
          err.name = 'ConflictError';
          err.code = 'DUPLICATE_ACTIVE_TOKEN';
          err.details = {
            code: 'DUPLICATE_ACTIVE_TOKEN',
            tokenId: dup.id,
            tokenNumber: dup.token_number,
            status: dup.status || 'WAITING',
            queueId,
          };
          throw err;
        }

        // 3. Count waiting tokens for position and capacity under lock
        const posRes = await client.query(
          `SELECT COUNT(*)::int as waiting_count
           FROM hospital_tokens
           WHERE queue_id = $1 AND status = 'WAITING';`,
          [queueId]
        );
        const waitingCount = posRes.rows[0]?.waiting_count || 0;
        const maxCap = queueRow.max_daily_capacity || 100;
        if (waitingCount >= maxCap) {
          const err = new Error(`Doctor OPD queue has reached maximum daily patient capacity (${maxCap}).`);
          err.statusCode = 409;
          err.name = 'ConflictError';
          throw err;
        }

        const position = waitingCount + 1;

        // 4. Atomically increment sequence inside transaction
        const seqRes = await client.query(
          `UPDATE doctor_queues
           SET current_sequence = current_sequence + 1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1
           RETURNING current_sequence;`,
          [queueId]
        );

        const seq = seqRes.rows[0].current_sequence;
        const prefix = queueRow.token_prefix || 'H';
        const tokenNumber = `${prefix}-${seq}`;

        const validPatientId = isValidUuid(patientId) ? patientId : null;
        const validDeptId = isValidUuid(departmentId) ? departmentId : null;

        // 5. Insert token atomically
        const tokRes = await client.query(
          `INSERT INTO hospital_tokens
            (queue_id, hospital_id, doctor_id, department_id, patient_id, patient_code, patient_name, patient_phone, patient_age, patient_gender, token_number, sequence_number, status, position, estimated_wait_minutes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'WAITING', $13, $14)
           RETURNING *;`,
          [
            queueId,
            hospitalId,
            doctorId,
            validDeptId,
            validPatientId,
            patientCode,
            patientName.trim(),
            patientPhone.trim(),
            patientAge ? Number(patientAge) : null,
            patientGender || 'Not Specified',
            tokenNumber,
            seq,
            position,
            estimatedWaitMinutes,
          ]
        );

        await client.query('COMMIT');
        return tokRes.rows[0];
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
  }

  // Fallback in-memory mock store
  const activeDuplicate = mockHospitalStore.tokens.find(
    (t) =>
      t.queue_id === queueId &&
      t.patient_phone === patientPhone.trim() &&
      ['WAITING', 'SERVING'].includes(t.status)
  );
  if (activeDuplicate) {
    const err = new Error(
      `You already have an active token (${activeDuplicate.token_number}) in this OPD queue today.`
    );
    err.statusCode = 409;
    err.name = 'ConflictError';
    err.code = 'DUPLICATE_ACTIVE_TOKEN';
    err.details = {
      code: 'DUPLICATE_ACTIVE_TOKEN',
      tokenId: activeDuplicate.id,
      tokenNumber: activeDuplicate.token_number,
      status: activeDuplicate.status,
      queueId,
    };
    throw err;
  }

  const queue = await findDoctorQueueById(queueId);
  const prefix = queue?.token_prefix || 'H';
  const q = mockHospitalStore.doctorQueues.find((item) => item.id === queueId);
  const previousSequence = q ? q.current_sequence || 0 : 0;

  try {
    if (q) {
      q.current_sequence = previousSequence + 1;
    }
    const seq = q?.current_sequence || mockHospitalStore.tokens.length + 1;
    const tokenNumber = `${prefix}-${seq}`;

    const waitingCount = mockHospitalStore.tokens.filter(
      (t) => t.queue_id === queueId && t.status === 'WAITING'
    ).length;

    const newTok = {
      id: `htok-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      queue_id: queueId,
      hospital_id: hospitalId,
      doctor_id: doctorId,
      department_id: departmentId,
      patient_id: patientId,
      patient_code: patientCode,
      patient_name: patientName.trim(),
      patient_phone: patientPhone.trim(),
      patient_age: patientAge ? Number(patientAge) : null,
      patient_gender: patientGender || 'Not Specified',
      token_number: tokenNumber,
      sequence_number: seq,
      status: 'WAITING',
      position: waitingCount + 1,
      estimated_wait_minutes: estimatedWaitMinutes,
      called_at: null,
      served_at: null,
      cancelled_at: null,
      created_at: new Date().toISOString(),
    };

    mockHospitalStore.tokens.push(newTok);
    return newTok;
  } catch (err) {
    if (q) {
      q.current_sequence = previousSequence;
    }
    throw err;
  }
}

export async function callNextDoctorToken(queueId, hospitalId, doctorId) {
  const isDbEligible =
    (isValidUuid(queueId) && (!hospitalId || isValidUuid(hospitalId))) ||
    Boolean(customHospitalClientHandler);

  if (isDbEligible) {
    const client = await getDbClient();
    if (client) {
      try {
        await client.query('BEGIN');

        // 1. Lock doctor queue row with FOR UPDATE to serialize concurrent NEXT operations on this queue
        await client.query(
          `SELECT id FROM doctor_queues WHERE id = $1 FOR UPDATE;`,
          [queueId]
        );

        // 2. Mark existing SERVING token as SERVED
        await client.query(
          `UPDATE hospital_tokens
           SET status = 'SERVED', served_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE queue_id = $1 AND ($2::UUID IS NULL OR hospital_id = $2) AND status = 'SERVING';`,
          [queueId, isValidUuid(hospitalId) ? hospitalId : null]
        );

        // 3. Pick next WAITING token atomically and mark SERVING
        const nextRes = await client.query(
          `UPDATE hospital_tokens
           SET status = 'SERVING', called_at = CURRENT_TIMESTAMP, position = 0, estimated_wait_minutes = 0, updated_at = CURRENT_TIMESTAMP
           WHERE id = (
             SELECT id FROM hospital_tokens
             WHERE queue_id = $1 AND ($2::UUID IS NULL OR hospital_id = $2) AND status = 'WAITING'
             ORDER BY sequence_number ASC
             LIMIT 1
             FOR UPDATE
           )
           RETURNING *;`,
          [queueId, isValidUuid(hospitalId) ? hospitalId : null]
        );

        await client.query('COMMIT');
        if (nextRes && nextRes.rows && nextRes.rows[0]) {
          return nextRes.rows[0];
        }
        return null;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
  }

  // Fallback in-memory
  mockHospitalStore.tokens.forEach((t) => {
    if (t.queue_id === queueId && (!hospitalId || !t.hospital_id || t.hospital_id === hospitalId) && t.status === 'SERVING') {
      t.status = 'SERVED';
      t.served_at = new Date().toISOString();
    }
  });

  const nextWaiting = mockHospitalStore.tokens.find(
    (t) => t.queue_id === queueId && (!hospitalId || !t.hospital_id || t.hospital_id === hospitalId) && t.status === 'WAITING'
  );

  if (!nextWaiting) return null;

  nextWaiting.status = 'SERVING';
  nextWaiting.called_at = new Date().toISOString();
  nextWaiting.position = 0;
  nextWaiting.estimated_wait_minutes = 0;

  let currentPos = 1;
  mockHospitalStore.tokens.forEach((t) => {
    if (t.queue_id === queueId && (!hospitalId || !t.hospital_id || t.hospital_id === hospitalId) && t.status === 'WAITING') {
      t.position = currentPos++;
    }
  });

  return nextWaiting;
}

export async function completeDoctorServingToken(queueId, hospitalId, doctorId) {
  if (isValidUuid(queueId)) {
    const res = await runQuery(
      `UPDATE hospital_tokens
       SET status = 'SERVED', served_at = CURRENT_TIMESTAMP
       WHERE queue_id = $1 AND ($2::UUID IS NULL OR hospital_id = $2) AND status = 'SERVING'
       RETURNING *;`,
      [queueId, isValidUuid(hospitalId) ? hospitalId : null]
    );
    if (res && res.rows && res.rows[0]) return res.rows[0];
  }

  const serving = mockHospitalStore.tokens.find(
    (t) => t.queue_id === queueId && (!hospitalId || !t.hospital_id || t.hospital_id === hospitalId) && t.status === 'SERVING'
  );
  if (serving) {
    serving.status = 'SERVED';
    serving.served_at = new Date().toISOString();
    return serving;
  }
  return null;
}

export async function skipDoctorToken(tokenId, queueId, hospitalId) {
  if (isValidUuid(tokenId)) {
    const res = await runQuery(
      `UPDATE hospital_tokens
       SET status = 'SKIPPED', position = 0, estimated_wait_minutes = 0, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND queue_id = $2 AND ($3::UUID IS NULL OR hospital_id = $3)
       RETURNING *;`,
      [tokenId, queueId, isValidUuid(hospitalId) ? hospitalId : null]
    );
    if (res && res.rows && res.rows[0]) return res.rows[0];
  }

  const token = mockHospitalStore.tokens.find(
    (t) => t.id === tokenId && t.queue_id === queueId && (!hospitalId || !t.hospital_id || t.hospital_id === hospitalId)
  );
  if (token) {
    token.status = 'SKIPPED';
    token.position = 0;
    token.estimated_wait_minutes = 0;
    return token;
  }
  return null;
}

export async function cancelHospitalToken(tokenId, hospitalId = null) {
  if (isValidUuid(tokenId)) {
    const res = await runQuery(
      `UPDATE hospital_tokens
       SET status = 'CANCELLED', position = 0, estimated_wait_minutes = 0, cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND ($2::UUID IS NULL OR hospital_id = $2)
       RETURNING *;`,
      [tokenId, isValidUuid(hospitalId) ? hospitalId : null]
    );
    if (res && res.rows && res.rows[0]) return res.rows[0];
  }

  const token = mockHospitalStore.tokens.find(
    (t) => t.id === tokenId && (!hospitalId || !t.hospital_id || t.hospital_id === hospitalId)
  );
  if (token) {
    token.status = 'CANCELLED';
    token.position = 0;
    token.estimated_wait_minutes = 0;
    token.cancelled_at = new Date().toISOString();
    return token;
  }
  return null;
}
