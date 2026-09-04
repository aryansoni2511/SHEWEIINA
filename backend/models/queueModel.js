import { query } from '../config/db.js';

/**
 * Queue Model — Data Access Layer for Shewwina Core Queue System
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(val) {
  return typeof val === 'string' && UUID_REGEX.test(val);
}

function guardProduction() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database error: PostgreSQL connection is required in production mode. MockStore fallback is disabled.');
  }
}

// In-Memory Fallback Store (for offline local dev/unit testing when PostgreSQL is disconnected)
const mockStore = {
  businesses: [
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Shewwina Salon & Spa',
      slug: 'demo',
      category: 'salon',
      phone: '+919876543210',
      email: 'contact@shewwinasalon.com',
      address: 'Shop 12, Phoenix Mall, Lower Parel',
      city: 'Mumbai',
      is_active: true,
    },
  ],
  services: [
    {
      id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      business_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Haircut & Styling',
      duration_minutes: 30,
      price: 500.0,
      is_active: true,
    },
    {
      id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      business_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Beard Trim & Grooming',
      duration_minutes: 15,
      price: 250.0,
      is_active: true,
    },
  ],
  queues: [
    {
      id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
      business_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Main Express Queue',
      is_open: true,
      current_sequence: 2,
      sms_notifications_enabled: true,
      whatsapp_notifications_enabled: false,
      turn_alert_threshold: 2,
    },
    {
      id: 'd3eebc99-closed-queue-id',
      business_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Closed Evening Queue',
      is_open: false,
      current_sequence: 0,
      sms_notifications_enabled: true,
      whatsapp_notifications_enabled: false,
      turn_alert_threshold: 2,
    },
  ],
  tokens: [
    {
      id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
      queue_id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
      business_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      service_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      customer_name: 'Rahul Sharma',
      customer_phone: '+919800011122',
      token_number: 'S-101',
      sequence_number: 1,
      status: 'SERVING',
      position: 0,
      estimated_wait_minutes: 0,
      called_at: new Date().toISOString(),
      served_at: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
      queue_id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
      business_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      service_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      customer_name: 'Priya Verma',
      customer_phone: '+919800033344',
      token_number: 'S-102',
      sequence_number: 2,
      status: 'WAITING',
      position: 1,
      estimated_wait_minutes: 15,
      called_at: null,
      served_at: null,
      created_at: new Date().toISOString(),
    },
  ],
  users: [
    {
      id: 'u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
      name: 'Salon Owner',
      email: 'owner@shewwina.com',
      phone: '+919876543210',
      password_hash: '$2a$10$xeZWtpeK/b6p4GxPVzYUx.vrtGWMK1MpRhepesx4seU4Vd5qyGO8i',
      role: 'BUSINESS',
      business_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      created_at: new Date().toISOString(),
    },
  ],
};

export async function findBusinessById(businessId) {
  if (!businessId) return null;
  if (isValidUuid(businessId)) {
    const res = await query('SELECT * FROM businesses WHERE (id = $1::uuid OR slug = $1::text) AND is_active = TRUE;', [businessId]);
    if (res) return res.rows[0] || null;
  } else {
    const res = await query('SELECT * FROM businesses WHERE slug = $1 AND is_active = TRUE;', [businessId]);
    if (res) return res.rows[0] || null;
  }
  guardProduction();
  return mockStore.businesses.find((b) => b.id === businessId || b.slug === businessId) || null;
}

export async function findBusinessBySlug(slug) {
  if (!slug) return null;
  if (isValidUuid(slug)) {
    const res = await query('SELECT * FROM businesses WHERE (id = $1::uuid OR slug = $1::text) AND is_active = TRUE;', [slug]);
    if (res) return res.rows[0] || null;
  } else {
    const res = await query('SELECT * FROM businesses WHERE slug = $1 AND is_active = TRUE;', [slug]);
    if (res) return res.rows[0] || null;
  }
  guardProduction();
  return mockStore.businesses.find((b) => b.slug === slug || b.id === slug) || null;
}

export async function findQueueById(queueId) {
  if (!queueId) return null;
  if (isValidUuid(queueId)) {
    const res = await query('SELECT * FROM queues WHERE id = $1;', [queueId]);
    if (res) return res.rows[0] || null;
  }
  guardProduction();
  return mockStore.queues.find((q) => q.id === queueId) || null;
}

export async function findQueueByBusinessId(businessId) {
  if (!businessId) return null;
  if (isValidUuid(businessId)) {
    const res = await query('SELECT * FROM queues WHERE business_id = $1 ORDER BY is_open DESC LIMIT 1;', [businessId]);
    if (res) return res.rows[0] || null;
  }
  guardProduction();
  return mockStore.queues.find((q) => q.business_id === businessId) || mockStore.queues[0];
}

export async function findServiceById(serviceId) {
  if (!serviceId) return null;
  if (isValidUuid(serviceId)) {
    const res = await query('SELECT * FROM services WHERE id = $1;', [serviceId]);
    if (res && res.rows[0]) {
      const row = res.rows[0];
      return { ...row, price: parseFloat(row.price || 0) };
    }
    return null;
  }
  guardProduction();
  return mockStore.services.find((s) => s.id === serviceId) || null;
}

export async function findServicesByBusinessId(businessId, includeInactive = false) {
  if (isValidUuid(businessId)) {
    const sql = includeInactive
      ? 'SELECT * FROM services WHERE business_id = $1 ORDER BY created_at ASC;'
      : 'SELECT * FROM services WHERE business_id = $1 AND is_active = TRUE ORDER BY created_at ASC;';
    const res = await query(sql, [businessId]);
    if (res) return res.rows.map((row) => ({ ...row, price: parseFloat(row.price || 0) }));
  }
  guardProduction();
  return mockStore.services.filter((s) => (s.business_id === businessId || s.business_id === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') && (includeInactive || s.is_active));
}

export async function createService({ businessId, name, durationMinutes = 15, price = 0, description = '' }) {
  if (isValidUuid(businessId)) {
    const res = await query(
      `INSERT INTO services (business_id, name, duration_minutes, price, description, is_active)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING *;`,
      [businessId, name, durationMinutes, price, description]
    );

    if (res && res.rows[0]) {
      const row = res.rows[0];
      return { ...row, price: parseFloat(row.price || 0) };
    }
  }
  guardProduction();

  const newService = {
    id: `svc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    business_id: businessId,
    name,
    duration_minutes: Number(durationMinutes),
    price: Number(price),
    description,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  mockStore.services.push(newService);
  return newService;
}

export async function updateService(serviceId, businessId, { name, durationMinutes, price, description, isActive }) {
  if (isValidUuid(serviceId) && isValidUuid(businessId)) {
    const res = await query(
      `UPDATE services
       SET name = COALESCE($3, name),
           duration_minutes = COALESCE($4, duration_minutes),
           price = COALESCE($5, price),
           description = COALESCE($6, description),
           is_active = COALESCE($7, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND business_id = $2
       RETURNING *;`,
      [serviceId, businessId, name, durationMinutes, price, description, isActive]
    );

    if (res && res.rows[0]) {
      const row = res.rows[0];
      return { ...row, price: parseFloat(row.price || 0) };
    }
  }
  guardProduction();

  const svc = mockStore.services.find((s) => s.id === serviceId && (s.business_id === businessId || s.business_id === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
  if (!svc) return null;

  if (name !== undefined) svc.name = name;
  if (durationMinutes !== undefined) svc.duration_minutes = Number(durationMinutes);
  if (price !== undefined) svc.price = Number(price);
  if (description !== undefined) svc.description = description;
  if (isActive !== undefined) svc.is_active = Boolean(isActive);
  svc.updated_at = new Date().toISOString();

  return svc;
}

export async function toggleServiceStatus(serviceId, businessId, isActive) {
  if (isValidUuid(serviceId) && isValidUuid(businessId)) {
    const res = await query(
      `UPDATE services
       SET is_active = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND business_id = $2
       RETURNING *;`,
      [serviceId, businessId, Boolean(isActive)]
    );

    if (res) {
      return res.rows[0] || null;
    }
  }
  guardProduction();

  const svc = mockStore.services.find((s) => s.id === serviceId && (s.business_id === businessId || s.business_id === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
  if (!svc) return null;

  svc.is_active = Boolean(isActive);
  svc.updated_at = new Date().toISOString();

  return svc;
}

export async function createToken({ queueId, businessId, serviceId, customerName, customerPhone, estimatedWaitMinutes = 15, userId = null }) {
  const isDbEligible = isValidUuid(queueId) && isValidUuid(businessId) && (!serviceId || isValidUuid(serviceId)) && (!userId || isValidUuid(userId));

  let sequenceNumber;
  if (isDbEligible) {
    const seqRes = await query(
      'UPDATE queues SET current_sequence = current_sequence + 1 WHERE id = $1 RETURNING current_sequence;',
      [queueId]
    );
    if (seqRes && seqRes.rows.length > 0) {
      sequenceNumber = seqRes.rows[0].current_sequence;
    }
  }
  if (!sequenceNumber) {
    guardProduction();
    const queue = mockStore.queues.find((q) => q.id === queueId);
    if (queue) {
      queue.current_sequence += 1;
      sequenceNumber = queue.current_sequence;
    } else {
      sequenceNumber = mockStore.tokens.length + 1;
    }
  }

  const queueObj = await findQueueById(queueId);
  const prefix = queueObj?.token_prefix || queueObj?.tokenPrefix || 'S';
  const tokenNumber = `${prefix}-${100 + sequenceNumber}`;

  let position;
  if (isDbEligible) {
    const countRes = await query(
      "SELECT COUNT(*)::int as waiting_count FROM tokens WHERE queue_id = $1 AND status = 'WAITING';",
      [queueId]
    );
    if (countRes && countRes.rows.length > 0) {
      position = countRes.rows[0].waiting_count + 1;
    }
  }
  if (position === undefined) {
    guardProduction();
    position = mockStore.tokens.filter((t) => (t.queue_id === queueId || t.business_id === businessId) && t.status === 'WAITING').length + 1;
  }

  if (isDbEligible) {
    const insertRes = await query(
      `INSERT INTO tokens (queue_id, business_id, service_id, customer_name, customer_phone, token_number, sequence_number, status, position, estimated_wait_minutes, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'WAITING', $8, $9, $10)
       RETURNING *;`,
      [queueId, businessId, serviceId, customerName, customerPhone, tokenNumber, sequenceNumber, position, estimatedWaitMinutes, userId]
    );

    if (insertRes && insertRes.rows.length > 0) {
      return insertRes.rows[0];
    }
  }
  guardProduction();

  const newToken = {
    id: `token-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    queue_id: queueId,
    business_id: businessId,
    service_id: serviceId,
    user_id: userId,
    customer_name: customerName,
    customer_phone: customerPhone,
    token_number: tokenNumber,
    sequence_number: sequenceNumber,
    status: 'WAITING',
    position,
    estimated_wait_minutes: estimatedWaitMinutes,
    called_at: null,
    served_at: null,
    created_at: new Date().toISOString(),
  };

  mockStore.tokens.push(newToken);
  return newToken;
}

export async function findTokenById(tokenId) {
  if (!tokenId) return null;
  if (isValidUuid(tokenId)) {
    const res = await query(
      `SELECT t.*, s.name as service_name, s.duration_minutes as service_duration
       FROM tokens t
       LEFT JOIN services s ON t.service_id = s.id
       WHERE t.id = $1::uuid OR t.token_number = $2::text;`,
      [tokenId, tokenId]
    );
    if (res) return res.rows[0] || null;
  } else {
    const res = await query(
      `SELECT t.*, s.name as service_name, s.duration_minutes as service_duration
       FROM tokens t
       LEFT JOIN services s ON t.service_id = s.id
       WHERE t.token_number = $1;`,
      [tokenId]
    );
    if (res) return res.rows[0] || null;
  }
  guardProduction();
  
  const token = mockStore.tokens.find((t) => t.id === tokenId || t.token_number === tokenId);
  if (!token) return null;
  const service = mockStore.services.find((s) => s.id === token.service_id);
  return {
    ...token,
    service_name: service ? service.name : 'General Service',
    service_duration: service ? service.duration_minutes : 15,
  };
}

export async function findTokensByQueueId(queueId) {
  if (isValidUuid(queueId)) {
    const res = await query(
      `SELECT t.*, s.name as service_name
       FROM tokens t
       LEFT JOIN services s ON t.service_id = s.id
       WHERE t.queue_id = $1
       ORDER BY
         CASE status
         WHEN 'SERVING' THEN 1
         WHEN 'WAITING' THEN 2
         WHEN 'SKIPPED' THEN 3
         ELSE 4
       END,
       sequence_number ASC;`,
      [queueId]
    );
    if (res) return res.rows;
  }
  guardProduction();
  return mockStore.tokens
    .filter((t) => t.queue_id === queueId)
    .sort((a, b) => a.sequence_number - b.sequence_number);
}

export async function getPeopleAheadCount(queueId, tokenSequenceNumber) {
  if (isValidUuid(queueId)) {
    const res = await query(
      "SELECT COUNT(*)::int as count FROM tokens WHERE queue_id = $1 AND status = 'WAITING' AND sequence_number < $2;",
      [queueId, tokenSequenceNumber]
    );
    if (res) return res.rows[0] ? res.rows[0].count : 0;
  }
  guardProduction();
  return mockStore.tokens.filter(
    (t) => t.queue_id === queueId && t.status === 'WAITING' && t.sequence_number < tokenSequenceNumber
  ).length;
}

/**
 * Transitions currently SERVING token to SERVED, then calls the next WAITING token.
 * Ensures only ONE token is active SERVING at a time per queue.
 */
