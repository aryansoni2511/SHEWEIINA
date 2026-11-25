import { query, getClient } from '../config/db.js';

/**
 * Validates if a string is a standard UUID v4
 */
export function isValidUuid(val) {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

/**
 * In-memory Mock Store for Government Centres, Services, Counters & Tokens
 * Used in isolated tests or when PostgreSQL pool is in fallback mode.
 */
export const mockGovtStore = {
  centres: [
    {
      id: 'gcentre-101',
      name: 'Maha E-Seva Kendra — Dadar Citizen Facility',
      slug: 'maha-e-seva-dadar',
      centre_code: 'MSK-MUM-400028',
      centre_type: 'Maha E-Seva Kendra / Citizen Service Desk',
      phone: '02224156789',
      email: 'dadar.seva@shewwina.org',
      address: 'Shop 12, Ground Floor, Chhabildas Road, Near Dadar Railway Station (West)',
      city: 'Mumbai',
      district: 'Mumbai City',
      state: 'Maharashtra',
      pincode: '400028',
      latitude: 19.0178,
      longitude: 72.8478,
      operating_hours: 'Mon - Sat (09:30 AM - 05:30 PM)',
      supported_categories: ['Aadhaar', 'Passport', 'RTO', 'Municipal'],
      is_verified: true,
      admin_user_id: 'usr-admin-101',
      is_active: true,
      created_at: new Date('2026-01-01T09:00:00Z').toISOString(),
    },
    {
      id: 'gcentre-102',
      name: 'Aadhaar Seva Kendra — Andheri Facilitation Desk',
      slug: 'aadhaar-seva-andheri',
      centre_code: 'ASK-MUM-400058',
      centre_type: 'Aadhaar Enrolment & Update Centre',
      phone: '02226201234',
      email: 'andheri.ask@shewwina.org',
      address: 'Unit 4, Crystal Point Mall, New Link Road, Andheri West',
      city: 'Mumbai',
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      pincode: '400058',
      latitude: 19.1363,
      longitude: 72.8276,
      operating_hours: 'Mon - Sat (09:00 AM - 06:00 PM)',
      supported_categories: ['Aadhaar', 'Municipal'],
      is_verified: true,
      admin_user_id: 'usr-admin-102',
      is_active: true,
      created_at: new Date('2026-01-01T09:00:00Z').toISOString(),
    },
  ],

  services: [
    {
      id: 'gserv-101',
      category: 'Aadhaar',
      name: 'Aadhaar Demographic Update',
      slug: 'aadhaar-demographic-update',
      description: 'Update Name, Address, Date of Birth, Gender, Mobile Number, or Email ID in your Aadhaar record.',
      estimated_duration_minutes: 15,
      official_fee: 50.00,
      facilitation_fee: 30.00,
      official_fee_source: 'UIDAI Circular No. 14/2020 (Official Update Fee)',
      official_portal_url: 'https://uidai.gov.in',
      fee_last_verified_date: '2026-11-14',
      eligibility_criteria: 'Any existing Aadhaar holder with valid documentary proof of requested update.',
      required_documents: [
        { title: 'Existing Aadhaar Card / Letter', mandatory: true, isOriginalRequired: true, isPhotocopyRequired: true, notes: 'Must present physical Aadhaar card or e-Aadhaar printout' },
        { title: 'Proof of Identity (PoI)', mandatory: false, isOriginalRequired: true, isPhotocopyRequired: true, notes: 'Passport, PAN, Voter ID, or Driving Licence (mandatory if changing Name)' },
        { title: 'Proof of Address (PoA)', mandatory: false, isOriginalRequired: true, isPhotocopyRequired: true, notes: 'Electricity Bill, Ration Card, Bank Passbook, or Rent Agreement (mandatory if changing Address)' }
      ],
      is_active: true,
      created_at: new Date('2026-01-01T09:00:00Z').toISOString(),
    },
    {
      id: 'gserv-102',
      category: 'Passport',
      name: 'Fresh Passport Application & PSK Guidance',
      slug: 'fresh-passport-guidance',
      description: 'Document pre-verification, application check, and Passport Seva Kendra (PSK/POPSK) token assistance.',
      estimated_duration_minutes: 25,
      official_fee: 1500.00,
      facilitation_fee: 100.00,
      official_fee_source: 'CPV Division, Ministry of External Affairs',
      official_portal_url: 'https://passportindia.gov.in',
      fee_last_verified_date: '2026-11-14',
      eligibility_criteria: 'Indian citizens residing in India without existing passport or criminal disqualifications.',
      required_documents: [
        { title: 'Proof of Present Address (PoA)', mandatory: true, isOriginalRequired: true, isPhotocopyRequired: true, notes: 'Aadhaar, Electricity Bill, Water Bill, or Bank Passbook of last 1 year' },
        { title: 'Proof of Date of Birth (DoB)', mandatory: true, isOriginalRequired: true, isPhotocopyRequired: true, notes: 'Birth Certificate issued by Municipal Authority or School Leaving Certificate' },
        { title: 'Educational Qualification Proof (ECNR)', mandatory: true, isOriginalRequired: true, isPhotocopyRequired: true, notes: '10th standard matriculation certificate for Non-ECR status' }
      ],
      is_active: true,
      created_at: new Date('2026-01-01T09:00:00Z').toISOString(),
    },
    {
      id: 'gserv-103',
      category: 'RTO',
      name: 'Learner Licence (LL) Slot Guidance',
      slug: 'learner-licence-guidance',
      description: 'Application assistance, slot booking, and computerized theory test checklist for Learner Licence.',
      estimated_duration_minutes: 15,
      official_fee: 150.00,
      facilitation_fee: 50.00,
      official_fee_source: 'Ministry of Road Transport and Highways (MoRTH)',
      official_portal_url: 'https://parivahan.gov.in',
      fee_last_verified_date: '2026-11-14',
      eligibility_criteria: 'Minimum age 16 for non-geared 50cc two-wheelers, age 18 for geared motor vehicles.',
      required_documents: [
        { title: 'Proof of Age', mandatory: true, isOriginalRequired: true, isPhotocopyRequired: true, notes: 'Birth Certificate, 10th marksheet, PAN, or Passport' },
        { title: 'Proof of Address', mandatory: true, isOriginalRequired: true, isPhotocopyRequired: true, notes: 'Aadhaar Card, Voter ID, or Utility bill in applicant name' },
        { title: 'Form 1 (Self Physical Fitness Declaration)', mandatory: true, isOriginalRequired: true, isPhotocopyRequired: false, notes: 'Available online via Sarathi Parivahan' }
      ],
      is_active: true,
      created_at: new Date('2026-01-01T09:00:00Z').toISOString(),
    },
    {
      id: 'gserv-104',
      category: 'Municipal',
      name: 'Birth & Death Certificate Issuance',
      slug: 'birth-death-certificate',
      description: 'Civil Registration System (CRS) counter token and application checklist for official vital records.',
      estimated_duration_minutes: 15,
      official_fee: 20.00,
      facilitation_fee: 30.00,
      official_fee_source: 'Registration of Births and Deaths Act (RBD)',
      official_portal_url: 'https://crsorgi.gov.in',
      fee_last_verified_date: '2026-11-14',
      eligibility_criteria: 'Event occurred within municipal corporation jurisdiction and reported within prescribed period.',
      required_documents: [
        { title: 'Hospital Discharge / Birth Summary Slip', mandatory: true, isOriginalRequired: true, isPhotocopyRequired: true, notes: 'Original hospital institutional discharge summary' },
        { title: 'Parents / Informant Identity Proof', mandatory: true, isOriginalRequired: true, isPhotocopyRequired: true, notes: 'Aadhaar cards of both parents/spouse' }
      ],
      is_active: true,
      created_at: new Date('2026-01-01T09:00:00Z').toISOString(),
    },
  ],

  counters: [
    {
      id: 'gcnt-101',
      centre_id: 'gcentre-101',
      counter_number: 'Counter 1',
      counter_name: 'Aadhaar Biometric & Demographic Desk',
      operator_name: 'Sanjay Deshmukh',
      assigned_category: 'Aadhaar',
      is_open: true,
      token_prefix: 'ADH',
      current_sequence: 1,
      max_daily_capacity: 150,
      created_at: new Date('2026-01-01T09:00:00Z').toISOString(),
    },
    {
      id: 'gcnt-102',
      centre_id: 'gcentre-101',
      counter_number: 'Counter 2',
      counter_name: 'Passport & RTO Documentation Desk',
      operator_name: 'Pooja Kulkarni',
      assigned_category: 'Passport',
      is_open: true,
      token_prefix: 'DOC',
      current_sequence: 1,
      max_daily_capacity: 150,
      created_at: new Date('2026-01-01T09:00:00Z').toISOString(),
    },
  ],

  tokens: [],
};

/* ─── Query Helper ───────────────────────────────────────────────────────── */

async function runQuery(sql, params = []) {
  try {
    return await query(sql, params);
  } catch (err) {
    if (process.env.NODE_ENV === 'production') throw err;
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Centres Model
// ─────────────────────────────────────────────────────────────────────────────

export async function findGovernmentCentreById(id) {
  if (!id) return null;
  if (isValidUuid(id)) {
    const res = await runQuery(`SELECT * FROM government_centres WHERE id = $1 LIMIT 1;`, [id]);
    if (res !== null) return res.rows[0] || null;
  }
  return mockGovtStore.centres.find((c) => c.id === id) || null;
}

export async function findGovernmentCentreBySlug(slug) {
  if (!slug) return null;
  const res = await runQuery(`SELECT * FROM government_centres WHERE slug = $1 LIMIT 1;`, [slug.trim().toLowerCase()]);
  if (res !== null) return res.rows[0] || null;
  return mockGovtStore.centres.find((c) => c.slug === slug || c.id === slug) || null;
}

export async function findGovernmentCentreByAdminUserId(userId) {
  if (!userId) return null;
  if (isValidUuid(userId)) {
    const res = await runQuery(`SELECT * FROM government_centres WHERE admin_user_id = $1 LIMIT 1;`, [userId]);
    if (res !== null) return res.rows[0] || null;
  }
  return mockGovtStore.centres.find((c) => c.admin_user_id === userId) || null;
}

export async function searchGovernmentCentres({
  search = '',
  city = '',
  pincode = '',
  category = '',
} = {}) {
  const conditions = ['is_active = TRUE'];
  const params = [];
  let paramIdx = 1;

  if (search && search.trim()) {
    conditions.push(`(name ILIKE $${paramIdx} OR address ILIKE $${paramIdx} OR centre_code ILIKE $${paramIdx})`);
    params.push(`%${search.trim()}%`);
    paramIdx++;
  }

  if (city && city.trim()) {
    conditions.push(`city ILIKE $${paramIdx}`);
    params.push(`%${city.trim()}%`);
    paramIdx++;
  }

  if (pincode && pincode.trim()) {
    conditions.push(`pincode ILIKE $${paramIdx}`);
    params.push(`%${pincode.trim()}%`);
    paramIdx++;
  }

  if (category && category.trim() && category !== 'All') {
    conditions.push(`$${paramIdx} = ANY(supported_categories)`);
    params.push(category.trim());
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT
      c.*,
      (SELECT COUNT(*)::int FROM government_counters cnt WHERE cnt.centre_id = c.id AND cnt.is_open = TRUE) as open_counters_count,
      (SELECT COUNT(*)::int FROM government_tokens t WHERE t.centre_id = c.id AND t.status = 'WAITING') as waiting_citizens_count
    FROM government_centres c
    ${whereClause}
    ORDER BY c.is_verified DESC, c.name ASC;
  `;

  const res = await runQuery(sql, params);
  let list = [];
  if (res !== null) {
    list = res.rows || [];
  } else {
    list = mockGovtStore.centres.filter((c) => {
      if (!c.is_active) return false;
      if (city && !c.city.toLowerCase().includes(city.toLowerCase())) return false;
      if (pincode && !c.pincode.includes(pincode)) return false;
      if (category && category !== 'All' && !c.supported_categories.includes(category)) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.address.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }

  const seen = new Set();
  const deduped = [];
  for (const c of list) {
    const key = c.id || c.centre_code;
    if (key && !seen.has(key)) {
      seen.add(key);
      deduped.push(c);
    }
  }
  return deduped;
}

export async function createGovernmentCentre({
  businessId = null,
  name,
  slug,
  centreCode,
  centreType = 'Citizen Facilitation Centre',
  phone,
  email,
  address,
  city = 'Mumbai',
  district = 'Mumbai',
  state = 'Maharashtra',
  pincode,
  latitude = 19.0760,
  longitude = 72.8777,
  operatingHours = 'Mon - Sat (09:30 AM - 05:30 PM)',
  supportedCategories = ['Aadhaar', 'Passport', 'RTO', 'Municipal'],
  adminUserId = null,
  isVerified = false,
}) {
  const sql = `
    INSERT INTO government_centres (
      business_id, name, slug, centre_code, centre_type, phone, email,
      address, city, district, state, pincode, latitude, longitude,
      operating_hours, supported_categories, admin_user_id, is_verified
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    RETURNING *;
  `;
  const res = await runQuery(sql, [
    businessId,
    name.trim(),
    slug.trim().toLowerCase(),
    centreCode.trim(),
    centreType,
    phone.trim(),
    email.trim().toLowerCase(),
    address.trim(),
    city.trim(),
    district.trim(),
    state.trim(),
    pincode.trim(),
    latitude,
    longitude,
    operatingHours,
    supportedCategories,
    adminUserId,
    isVerified,
  ]);

  if (res !== null && res.rows && res.rows[0]) return res.rows[0];
  if (res !== null) return null;

  const newCentre = {
    id: `gcentre-${Date.now()}`,
    business_id: businessId,
    name: name.trim(),
    slug: slug.trim().toLowerCase(),
    centre_code: centreCode.trim(),
    centre_type: centreType,
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
    address: address.trim(),
    city: city.trim(),
    district: district.trim(),
    state: state.trim(),
    pincode: pincode.trim(),
    latitude,
    longitude,
    operating_hours: operatingHours,
    supported_categories: supportedCategories,
    admin_user_id: adminUserId,
    is_verified: isVerified,
    is_active: true,
    created_at: new Date().toISOString(),
  };
  mockGovtStore.centres.push(newCentre);
  return newCentre;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Services Catalog Model
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllGovernmentServices(category = null) {
  const conditions = ['is_active = TRUE'];
  const params = [];

  if (category && category !== 'All') {
    conditions.push('category = $1');
    params.push(category.trim());
  }

  const sql = `
    SELECT * FROM government_services
    WHERE ${conditions.join(' AND ')}
    ORDER BY category ASC, name ASC;
  `;
  const res = await runQuery(sql, params);
  if (res !== null) return res.rows || [];

  return mockGovtStore.services.filter((s) => {
    if (!s.is_active) return false;
    if (category && category !== 'All' && s.category !== category) return false;
    return true;
  });
}

export async function findGovernmentServiceBySlug(slug) {
  if (!slug) return null;
  const res = await runQuery(
    `SELECT * FROM government_services WHERE slug = $1 AND is_active = TRUE LIMIT 1;`,
    [slug.trim().toLowerCase()]
  );
  if (res !== null) return res.rows[0] || null;
  return mockGovtStore.services.find((s) => s.slug === slug || s.id === slug) || null;
}

export async function findGovernmentServiceById(id) {
  if (!id) return null;
  if (isValidUuid(id)) {
    const res = await runQuery(`SELECT * FROM government_services WHERE id = $1 LIMIT 1;`, [id]);
    if (res !== null) return res.rows[0] || null;
  }
  return mockGovtStore.services.find((s) => s.id === id) || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Counters Model
// ─────────────────────────────────────────────────────────────────────────────

export async function findGovernmentCountersByCentreId(centreId) {
  if (!centreId) return [];
  if (isValidUuid(centreId)) {
    const sql = `
      SELECT
        cnt.*,
        (
          SELECT json_build_object(
            'id', t.id,
            'token_number', t.token_number,
            'citizen_name', t.citizen_name,
            'service_name', s.name
          )
          FROM government_tokens t
          JOIN government_services s ON s.id = t.service_id
          WHERE t.counter_id = cnt.id AND t.status = 'SERVING'
          ORDER BY t.called_at DESC
          LIMIT 1
        ) as active_serving,
        (
          SELECT COUNT(*)::int
          FROM government_tokens t
          WHERE t.counter_id = cnt.id AND t.status = 'WAITING'
        ) as waiting_count
      FROM government_counters cnt
      WHERE cnt.centre_id = $1
      ORDER BY cnt.counter_number ASC;
    `;
    const res = await runQuery(sql, [centreId]);
    if (res !== null) return res.rows || [];
  }

  const counters = mockGovtStore.counters.filter((c) => c.centre_id === centreId);
  return counters.map((cnt) => {
    const serving = mockGovtStore.tokens.find((t) => t.counter_id === cnt.id && t.status === 'SERVING');
    const waitingCount = mockGovtStore.tokens.filter((t) => t.counter_id === cnt.id && t.status === 'WAITING').length;
    return {
      ...cnt,
      active_serving: serving ? { id: serving.id, token_number: serving.token_number, citizen_name: serving.citizen_name } : null,
      waiting_count: waitingCount,
    };
  });
}

export async function findGovernmentCounterById(id) {
  if (!id) return null;
  if (isValidUuid(id)) {
    const res = await runQuery(`SELECT * FROM government_counters WHERE id = $1 LIMIT 1;`, [id]);
    if (res !== null) return res.rows[0] || null;
  }
  return mockGovtStore.counters.find((c) => c.id === id) || null;
}

export async function createGovernmentCounter({
  centreId,
  counterNumber,
  counterName = 'General Desk',
  operatorName = null,
  assignedCategory = 'All',
  tokenPrefix = 'G',
  maxDailyCapacity = 150,
}) {
  const sql = `
    INSERT INTO government_counters (
      centre_id, counter_number, counter_name, operator_name,
      assigned_category, token_prefix, max_daily_capacity
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const res = await runQuery(sql, [
    centreId,
    counterNumber.trim(),
    counterName.trim(),
    operatorName ? operatorName.trim() : null,
    assignedCategory,
    tokenPrefix.trim().toUpperCase(),
    maxDailyCapacity,
  ]);
  if (res !== null && res.rows && res.rows[0]) return res.rows[0];
  if (res !== null) return null;

  const newCounter = {
    id: `gcnt-${Date.now()}`,
    centre_id: centreId,
    counter_number: counterNumber.trim(),
    counter_name: counterName.trim(),
    operator_name: operatorName ? operatorName.trim() : null,
    assigned_category: assignedCategory,
    token_prefix: tokenPrefix.trim().toUpperCase(),
    current_sequence: 0,
    max_daily_capacity: maxDailyCapacity,
    is_open: true,
    created_at: new Date().toISOString(),
  };
  mockGovtStore.counters.push(newCounter);
  return newCounter;
}

export async function toggleGovernmentCounterStatus(counterId, isOpen) {
  if (isValidUuid(counterId)) {
    const res = await runQuery(
      `UPDATE government_counters
       SET is_open = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *;`,
      [counterId, Boolean(isOpen)]
    );
    if (res !== null) return res.rows[0] || null;
  }

  const counter = mockGovtStore.counters.find((c) => c.id === counterId);
  if (counter) {
    counter.is_open = Boolean(isOpen);
  }
  return counter || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Tokens & Queue Operations
// ─────────────────────────────────────────────────────────────────────────────

export async function findActiveTokenByPhoneAndService(phone, serviceId) {
  if (!phone || !serviceId) return null;
  if (isValidUuid(serviceId)) {
    const res = await runQuery(
      `SELECT * FROM government_tokens
       WHERE citizen_phone = $1
         AND service_id = $2
         AND status IN ('WAITING', 'SERVING')
         AND created_at >= CURRENT_DATE
       LIMIT 1;`,
      [phone.trim(), serviceId]
    );
    if (res !== null) return res.rows[0] || null;
  }

  return (
    mockGovtStore.tokens.find(
      (t) => t.citizen_phone === phone.trim() && t.service_id === serviceId && ['WAITING', 'SERVING'].includes(t.status)
    ) || null
  );
}

export async function createGovernmentToken({
  centreId,
  counterId = null,
  serviceId,
  citizenName,
  citizenPhone,
  citizenEmail = null,
  appointmentType = 'WALK_IN',
  appointmentDate = null,
  appointmentSlot = 'Immediate Walk-in',
  checklistCompleted = false,
  verifiedDocumentsCount = 0,
}) {
  let targetCounter = null;
  if (counterId) {
    targetCounter = await findGovernmentCounterById(counterId);
  } else {
    const service = await findGovernmentServiceById(serviceId);
    const counters = await findGovernmentCountersByCentreId(centreId);
    targetCounter =
      counters.find((c) => c.is_open && (c.assigned_category === service?.category || c.assigned_category === 'All')) ||
      counters.find((c) => c.is_open) ||
      counters[0];
  }

  const assignedCounterId = targetCounter?.id || null;
  const prefix = targetCounter?.token_prefix || 'G';
  const service = await findGovernmentServiceById(serviceId);
  const duration = service?.estimated_duration_minutes || 15;

  const client = await getClient();
  if (client) {
    try {
      await client.query('BEGIN');

      // Concurrent duplicate-token prevention via FOR UPDATE check
      const dupCheck = await client.query(
        `SELECT id, token_number, status FROM government_tokens
         WHERE citizen_phone = $1
           AND service_id = $2
           AND status IN ('WAITING', 'SERVING')
           AND created_at >= CURRENT_DATE
         FOR UPDATE LIMIT 1;`,
        [citizenPhone.trim(), serviceId]
      );

      if (dupCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        const dup = dupCheck.rows[0];
        const err = new Error(
          `You already have an active queue token (#${dup.token_number}) for this service today.`
        );
        err.statusCode = 409;
        err.name = 'ConflictError';
        err.code = 'DUPLICATE_ACTIVE_TOKEN';
        err.details = {
          code: 'DUPLICATE_ACTIVE_TOKEN',
          tokenId: dup.id,
          tokenNumber: dup.token_number,
          status: dup.status || 'WAITING',
          centreId,
          serviceId,
        };
        throw err;
      }

      // Lock counter sequence atomically to avoid race conditions and roll back on failure
      let seq = 1;
      let actualPrefix = prefix;
      if (assignedCounterId && isValidUuid(assignedCounterId)) {
        const counterLock = await client.query(
          `SELECT id, token_prefix, current_sequence FROM government_counters WHERE id = $1 FOR UPDATE;`,
          [assignedCounterId]
        );
        if (counterLock.rows.length > 0) {
          actualPrefix = counterLock.rows[0].token_prefix || prefix;
          const seqRes = await client.query(
            `UPDATE government_counters
             SET current_sequence = current_sequence + 1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING current_sequence;`,
            [assignedCounterId]
          );
          seq = seqRes.rows[0].current_sequence;
        }
      }

      const tokenNumber = `${actualPrefix}-${seq}`;

      const posRes = await client.query(
        `SELECT COUNT(*)::int as waiting_ahead
         FROM government_tokens
         WHERE centre_id = $1 AND status = 'WAITING';`,
        [centreId]
      );
      const position = (posRes.rows[0]?.waiting_ahead || 0) + 1;
      const estimatedWaitMinutes = Math.max(0, (position - 1) * duration);

      const insertSql = `
        INSERT INTO government_tokens (
          centre_id, counter_id, service_id, citizen_name, citizen_phone, citizen_email,
          token_number, sequence_number, appointment_type, appointment_date, appointment_slot,
          status, position, estimated_wait_minutes, checklist_completed, verified_documents_count
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, CURRENT_DATE), $11, 'WAITING', $12, $13, $14, $15)
        RETURNING *;
      `;
      const insertRes = await client.query(insertSql, [
        centreId,
        assignedCounterId && isValidUuid(assignedCounterId) ? assignedCounterId : null,
        serviceId,
        citizenName.trim(),
        citizenPhone.trim(),
        citizenEmail ? citizenEmail.trim() : null,
        tokenNumber,
        seq,
        appointmentType,
        appointmentDate,
        appointmentSlot,
        position,
        estimatedWaitMinutes,
        checklistCompleted,
        verifiedDocumentsCount,
      ]);

      await client.query('COMMIT');
      return insertRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Fallback in-memory mock store
  const existingToken = mockGovtStore.tokens.find(
    (t) =>
      t.citizen_phone === citizenPhone.trim() &&
      t.service_id === serviceId &&
      ['WAITING', 'SERVING'].includes(t.status)
  );
  if (existingToken) {
    const err = new Error(
      `You already have an active queue token (#${existingToken.token_number}) for this service today.`
    );
    err.statusCode = 409;
    err.name = 'ConflictError';
    err.code = 'DUPLICATE_ACTIVE_TOKEN';
    err.details = {
      code: 'DUPLICATE_ACTIVE_TOKEN',
      tokenId: existingToken.id,
      tokenNumber: existingToken.token_number,
      status: existingToken.status,
      centreId,
      serviceId,
    };
    throw err;
  }

  const previousSeq = targetCounter ? targetCounter.current_sequence || 0 : 0;
  let seq = 1;
  try {
    if (targetCounter) {
      targetCounter.current_sequence = (targetCounter.current_sequence || 0) + 1;
      seq = targetCounter.current_sequence;
    } else {
      seq = mockGovtStore.tokens.length + 1;
    }

    const tokenNumber = `${prefix}-${seq}`;
    const position = mockGovtStore.tokens.filter((t) => t.centre_id === centreId && t.status === 'WAITING').length + 1;
    const estimatedWaitMinutes = Math.max(0, (position - 1) * duration);

    const newToken = {
      id: `gtok-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      centre_id: centreId,
      counter_id: assignedCounterId,
      service_id: serviceId,
      citizen_name: citizenName.trim(),
      citizen_phone: citizenPhone.trim(),
      citizen_email: citizenEmail ? citizenEmail.trim() : null,
      token_number: tokenNumber,
      sequence_number: seq,
      appointment_type: appointmentType,
      appointment_date: appointmentDate || new Date().toISOString().split('T')[0],
      appointment_slot: appointmentSlot,
      status: 'WAITING',
      position,
      estimated_wait_minutes: estimatedWaitMinutes,
      checklist_completed: checklistCompleted,
      verified_documents_count: verifiedDocumentsCount,
      called_at: null,
      served_at: null,
      cancelled_at: null,
      created_at: new Date().toISOString(),
    };
    mockGovtStore.tokens.push(newToken);
    return newToken;
  } catch (err) {
    if (targetCounter) {
      targetCounter.current_sequence = previousSeq;
    }
    throw err;
  }
}

export async function findGovernmentTokenById(id) {
  if (!id) return null;
  const sql = `
    SELECT
      t.*,
      c.name as centre_name,
      c.address as centre_address,
      c.city as centre_city,
      c.phone as centre_phone,
      c.slug as centre_slug,
      s.name as service_name,
      s.category as service_category,
      s.official_fee,
      s.facilitation_fee,
      s.official_portal_url,
      s.required_documents,
      cnt.counter_number,
      cnt.counter_name,
      cnt.operator_name,
      CASE
        WHEN t.status = 'WAITING' THEN (
          SELECT COUNT(*)::int
          FROM government_tokens wa
          WHERE wa.centre_id = t.centre_id
            AND wa.status = 'WAITING'
            AND wa.sequence_number < t.sequence_number
        )
        ELSE 0
      END as people_ahead
    FROM government_tokens t
    JOIN government_centres c ON c.id = t.centre_id
    JOIN government_services s ON s.id = t.service_id
    LEFT JOIN government_counters cnt ON cnt.id = t.counter_id
    WHERE t.id::text = $1 OR t.token_number = $1
    LIMIT 1;
  `;
  const res = await runQuery(sql, [id.trim()]);
  if (res !== null) return res.rows[0] || null;

  const tok = mockGovtStore.tokens.find((t) => t.id === id || t.token_number === id);
  if (!tok) return null;

  const centre = mockGovtStore.centres.find((c) => c.id === tok.centre_id);
  const service = mockGovtStore.services.find((s) => s.id === tok.service_id);
  const counter = mockGovtStore.counters.find((c) => c.id === tok.counter_id);

  let peopleAhead = 0;
  if (tok.status === 'WAITING') {
    peopleAhead = mockGovtStore.tokens.filter(
      (t) => t.centre_id === tok.centre_id && t.status === 'WAITING' && t.sequence_number < tok.sequence_number
    ).length;
  }

  return {
    ...tok,
    centre_name: centre?.name || 'Maha E-Seva Kendra',
    centre_address: centre?.address || 'Mumbai',
    centre_city: centre?.city || 'Mumbai',
    centre_phone: centre?.phone || '02224156789',
    centre_slug: centre?.slug || 'maha-e-seva-dadar',
    service_name: service?.name || 'Government Citizen Service',
    service_category: service?.category || 'Aadhaar',
    official_fee: service?.official_fee || 50,
    facilitation_fee: service?.facilitation_fee || 30,
    official_portal_url: service?.official_portal_url || 'https://uidai.gov.in',
    required_documents: service?.required_documents || [],
    counter_number: counter?.counter_number || null,
    counter_name: counter?.counter_name || null,
    operator_name: counter?.operator_name || null,
    people_ahead: peopleAhead,
  };
}

export async function callNextGovernmentCitizen(centreId, counterId) {
  const client = await getClient();
  if (client) {
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE government_tokens
         SET status = 'SERVED', served_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE counter_id = $1 AND status = 'SERVING';`,
        [counterId]
      );

      const nextRes = await client.query(
        `UPDATE government_tokens
         SET status = 'SERVING', counter_id = $2, called_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = (
           SELECT id FROM government_tokens
           WHERE centre_id = $1
             AND (counter_id = $2 OR counter_id IS NULL)
             AND status = 'WAITING'
           ORDER BY sequence_number ASC
           LIMIT 1
           FOR UPDATE SKIP LOCKED
         )
         RETURNING *;`,
        [centreId, counterId]
      );

      await client.query('COMMIT');
      if (nextRes.rows && nextRes.rows[0]) {
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

  // Fallback in-memory
  const currentServing = mockGovtStore.tokens.find(
    (t) => t.counter_id === counterId && t.status === 'SERVING'
  );
  if (currentServing) {
    currentServing.status = 'SERVED';
    currentServing.served_at = new Date().toISOString();
  }

  const waitingToken = mockGovtStore.tokens.find(
    (t) => t.centre_id === centreId && (t.counter_id === counterId || !t.counter_id) && t.status === 'WAITING'
  );
  if (waitingToken) {
    waitingToken.status = 'SERVING';
    waitingToken.called_at = new Date().toISOString();
    waitingToken.counter_id = counterId;
  }
  return waitingToken || null;
}

export async function completeGovernmentToken(tokenId) {
  if (isValidUuid(tokenId)) {
    const res = await runQuery(
      `UPDATE government_tokens
       SET status = 'SERVED', served_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *;`,
      [tokenId]
    );
    if (res !== null) return res.rows[0] || null;
  }

  const tok = mockGovtStore.tokens.find((t) => t.id === tokenId);
  if (tok) {
    tok.status = 'SERVED';
    tok.served_at = new Date().toISOString();
  }
  return tok || null;
}

export async function skipGovernmentToken(tokenId) {
  if (isValidUuid(tokenId)) {
    const res = await runQuery(
      `UPDATE government_tokens
       SET status = 'SKIPPED', cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *;`,
      [tokenId]
    );
    if (res !== null) return res.rows[0] || null;
  }

  const tok = mockGovtStore.tokens.find((t) => t.id === tokenId);
  if (tok) {
    tok.status = 'SKIPPED';
    tok.cancelled_at = new Date().toISOString();
  }
  return tok || null;
}

export async function cancelGovernmentToken(tokenId) {
  if (isValidUuid(tokenId)) {
    const res = await runQuery(
      `UPDATE government_tokens
       SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *;`,
      [tokenId]
    );
    if (res !== null) return res.rows[0] || null;
  }

  const tok = mockGovtStore.tokens.find((t) => t.id === tokenId);
  if (tok) {
    tok.status = 'CANCELLED';
    tok.cancelled_at = new Date().toISOString();
  }
  return tok || null;
}

export async function getGovernmentDashboardData(centreId) {
  const centre = await findGovernmentCentreById(centreId);
  if (!centre) return null;

  const counters = await findGovernmentCountersByCentreId(centreId);

  if (isValidUuid(centreId)) {
    const summaryRes = await runQuery(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'WAITING')::int as total_waiting,
         COUNT(*) FILTER (WHERE status = 'SERVING')::int as total_serving,
         COUNT(*) FILTER (WHERE status = 'SERVED' AND created_at >= CURRENT_DATE)::int as total_served_today,
         COUNT(*) FILTER (WHERE status = 'SKIPPED' AND created_at >= CURRENT_DATE)::int as total_skipped_today,
         COUNT(*)::int as total_tokens_today
       FROM government_tokens
       WHERE centre_id = $1 AND created_at >= CURRENT_DATE;`,
      [centreId]
    );

    const waitingRes = await runQuery(
      `SELECT
         t.*,
         s.name as service_name,
         s.category as service_category,
         cnt.counter_number,
         cnt.counter_name
       FROM government_tokens t
       JOIN government_services s ON s.id = t.service_id
       LEFT JOIN government_counters cnt ON cnt.id = t.counter_id
       WHERE t.centre_id = $1 AND t.status IN ('WAITING', 'SERVING')
       ORDER BY t.status DESC, t.sequence_number ASC
       LIMIT 50;`,
      [centreId]
    );

    if (summaryRes !== null) {
      const activeTokens = waitingRes?.rows || [];
      return {
        centre,
        counters,
        summary: summaryRes.rows[0] || {
          total_waiting: 0,
          total_serving: 0,
          total_served_today: 0,
          total_skipped_today: 0,
          total_tokens_today: 0,
        },
        activeTokens,
        serving: activeTokens.filter((t) => t.status === 'SERVING'),
        waiting: activeTokens.filter((t) => t.status === 'WAITING'),
      };
    }
  }

  // In-memory fallback
  const centreTokens = mockGovtStore.tokens.filter((t) => t.centre_id === centreId);
  const activeTokens = centreTokens
    .filter((t) => ['WAITING', 'SERVING'].includes(t.status))
    .map((t) => {
      const service = mockGovtStore.services.find((s) => s.id === t.service_id);
      const counter = mockGovtStore.counters.find((c) => c.id === t.counter_id);
      return {
        ...t,
        service_name: service?.name || 'Citizen Service',
        service_category: service?.category || 'General',
        counter_number: counter?.counter_number || 'Counter 1',
        counter_name: counter?.counter_name || 'Desk',
      };
    });

  return {
    centre,
    counters,
    summary: {
      total_waiting: centreTokens.filter((t) => t.status === 'WAITING').length,
      total_serving: centreTokens.filter((t) => t.status === 'SERVING').length,
      total_served_today: centreTokens.filter((t) => t.status === 'SERVED').length,
      total_skipped_today: centreTokens.filter((t) => t.status === 'SKIPPED').length,
      total_tokens_today: centreTokens.length,
    },
    activeTokens,
    serving: activeTokens.filter((t) => t.status === 'SERVING'),
    waiting: activeTokens.filter((t) => t.status === 'WAITING'),
  };
}