export async function callNextWaitingToken(queueId, businessId) {
  if (isValidUuid(queueId)) {
    // 1. Mark any existing SERVING token as SERVED
    await query(
      `UPDATE tokens
       SET status = 'SERVED', served_at = CURRENT_TIMESTAMP
       WHERE queue_id = $1 AND status = 'SERVING';`,
      [queueId]
    );

    // 2. Atomically pick & update the next WAITING token to SERVING
    const nextRes = await query(
      `UPDATE tokens
       SET status = 'SERVING', called_at = CURRENT_TIMESTAMP, position = 0, estimated_wait_minutes = 0
       WHERE id = (
         SELECT id FROM tokens
         WHERE queue_id = $1 AND status = 'WAITING'
         ORDER BY sequence_number ASC
         FOR UPDATE SKIP LOCKED
         LIMIT 1
       )
       RETURNING *;`,
      [queueId]
    );

    if (nextRes) {
      return nextRes.rows[0] || null;
    }
  }
  guardProduction();

  // Fallback for mockStore / test environment
  mockStore.tokens.forEach((t) => {
    if ((t.queue_id === queueId || t.business_id === businessId) && t.status === 'SERVING') {
      t.status = 'SERVED';
      t.served_at = new Date().toISOString();
    }
  });

  const nextWaitingToken = mockStore.tokens.find(
    (t) => (t.queue_id === queueId || t.business_id === businessId) && t.status === 'WAITING'
  );

  if (!nextWaitingToken) {
    return null;
  }

  nextWaitingToken.status = 'SERVING';
  nextWaitingToken.position = 0;
  nextWaitingToken.estimated_wait_minutes = 0;
  nextWaitingToken.called_at = new Date().toISOString();

  let currentPos = 1;
  mockStore.tokens.forEach((t) => {
    if ((t.queue_id === queueId || t.business_id === businessId) && t.status === 'WAITING') {
      t.position = currentPos++;
    }
  });

  return nextWaitingToken;
}

/**
 * Marks currently SERVING token as SERVED (Completed Service).
 */
export async function completeServingToken(queueId, businessId) {
  if (isValidUuid(queueId)) {
    const completeRes = await query(
      `UPDATE tokens
       SET status = 'SERVED', served_at = CURRENT_TIMESTAMP
       WHERE queue_id = $1 AND status = 'SERVING'
       RETURNING *;`,
      [queueId]
    );

    if (completeRes) {
      return completeRes.rows[0] || null;
    }
  }
  guardProduction();

  const activeServing = mockStore.tokens.find(
    (t) => (t.queue_id === queueId || t.business_id === businessId) && t.status === 'SERVING'
  );

  if (!activeServing) {
    return null;
  }

  activeServing.status = 'SERVED';
  activeServing.served_at = new Date().toISOString();

  return activeServing;
}

export async function findUserByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  const res = await query('SELECT * FROM users WHERE LOWER(email) = $1;', [cleanEmail]);
  if (res) return res.rows[0] || null;
  guardProduction();
  return mockStore.users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
}

export async function findUserById(userId) {
  if (!userId) return null;
  if (isValidUuid(userId)) {
    const res = await query('SELECT * FROM users WHERE id = $1;', [userId]);
    if (res) return res.rows[0] || null;
  }
  guardProduction();
  return mockStore.users.find((u) => u.id === userId) || null;
}

export async function createUser({ name, email, phone, passwordHash, role = 'CUSTOMER', businessId = null }) {
  const cleanEmail = email.trim().toLowerCase();
  const dbBusinessId = isValidUuid(businessId) ? businessId : null;
  const insertRes = await query(
    `INSERT INTO users (name, email, phone, password_hash, role, business_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *;`,
    [name.trim(), cleanEmail, phone || null, passwordHash, role, dbBusinessId]
  );

  if (insertRes) {
    return insertRes.rows[0] || null;
  }
  guardProduction();

  const newUser = {
    id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: name.trim(),
    email: cleanEmail,
    phone: phone || null,
    password_hash: passwordHash,
    role,
    business_id: businessId,
    created_at: new Date().toISOString(),
  };

  mockStore.users.push(newUser);
  return newUser;
}

export async function createBusinessWithOwner({
  ownerName,
  email,
  phone,
  passwordHash,
  businessName,
  category = 'salon',
  address = '',
  city = '',
}) {
  const cleanEmail = email.trim().toLowerCase();
  const baseSlug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || `biz-${Date.now()}`;
  let slug = baseSlug;

  // 1. Create Business with collision-safe retry
  let business;
  let attempts = 0;
  while (attempts < 10) {
    try {
      const bizRes = await query(
        `INSERT INTO businesses (name, slug, category, phone, email, address, city, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
         RETURNING *;`,
        [businessName.trim(), slug, category, phone, cleanEmail, address, city]
      );

      if (bizRes && bizRes.rows.length > 0) {
        business = bizRes.rows[0];
        break;
      }
      break;
    } catch (err) {
      if (err.code === '23505' && (err.constraint === 'businesses_slug_key' || (err.message && err.message.includes('businesses_slug_key')))) {
        attempts++;
        slug = `${baseSlug}-${Date.now().toString(36)}-${attempts}`;
        continue;
      }
      throw err;
    }
  }

  if (!business) {
    guardProduction();
    let mockSlug = baseSlug;
    if (mockStore.businesses.some((b) => b.slug === mockSlug)) {
      mockSlug = `${baseSlug}-${Date.now()}`;
    }
    business = {
      id: `biz-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: businessName.trim(),
      slug: mockSlug,
      category,
      phone,
      email: cleanEmail,
      address,
      city,
      is_active: true,
    };
    mockStore.businesses.push(business);
  }

  // 2. Create Default Main Queue for Business
  let queue;
  if (isValidUuid(business.id)) {
    const queueRes = await query(
      `INSERT INTO queues (business_id, name, is_open, current_sequence)
       VALUES ($1, $2, TRUE, 0)
       RETURNING *;`,
      [business.id, `${businessName.trim()} Express Queue`]
    );

    if (queueRes && queueRes.rows.length > 0) {
      queue = queueRes.rows[0];
    }
  }
  if (!queue) {
    guardProduction();
    queue = {
      id: `queue-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      business_id: business.id,
      name: `${businessName.trim()} Express Queue`,
      is_open: true,
      current_sequence: 0,
      sms_notifications_enabled: true,
      whatsapp_notifications_enabled: false,
      turn_alert_threshold: 2,
    };
    mockStore.queues.push(queue);
  }

  // 3. Create Default Service
  if (isValidUuid(business.id)) {
    await query(
      `INSERT INTO services (business_id, name, duration_minutes, price, is_active)
       VALUES ($1, 'General Service', 15, 300.0, TRUE)
       RETURNING *;`,
      [business.id]
    );
  } else {
    guardProduction();
    mockStore.services.push({
      id: `svc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      business_id: business.id,
      name: 'General Service',
      duration_minutes: 15,
      price: 300.0,
      is_active: true,
    });
  }

  // 4. Create User linked to Business with role = 'BUSINESS'
  const user = await createUser({
    name: ownerName,
    email: cleanEmail,
    phone,
    passwordHash,
    role: 'BUSINESS',
    businessId: business.id,
  });

  return { user, business, queue };
}

export async function findTokensByUserId(userId, userPhone = null) {
  const cleanPhone = userPhone ? userPhone.trim() : null;
  if (isValidUuid(userId)) {
    const res = await query(
      `SELECT t.*, b.name as business_name, s.name as service_name
       FROM tokens t
       LEFT JOIN businesses b ON t.business_id = b.id
       LEFT JOIN services s ON t.service_id = s.id
       WHERE t.user_id = $1 OR (t.user_id IS NULL AND $2::text IS NOT NULL AND $2::text != '' AND t.customer_phone = $2)
       ORDER BY t.created_at DESC;`,
      [userId, cleanPhone]
    );
    if (res) return res.rows;
  } else if (cleanPhone) {
    const res = await query(
      `SELECT t.*, b.name as business_name, s.name as service_name
       FROM tokens t
       LEFT JOIN businesses b ON t.business_id = b.id
       LEFT JOIN services s ON t.service_id = s.id
       WHERE t.user_id IS NULL AND t.customer_phone = $1
       ORDER BY t.created_at DESC;`,
      [cleanPhone]
    );
    if (res) return res.rows;
  }
  guardProduction();

  return mockStore.tokens
    .filter((t) => t.user_id === userId || (!t.user_id && cleanPhone && t.customer_phone === cleanPhone))
    .map((t) => {
      const biz = mockStore.businesses.find((b) => b.id === t.business_id);
      const svc = mockStore.services.find((s) => s.id === t.service_id);
      return {
        ...t,
        business_name: biz ? biz.name : 'Shewwina Salon',
        service_name: svc ? svc.name : 'General Service',
      };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function findActiveTokenByUserId(userId, userPhone = null) {
  const allTokens = await findTokensByUserId(userId, userPhone);
  return allTokens.find((t) => t.status === 'WAITING' || t.status === 'SERVING') || null;
}

export async function cancelToken(tokenId) {
  if (!tokenId) return null;
  if (isValidUuid(tokenId)) {
    const res = await query(
      `UPDATE tokens
       SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP
       WHERE id = $1::uuid OR token_number = $2::text
       RETURNING *;`,
      [tokenId, tokenId]
    );
    if (res) return res.rows[0] || null;
  } else {
    const res = await query(
      `UPDATE tokens
       SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP
       WHERE token_number = $1;`,
      [tokenId]
    );
    if (res) return res.rows[0] || null;
  }
  guardProduction();

  const token = mockStore.tokens.find((t) => t.id === tokenId || t.token_number === tokenId);
  if (!token) return null;

  token.status = 'CANCELLED';
  token.cancelled_at = new Date().toISOString();
  return token;
}

export async function updateBusiness(businessId, { name, category, phone, address, city, description }) {
  if (isValidUuid(businessId)) {
    const res = await query(
      `UPDATE businesses
       SET name = COALESCE($2, name),
           category = COALESCE($3, category),
           phone = COALESCE($4, phone),
           address = COALESCE($5, address),
           city = COALESCE($6, city),
           description = COALESCE($7, description),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1::uuid OR slug = $1::text
       RETURNING *;`,
      [businessId, name, category, phone, address, city, description]
    );
    if (res) return res.rows[0] || null;
  } else {
    const res = await query(
      `UPDATE businesses
       SET name = COALESCE($2, name),
           category = COALESCE($3, category),
           phone = COALESCE($4, phone),
           address = COALESCE($5, address),
           city = COALESCE($6, city),
           description = COALESCE($7, description),
           updated_at = CURRENT_TIMESTAMP
       WHERE slug = $1
       RETURNING *;`,
      [businessId, name, category, phone, address, city, description]
    );
    if (res) return res.rows[0] || null;
  }
  guardProduction();

  const biz = mockStore.businesses.find((b) => b.id === businessId || b.slug === businessId);
  if (!biz) return null;

  if (name) biz.name = name;
  if (category) biz.category = category;
  if (phone) biz.phone = phone;
  if (address) biz.address = address;
  if (city) biz.city = city;
  if (description) biz.description = description;

  return biz;
}

export async function updateQueueConfig(queueId, businessId, {
  name,
  isOpen,
  tokenPrefix,
  maxDailyCapacity,
  avgServiceDuration,
  smsNotificationsEnabled,
  whatsappNotificationsEnabled,
  turnAlertThreshold,
}) {
  if (isValidUuid(queueId) && isValidUuid(businessId)) {
    const res = await query(
      `UPDATE queues
       SET name = COALESCE($3, name),
           is_open = COALESCE($4, is_open),
           token_prefix = COALESCE($5, token_prefix),
           max_daily_capacity = COALESCE($6, max_daily_capacity),
           avg_service_duration = COALESCE($7, avg_service_duration),
           sms_notifications_enabled = COALESCE($8, sms_notifications_enabled),
           whatsapp_notifications_enabled = COALESCE($9, whatsapp_notifications_enabled),
           turn_alert_threshold = COALESCE($10, turn_alert_threshold),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND business_id = $2
       RETURNING *;`,
      [
        queueId,
        businessId,
        name,
        isOpen,
        tokenPrefix,
        maxDailyCapacity,
        avgServiceDuration,
        smsNotificationsEnabled,
        whatsappNotificationsEnabled,
        turnAlertThreshold,
      ]
    );

    if (res) {
      return res.rows[0] || null;
    }
  }
  guardProduction();

  const q = mockStore.queues.find((q) => q.id === queueId && (q.business_id === businessId || q.business_id === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
  if (!q) return null;

  if (name !== undefined) q.name = name;
  if (isOpen !== undefined) q.is_open = Boolean(isOpen);
  if (tokenPrefix !== undefined) q.token_prefix = tokenPrefix;
  if (maxDailyCapacity !== undefined) q.max_daily_capacity = Number(maxDailyCapacity);
  if (avgServiceDuration !== undefined) q.avg_service_duration = Number(avgServiceDuration);
  if (smsNotificationsEnabled !== undefined) q.sms_notifications_enabled = Boolean(smsNotificationsEnabled);
  if (whatsappNotificationsEnabled !== undefined) q.whatsapp_notifications_enabled = Boolean(whatsappNotificationsEnabled);
  if (turnAlertThreshold !== undefined) q.turn_alert_threshold = Number(turnAlertThreshold);
  q.updated_at = new Date().toISOString();

  return q;
}

export async function skipToken(tokenId, queueId, businessId) {
  if (isValidUuid(tokenId) && isValidUuid(queueId) && isValidUuid(businessId)) {
    const skipRes = await query(
      `UPDATE tokens
       SET status = 'SKIPPED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND queue_id = $2 AND business_id = $3 AND status = 'WAITING'
       RETURNING *;`,
      [tokenId, queueId, businessId]
    );

    if (skipRes && skipRes.rows.length > 0) {
      await query(
        `UPDATE tokens
         SET position = subq.new_pos
         FROM (
           SELECT id, ROW_NUMBER() OVER (ORDER BY sequence_number ASC) AS new_pos
           FROM tokens
           WHERE queue_id = $1 AND status = 'WAITING'
         ) subq
         WHERE tokens.id = subq.id;`,
        [queueId]
      );
      return skipRes.rows[0];
    }

    if (skipRes && skipRes.rows.length === 0) {
      return null;
    }
  }
  guardProduction();

  const token = mockStore.tokens.find(
    (t) =>
      t.id === tokenId &&
      (t.queue_id === queueId || t.business_id === businessId) &&
      t.status === 'WAITING'
  );

  if (!token) return null;

  token.status = 'SKIPPED';
  token.updated_at = new Date().toISOString();

  let pos = 1;
  mockStore.tokens
    .filter(
      (t) =>
        (t.queue_id === queueId || t.business_id === businessId) &&
        t.status === 'WAITING'
    )
    .sort((a, b) => a.sequence_number - b.sequence_number)
    .forEach((t) => {
      t.position = pos++;
    });

  return token;
}

export async function getRecentThroughput(queueId, limit = 10) {
  if (isValidUuid(queueId)) {
    const res = await query(
      `SELECT ROUND(
         AVG(EXTRACT(EPOCH FROM (served_at - called_at)) / 60)::numeric,
         1
       )::float AS avg_minutes
       FROM (
         SELECT served_at, called_at
         FROM tokens
         WHERE queue_id = $1
           AND status = 'SERVED'
           AND served_at IS NOT NULL
           AND called_at IS NOT NULL
         ORDER BY served_at DESC
         LIMIT $2
       ) recent;`,
      [queueId, limit]
    );

    if (res) {
      if (res.rows.length > 0 && res.rows[0].avg_minutes != null) {
        return parseFloat(res.rows[0].avg_minutes);
      }
      return null;
    }
  }
  guardProduction();

  const servedWithBoth = mockStore.tokens.filter(
    (t) => t.queue_id === queueId && t.status === 'SERVED' && t.served_at && t.called_at
  );
  if (servedWithBoth.length === 0) return null;

  const recent = servedWithBoth.slice(-limit);
  const avgMs =
    recent.reduce((sum, t) => sum + (new Date(t.served_at) - new Date(t.called_at)), 0) /
    recent.length;
  return Math.round((avgMs / 60000) * 10) / 10;
}

export default {
  findBusinessById,
  findBusinessBySlug,
  findQueueById,
  findQueueByBusinessId,
  findServiceById,
  findServicesByBusinessId,
  createToken,
  findTokenById,
  findTokensByQueueId,
  getPeopleAheadCount,
  callNextWaitingToken,
  completeServingToken,
  findUserByEmail,
  findUserById,
  createUser,
  createBusinessWithOwner,
  findTokensByUserId,
  findActiveTokenByUserId,
  cancelToken,
  updateBusiness,
  createService,
  updateService,
  toggleServiceStatus,
  updateQueueConfig,
  skipToken,
  getRecentThroughput,
};
