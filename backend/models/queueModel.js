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

let customQueryHandler = null;

export function setCustomQueryHandler(handler) {
  customQueryHandler = handler;
}

async function runQuery(text, params = []) {
  if (customQueryHandler) {
    return customQueryHandler(text, params);
  }
  return query(text, params);
}

export async function findBusinessById(businessId) {
  if (!businessId) return null;
  if (isValidUuid(businessId)) {
    try {
      const res = await runQuery('SELECT * FROM businesses WHERE (id = $1::uuid OR slug = $1::text) AND is_active = TRUE;', [businessId]);
      if (res && res.rows) return res.rows[0] || null;
    } catch (err) {
      if (process.env.NODE_ENV === 'production') throw err;
    }
  } else {
    try {
      const res = await runQuery('SELECT * FROM businesses WHERE slug = $1 AND is_active = TRUE;', [businessId]);
      if (res && res.rows) return res.rows[0] || null;
    } catch (err) {
      if (process.env.NODE_ENV === 'production') throw err;
    }
  }
  guardProduction();
  return mockStore.businesses.find((b) => b.id === businessId || b.slug === businessId) || null;
}

export async function findBusinessBySlug(slug) {
  if (!slug) return null;
  if (isValidUuid(slug)) {
    try {
      const res = await runQuery('SELECT * FROM businesses WHERE (id = $1::uuid OR slug = $1::text) AND is_active = TRUE;', [slug]);
      if (res && res.rows) return res.rows[0] || null;
    } catch (err) {
      if (process.env.NODE_ENV === 'production') throw err;
    }
  } else {
    try {
      const res = await runQuery('SELECT * FROM businesses WHERE slug = $1 AND is_active = TRUE;', [slug]);
      if (res && res.rows) return res.rows[0] || null;
    } catch (err) {
      if (process.env.NODE_ENV === 'production') throw err;
    }
  }
  guardProduction();
  return mockStore.businesses.find((b) => b.slug === slug || b.id === slug) || null;
}

export async function findQueueById(queueId) {
  if (!queueId) return null;
  if (isValidUuid(queueId)) {
    try {
      const res = await runQuery('SELECT * FROM queues WHERE id = $1;', [queueId]);
      if (res && res.rows) return res.rows[0] || null;
    } catch (err) {
      if (process.env.NODE_ENV === 'production') throw err;
    }
  }
  guardProduction();
  return mockStore.queues.find((q) => q.id === queueId) || null;
}

export async function findQueueByBusinessId(businessId) {
  if (!businessId) return null;
  if (isValidUuid(businessId)) {
    try {
      const res = await runQuery('SELECT * FROM queues WHERE business_id = $1 ORDER BY is_open DESC LIMIT 1;', [businessId]);
      if (res && res.rows) return res.rows[0] || null;
    } catch (err) {
      if (process.env.NODE_ENV === 'production') throw err;
    }
  }
  guardProduction();
  return mockStore.queues.find((q) => q.business_id === businessId) || mockStore.queues[0];
}

export async function findServiceById(serviceId) {
  if (!serviceId) return null;
  if (isValidUuid(serviceId)) {
    try {
      const res = await runQuery('SELECT * FROM services WHERE id = $1;', [serviceId]);
      if (res && res.rows && res.rows[0]) {
        const row = res.rows[0];
        return { ...row, price: parseFloat(row.price || 0) };
      }
      if (process.env.NODE_ENV === 'production' && res) {
        return null;
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        throw err;
      }
      // In development/mock mode, gracefully fall back to mockStore
    }
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

export async function createToken({ queueId, businessId, serviceId, customerName, customerPhone, estimatedWaitMinutes = 15, userId = null, servicePriceAtJoin = null }) {
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

  // Normalise price snapshot: null if not provided or invalid
  const priceSnapshot = (servicePriceAtJoin !== null && servicePriceAtJoin !== undefined && !isNaN(Number(servicePriceAtJoin)))
    ? Number(servicePriceAtJoin)
    : null;

  if (isDbEligible) {
    const insertRes = await query(
      `INSERT INTO tokens (queue_id, business_id, service_id, customer_name, customer_phone, token_number, sequence_number, status, position, estimated_wait_minutes, user_id, service_price_at_join)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'WAITING', $8, $9, $10, $11)
       RETURNING *;`,
      [queueId, businessId, serviceId, customerName, customerPhone, tokenNumber, sequenceNumber, position, estimatedWaitMinutes, userId, priceSnapshot]
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
    service_price_at_join: priceSnapshot,
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

/**
 * Calculates estimated revenue for a business for the current IST calendar day.
 *
 * Revenue rule: ONLY tokens with status = 'SERVED' contribute.
 * WAITING, SERVING, CANCELLED, and SKIPPED tokens contribute ₹0.
 *
 * Historical correctness: uses service_price_at_join (snapshot taken at join time)
 * when available. Falls back to the current services.price for legacy tokens
 * (created before migration 007) that have no snapshot stored.
 *
 * Tenant isolation: businessId parameter is always the authenticated business's
 * UUID from the JWT — never trusted from request body/query.
 *
 * IST day boundary: uses 'Asia/Kolkata' timezone so "today" respects IST midnight,
 * not UTC midnight (which is 5:30h behind IST).
 *
 * @param {string} businessId — authenticated business UUID
 * @returns {{ estimated_revenue: number, customers_served: number }}
 */
export async function getEstimatedRevenueToday(businessId) {
  if (!businessId) return { estimated_revenue: 0, customers_served: 0 };

  if (isValidUuid(businessId)) {
    try {
      const res = await runQuery(
        `SELECT
           COALESCE(SUM(COALESCE(t.service_price_at_join, s.price, 0)), 0)::float AS estimated_revenue,
           COUNT(*)::int AS customers_served
         FROM tokens t
         LEFT JOIN services s ON t.service_id = s.id
         WHERE t.business_id = $1
           AND t.status = 'SERVED'
           AND (t.served_at AT TIME ZONE 'Asia/Kolkata')::date
               = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date;`,
        [businessId]
      );

      if (res && res.rows) {
        return {
          estimated_revenue: parseFloat(res.rows[0]?.estimated_revenue ?? 0) || 0,
          customers_served: parseInt(res.rows[0]?.customers_served ?? 0, 10) || 0,
        };
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'production') throw err;
      // In non-production, fall through to mockStore
    }
  }

  guardProduction();

  // ---- MockStore fallback (offline dev / unit-test mode) ----
  // Determine today's date boundaries in IST.
  const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const todayIST = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate());
  const tomorrowIST = new Date(todayIST.getTime() + 86400000);

  const servedToday = mockStore.tokens.filter((t) => {
    if (t.business_id !== businessId) return false;
    if (t.status !== 'SERVED') return false;
    if (!t.served_at) return false;
    // Convert served_at to IST and compare date
    const servedAtIST = new Date(
      new Date(t.served_at).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
    );
    return servedAtIST >= todayIST && servedAtIST < tomorrowIST;
  });

  const estimated_revenue = servedToday.reduce((sum, t) => {
    // Prefer snapshot; fall back to current service price
    const price = (t.service_price_at_join !== null && t.service_price_at_join !== undefined)
      ? parseFloat(t.service_price_at_join)
      : (parseFloat(mockStore.services.find((s) => s.id === t.service_id)?.price) || 0);
    return sum + price;
  }, 0);

  return { estimated_revenue, customers_served: servedToday.length };
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

export async function getBusinessAnalytics(businessId, period = 'today') {
  const normalizedPeriod = (period || 'today').toLowerCase().trim();
  if (!['today', '7d', '30d'].includes(normalizedPeriod)) {
    const err = new Error("Invalid analytics period. Must be 'today', '7d', or '30d'.");
    err.statusCode = 400;
    throw err;
  }

  if (!businessId || !isValidUuid(businessId)) {
    return {
      period: normalizedPeriod,
      hasData: false,
      summary: {
        totalTokens: 0,
        waitingCount: 0,
        servingCount: 0,
        servedCount: 0,
        cancelledCount: 0,
        skippedCount: 0,
        totalRevenue: 0,
        avgTicketValue: 0,
        completionRate: 0,
        cancellationRate: 0,
        skipRate: 0,
        queueLoadLevel: 'OPTIMAL',
      },
      flow: [],
      revenue: {
        totalRevenue: 0,
        avgTicketValue: 0,
        servedCustomerCount: 0,
        daily: [],
      },
      services: [],
      queueLoad: {
        currentWaiting: 0,
        currentServing: 0,
        currentServed: 0,
        currentCancelled: 0,
        currentSkipped: 0,
        peakWaiting: 0,
        loadLevel: 'OPTIMAL',
      },
      waitTime: {
        avgWaitMinutes: null,
        minWaitMinutes: null,
        maxWaitMinutes: null,
        distribution: { under10m: 0, m10to20m: 0, m20to30m: 0, over30m: 0 },
      },
      serviceDuration: {
        avgDurationMinutes: null,
        minDurationMinutes: null,
        maxDurationMinutes: null,
        isMeasurable: false,
      },
      peakHour: null,
    };
  }

  // Calculate IST date boundaries
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayStr = istFormatter.format(now);
  const [year, month, day] = todayStr.split('-').map(Number);
  const midnightTodayISTinUTC = Date.UTC(year, month - 1, day, 0, 0, 0) - (5.5 * 3600 * 1000);
  const endOfTodayUTC = new Date(midnightTodayISTinUTC + 24 * 3600 * 1000);

  let startDateUTC;
  let numDays = 1;
  if (normalizedPeriod === '7d') {
    numDays = 7;
    startDateUTC = new Date(midnightTodayISTinUTC - 6 * 24 * 3600 * 1000);
  } else if (normalizedPeriod === '30d') {
    numDays = 30;
    startDateUTC = new Date(midnightTodayISTinUTC - 29 * 24 * 3600 * 1000);
  } else {
    numDays = 1;
    startDateUTC = new Date(midnightTodayISTinUTC);
  }

  const startIso = startDateUTC.toISOString();
  const endIso = endOfTodayUTC.toISOString();

  // Helper for 12h label
  const formatHourLabel = (h) => `${h === 0 ? 12 : h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}`;

  // ─── 1. Live PostgreSQL Execution via runQuery ────────────────────────────
  try {
    const summaryRes = await runQuery(
      `SELECT
         COUNT(*)::int AS total_tokens,
         COUNT(CASE WHEN t.status = 'WAITING' THEN 1 END)::int AS waiting_count,
         COUNT(CASE WHEN t.status = 'SERVING' THEN 1 END)::int AS serving_count,
         COUNT(CASE WHEN t.status = 'SERVED' THEN 1 END)::int AS served_count,
         COUNT(CASE WHEN t.status = 'CANCELLED' THEN 1 END)::int AS cancelled_count,
         COUNT(CASE WHEN t.status = 'SKIPPED' THEN 1 END)::int AS skipped_count,
         COALESCE(SUM(CASE WHEN t.status = 'SERVED' THEN COALESCE(t.service_price_at_join, s.price, 0) ELSE 0 END), 0)::float AS total_revenue,
         ROUND(AVG(CASE WHEN t.status IN ('SERVING', 'SERVED') AND (t.called_at IS NOT NULL OR t.served_at IS NOT NULL)
           THEN EXTRACT(EPOCH FROM (COALESCE(t.called_at, t.served_at) - t.created_at)) / 60
           ELSE NULL END)::numeric, 1)::float AS avg_wait_minutes,
         ROUND(MIN(CASE WHEN t.status IN ('SERVING', 'SERVED') AND (t.called_at IS NOT NULL OR t.served_at IS NOT NULL)
           THEN EXTRACT(EPOCH FROM (COALESCE(t.called_at, t.served_at) - t.created_at)) / 60
           ELSE NULL END)::numeric, 1)::float AS min_wait_minutes,
         ROUND(MAX(CASE WHEN t.status IN ('SERVING', 'SERVED') AND (t.called_at IS NOT NULL OR t.served_at IS NOT NULL)
           THEN EXTRACT(EPOCH FROM (COALESCE(t.called_at, t.served_at) - t.created_at)) / 60
           ELSE NULL END)::numeric, 1)::float AS max_wait_minutes,
         ROUND(AVG(CASE WHEN t.status = 'SERVED' AND t.called_at IS NOT NULL AND t.served_at IS NOT NULL
           THEN EXTRACT(EPOCH FROM (t.served_at - t.called_at)) / 60
           ELSE NULL END)::numeric, 1)::float AS avg_service_minutes,
         ROUND(MIN(CASE WHEN t.status = 'SERVED' AND t.called_at IS NOT NULL AND t.served_at IS NOT NULL
           THEN EXTRACT(EPOCH FROM (t.served_at - t.called_at)) / 60
           ELSE NULL END)::numeric, 1)::float AS min_service_minutes,
         ROUND(MAX(CASE WHEN t.status = 'SERVED' AND t.called_at IS NOT NULL AND t.served_at IS NOT NULL
           THEN EXTRACT(EPOCH FROM (t.served_at - t.called_at)) / 60
           ELSE NULL END)::numeric, 1)::float AS max_service_minutes
       FROM tokens t
       LEFT JOIN services s ON t.service_id = s.id
       WHERE t.business_id = $1
         AND t.created_at >= $2
         AND t.created_at < $3;`,
      [businessId, startIso, endIso]
    );

    if (summaryRes && summaryRes.rows) {
      const sRow = summaryRes.rows[0] || {};
      const totalTokens = parseInt(sRow.total_tokens ?? 0, 10) || 0;
      const waitingCount = parseInt(sRow.waiting_count ?? 0, 10) || 0;
      const servingCount = parseInt(sRow.serving_count ?? 0, 10) || 0;
      const servedCount = parseInt(sRow.served_count ?? 0, 10) || 0;
      const cancelledCount = parseInt(sRow.cancelled_count ?? 0, 10) || 0;
      const skippedCount = parseInt(sRow.skipped_count ?? 0, 10) || 0;
      const totalRevenue = parseFloat(sRow.total_revenue ?? 0) || 0;
      const avgTicketValue = servedCount > 0 ? Math.round(totalRevenue / servedCount) : 0;
      const completionRate = totalTokens > 0 ? Math.round((servedCount / totalTokens) * 1000) / 10 : 0;
      const cancellationRate = totalTokens > 0 ? Math.round((cancelledCount / totalTokens) * 1000) / 10 : 0;
      const skipRate = totalTokens > 0 ? Math.round((skippedCount / totalTokens) * 1000) / 10 : 0;
      const queueLoadLevel = waitingCount >= 8 ? 'HIGH' : waitingCount >= 4 ? 'MODERATE' : waitingCount >= 1 ? 'LOW' : 'OPTIMAL';

      // 1.2 Customer Flow Query
      let flow = [];
      let peakHour = null;

      if (normalizedPeriod === 'today') {
        const hourlyRes = await runQuery(
          `SELECT
             EXTRACT(HOUR FROM (t.created_at AT TIME ZONE 'Asia/Kolkata'))::int AS hour,
             COUNT(*)::int AS tokens_created,
             COUNT(CASE WHEN t.status = 'SERVED' THEN 1 END)::int AS served,
             COUNT(CASE WHEN t.status = 'CANCELLED' THEN 1 END)::int AS cancelled,
             COUNT(CASE WHEN t.status = 'SKIPPED' THEN 1 END)::int AS skipped
           FROM tokens t
           WHERE t.business_id = $1
             AND t.created_at >= $2
             AND t.created_at < $3
           GROUP BY 1
           ORDER BY 1 ASC;`,
          [businessId, startIso, endIso]
        );

        const hourlyMap = {};
        let maxTokens = 0;
        let peakH = null;

        if (hourlyRes && hourlyRes.rows) {
          hourlyRes.rows.forEach((r) => {
            const h = parseInt(r.hour, 10);
            const created = parseInt(r.tokens_created ?? 0, 10) || 0;
            hourlyMap[h] = {
              tokensCreated: created,
              served: parseInt(r.served ?? 0, 10) || 0,
              cancelled: parseInt(r.cancelled ?? 0, 10) || 0,
              skipped: parseInt(r.skipped ?? 0, 10) || 0,
            };
            if (created > maxTokens) {
              maxTokens = created;
              peakH = h;
            }
          });
        }

        const activeHours = Object.keys(hourlyMap).map(Number).sort((a, b) => a - b);
        const minH = activeHours.length > 0 ? Math.max(0, Math.min(...activeHours) - 1) : 8;
        const maxH = activeHours.length > 0 ? Math.min(23, Math.max(...activeHours) + 1) : 20;

        for (let h = minH; h <= maxH; h++) {
          const item = hourlyMap[h] || { tokensCreated: 0, served: 0, cancelled: 0, skipped: 0 };
          flow.push({
            hour: h,
            label: formatHourLabel(h),
            tokensCreated: item.tokensCreated,
            served: item.served,
            cancelled: item.cancelled,
            skipped: item.skipped,
          });
        }

        if (peakH !== null && maxTokens > 0) {
          peakHour = {
            hour: peakH,
            label: `${formatHourLabel(peakH)}–${formatHourLabel((peakH + 1) % 24)}`,
            tokensCreated: maxTokens,
          };
        }
      } else {
        // 7d or 30d Daily Aggregation
        const dailyRes = await runQuery(
          `SELECT
             to_char(t.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS date,
             COUNT(*)::int AS tokens_created,
             COUNT(CASE WHEN t.status = 'SERVED' THEN 1 END)::int AS served,
             COUNT(CASE WHEN t.status = 'CANCELLED' THEN 1 END)::int AS cancelled,
             COUNT(CASE WHEN t.status = 'SKIPPED' THEN 1 END)::int AS skipped,
             COALESCE(SUM(CASE WHEN t.status = 'SERVED' THEN COALESCE(t.service_price_at_join, s.price, 0) ELSE 0 END), 0)::float AS revenue
           FROM tokens t
           LEFT JOIN services s ON t.service_id = s.id
           WHERE t.business_id = $1
             AND t.created_at >= $2
             AND t.created_at < $3
           GROUP BY 1
           ORDER BY 1 ASC;`,
          [businessId, startIso, endIso]
        );

        const dailyMap = {};
        if (dailyRes && dailyRes.rows) {
          dailyRes.rows.forEach((r) => {
            dailyMap[r.date] = {
              tokensCreated: parseInt(r.tokens_created ?? 0, 10) || 0,
              served: parseInt(r.served ?? 0, 10) || 0,
              cancelled: parseInt(r.cancelled ?? 0, 10) || 0,
              skipped: parseInt(r.skipped ?? 0, 10) || 0,
              revenue: parseFloat(r.revenue ?? 0) || 0,
            };
          });
        }

        let maxDayTokens = 0;
        let peakDay = null;

        for (let d = 0; d < numDays; d++) {
          const dayDate = new Date(startDateUTC.getTime() + d * 24 * 3600 * 1000 + (5.5 * 3600 * 1000));
          const dateStr = dayDate.toISOString().slice(0, 10);
          const dayLabel = dayDate.toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
            weekday: numDays <= 7 ? 'short' : undefined,
            day: 'numeric',
            month: 'short',
          });

          const item = dailyMap[dateStr] || { tokensCreated: 0, served: 0, cancelled: 0, skipped: 0, revenue: 0 };
          flow.push({
            date: dateStr,
            dayLabel,
            tokensCreated: item.tokensCreated,
            served: item.served,
            cancelled: item.cancelled,
            skipped: item.skipped,
            revenue: item.revenue,
          });

          if (item.tokensCreated > maxDayTokens) {
            maxDayTokens = item.tokensCreated;
            peakDay = dayLabel;
          }
        }

        if (peakDay !== null && maxDayTokens > 0) {
          peakHour = {
            label: `Peak: ${peakDay}`,
            tokensCreated: maxDayTokens,
          };
        }
      }

      // 1.3 Service Breakdown Query
      const servicesRes = await runQuery(
        `SELECT
           COALESCE(s.name, 'General Service') AS service_name,
           t.service_id,
           COUNT(*)::int AS tokens,
           COUNT(CASE WHEN t.status = 'SERVED' THEN 1 END)::int AS served,
           COUNT(CASE WHEN t.status = 'CANCELLED' THEN 1 END)::int AS cancelled,
           COUNT(CASE WHEN t.status = 'SKIPPED' THEN 1 END)::int AS skipped,
           COALESCE(SUM(CASE WHEN t.status = 'SERVED' THEN COALESCE(t.service_price_at_join, s.price, 0) ELSE 0 END), 0)::float AS revenue,
           ROUND(AVG(CASE WHEN t.status IN ('SERVING', 'SERVED') AND (t.called_at IS NOT NULL OR t.served_at IS NOT NULL)
             THEN EXTRACT(EPOCH FROM (COALESCE(t.called_at, t.served_at) - t.created_at)) / 60
             ELSE NULL END)::numeric, 1)::float AS avg_wait_minutes
         FROM tokens t
         LEFT JOIN services s ON t.service_id = s.id
         WHERE t.business_id = $1
           AND t.created_at >= $2
           AND t.created_at < $3
         GROUP BY 1, 2
         ORDER BY tokens DESC;`,
        [businessId, startIso, endIso]
      );

      const services = (servicesRes?.rows || []).map((r) => {
        const sTokens = parseInt(r.tokens ?? 0, 10) || 0;
        return {
          serviceId: r.service_id || null,
          serviceName: r.service_name || 'General Service',
          tokens: sTokens,
          served: parseInt(r.served ?? 0, 10) || 0,
          cancelled: parseInt(r.cancelled ?? 0, 10) || 0,
          skipped: parseInt(r.skipped ?? 0, 10) || 0,
          revenue: parseFloat(r.revenue ?? 0) || 0,
          avgWaitMinutes: r.avg_wait_minutes != null ? parseFloat(r.avg_wait_minutes) : null,
          percentage: totalTokens > 0 ? Math.round((sTokens / totalTokens) * 1000) / 10 : 0,
        };
      });

      // 1.4 Wait Time Distribution Query
      const distRes = await runQuery(
        `SELECT
           COUNT(CASE WHEN wait_mins < 10 THEN 1 END)::int AS under_10m,
           COUNT(CASE WHEN wait_mins >= 10 AND wait_mins < 20 THEN 1 END)::int AS m10_to_20m,
           COUNT(CASE WHEN wait_mins >= 20 AND wait_mins < 30 THEN 1 END)::int AS m20_to_30m,
           COUNT(CASE WHEN wait_mins >= 30 THEN 1 END)::int AS over_30m
         FROM (
           SELECT EXTRACT(EPOCH FROM (COALESCE(t.called_at, t.served_at) - t.created_at)) / 60 AS wait_mins
           FROM tokens t
           WHERE t.business_id = $1
             AND t.status IN ('SERVING', 'SERVED')
             AND (t.called_at IS NOT NULL OR t.served_at IS NOT NULL)
             AND t.created_at >= $2
             AND t.created_at < $3
         ) w;`,
        [businessId, startIso, endIso]
      );

      const dRow = distRes?.rows?.[0] || {};
      const waitDistribution = {
        under10m: parseInt(dRow.under_10m ?? 0, 10) || 0,
        m10to20m: parseInt(dRow.m10_to_20m ?? 0, 10) || 0,
        m20to30m: parseInt(dRow.m20_to_30m ?? 0, 10) || 0,
        over30m: parseInt(dRow.over_30m ?? 0, 10) || 0,
      };

      // Daily revenue array for revenue component
      const dailyRevenue = normalizedPeriod === 'today'
        ? [{ date: todayStr, dayLabel: 'Today', revenue: totalRevenue, served: servedCount }]
        : flow.map((item) => ({
            date: item.date,
            dayLabel: item.dayLabel,
            revenue: item.revenue ?? 0,
            served: item.served ?? 0,
          }));

      return {
        period: normalizedPeriod,
        hasData: totalTokens > 0,
        summary: {
          totalTokens,
          waitingCount,
          servingCount,
          servedCount,
          cancelledCount,
          skippedCount,
          totalRevenue,
          avgTicketValue,
          completionRate,
          cancellationRate,
          skipRate,
          queueLoadLevel,
        },
        flow,
        revenue: {
          totalRevenue,
          avgTicketValue,
          servedCustomerCount: servedCount,
          daily: dailyRevenue,
        },
        services,
        queueLoad: {
          currentWaiting: waitingCount,
          currentServing: servingCount,
          currentServed: servedCount,
          currentCancelled: cancelledCount,
          currentSkipped: skippedCount,
          peakWaiting: Math.max(waitingCount, flow.reduce((max, f) => Math.max(max, f.tokensCreated || 0), 0)),
          loadLevel: queueLoadLevel,
        },
        waitTime: {
          avgWaitMinutes: sRow.avg_wait_minutes != null ? parseFloat(sRow.avg_wait_minutes) : null,
          minWaitMinutes: sRow.min_wait_minutes != null ? parseFloat(sRow.min_wait_minutes) : null,
          maxWaitMinutes: sRow.max_wait_minutes != null ? parseFloat(sRow.max_wait_minutes) : null,
          distribution: waitDistribution,
        },
        serviceDuration: {
          avgDurationMinutes: sRow.avg_service_minutes != null ? parseFloat(sRow.avg_service_minutes) : null,
          minDurationMinutes: sRow.min_service_minutes != null ? parseFloat(sRow.min_service_minutes) : null,
          maxDurationMinutes: sRow.max_service_minutes != null ? parseFloat(sRow.max_service_minutes) : null,
          isMeasurable: sRow.avg_service_minutes != null,
        },
        peakHour,
      };
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'production') throw err;
    // In dev / test fallback to mockStore
  }

  guardProduction();

  // ─── 2. MockStore Fallback (Local Dev / Unit Testing) ──────────────────────
  const startTimeMs = startDateUTC.getTime();
  const endTimeMs = endOfTodayUTC.getTime();

  const periodTokens = mockStore.tokens.filter((t) => {
    if (t.business_id !== businessId) return false;
    const tMs = new Date(t.created_at).getTime();
    return tMs >= startTimeMs && tMs < endTimeMs;
  });

  const totalTokens = periodTokens.length;
  const waitingCount = periodTokens.filter((t) => t.status === 'WAITING').length;
  const servingCount = periodTokens.filter((t) => t.status === 'SERVING').length;
  const servedTokens = periodTokens.filter((t) => t.status === 'SERVED');
  const servedCount = servedTokens.length;
  const cancelledCount = periodTokens.filter((t) => t.status === 'CANCELLED').length;
  const skippedCount = periodTokens.filter((t) => t.status === 'SKIPPED').length;

  const totalRevenue = servedTokens.reduce((sum, t) => {
    const price = (t.service_price_at_join !== null && t.service_price_at_join !== undefined)
      ? parseFloat(t.service_price_at_join)
      : (parseFloat(mockStore.services.find((s) => s.id === t.service_id)?.price) || 0);
    return sum + price;
  }, 0);

  const avgTicketValue = servedCount > 0 ? Math.round(totalRevenue / servedCount) : 0;
  const completionRate = totalTokens > 0 ? Math.round((servedCount / totalTokens) * 1000) / 10 : 0;
  const cancellationRate = totalTokens > 0 ? Math.round((cancelledCount / totalTokens) * 1000) / 10 : 0;
  const skipRate = totalTokens > 0 ? Math.round((skippedCount / totalTokens) * 1000) / 10 : 0;
  const queueLoadLevel = waitingCount >= 8 ? 'HIGH' : waitingCount >= 4 ? 'MODERATE' : waitingCount >= 1 ? 'LOW' : 'OPTIMAL';

  // Wait time calculations
  const waitDurations = periodTokens
    .filter((t) => (t.status === 'SERVING' || t.status === 'SERVED') && (t.called_at || t.served_at))
    .map((t) => {
      const start = new Date(t.created_at).getTime();
      const end = new Date(t.called_at || t.served_at).getTime();
      return Math.max(0, (end - start) / 60000);
    });

  const avgWaitMinutes = waitDurations.length > 0
    ? Math.round((waitDurations.reduce((a, b) => a + b, 0) / waitDurations.length) * 10) / 10
    : null;
  const minWaitMinutes = waitDurations.length > 0 ? Math.round(Math.min(...waitDurations) * 10) / 10 : null;
  const maxWaitMinutes = waitDurations.length > 0 ? Math.round(Math.max(...waitDurations) * 10) / 10 : null;

  const waitDistribution = {
    under10m: waitDurations.filter((d) => d < 10).length,
    m10to20m: waitDurations.filter((d) => d >= 10 && d < 20).length,
    m20to30m: waitDurations.filter((d) => d >= 20 && d < 30).length,
    over30m: waitDurations.filter((d) => d >= 30).length,
  };

  // Service durations
  const serviceDurations = servedTokens
    .filter((t) => t.called_at && t.served_at)
    .map((t) => (new Date(t.served_at).getTime() - new Date(t.called_at).getTime()) / 60000);

  const avgDurationMinutes = serviceDurations.length > 0
    ? Math.round((serviceDurations.reduce((a, b) => a + b, 0) / serviceDurations.length) * 10) / 10
    : null;
  const minDurationMinutes = serviceDurations.length > 0 ? Math.round(Math.min(...serviceDurations) * 10) / 10 : null;
  const maxDurationMinutes = serviceDurations.length > 0 ? Math.round(Math.max(...serviceDurations) * 10) / 10 : null;

  // Flow & Peak Hour
  let flow = [];
  let peakHour = null;

  if (normalizedPeriod === 'today') {
    const hourlyMap = {};
    let maxTokens = 0;
    let peakH = null;

    periodTokens.forEach((t) => {
      const h = new Date(new Date(t.created_at).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).getHours();
      if (!hourlyMap[h]) {
        hourlyMap[h] = { tokensCreated: 0, served: 0, cancelled: 0, skipped: 0 };
      }
      hourlyMap[h].tokensCreated += 1;
      if (t.status === 'SERVED') hourlyMap[h].served += 1;
      if (t.status === 'CANCELLED') hourlyMap[h].cancelled += 1;
      if (t.status === 'SKIPPED') hourlyMap[h].skipped += 1;

      if (hourlyMap[h].tokensCreated > maxTokens) {
        maxTokens = hourlyMap[h].tokensCreated;
        peakH = h;
      }
    });

    const activeHours = Object.keys(hourlyMap).map(Number).sort((a, b) => a - b);
    const minH = activeHours.length > 0 ? Math.max(0, Math.min(...activeHours) - 1) : 8;
    const maxH = activeHours.length > 0 ? Math.min(23, Math.max(...activeHours) + 1) : 20;

    for (let h = minH; h <= maxH; h++) {
      const item = hourlyMap[h] || { tokensCreated: 0, served: 0, cancelled: 0, skipped: 0 };
      flow.push({
        hour: h,
        label: formatHourLabel(h),
        tokensCreated: item.tokensCreated,
        served: item.served,
        cancelled: item.cancelled,
        skipped: item.skipped,
      });
    }

    if (peakH !== null && maxTokens > 0) {
      peakHour = {
        hour: peakH,
        label: `${formatHourLabel(peakH)}–${formatHourLabel((peakH + 1) % 24)}`,
        tokensCreated: maxTokens,
      };
    }
  } else {
    // 7d or 30d
    const dailyMap = {};
    periodTokens.forEach((t) => {
      const dateStr = new Date(new Date(t.created_at).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
        .toISOString()
        .slice(0, 10);
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { tokensCreated: 0, served: 0, cancelled: 0, skipped: 0, revenue: 0 };
      }
      dailyMap[dateStr].tokensCreated += 1;
      if (t.status === 'SERVED') {
        dailyMap[dateStr].served += 1;
        const price = (t.service_price_at_join !== null && t.service_price_at_join !== undefined)
          ? parseFloat(t.service_price_at_join)
          : (parseFloat(mockStore.services.find((s) => s.id === t.service_id)?.price) || 0);
        dailyMap[dateStr].revenue += price;
      }
      if (t.status === 'CANCELLED') dailyMap[dateStr].cancelled += 1;
      if (t.status === 'SKIPPED') dailyMap[dateStr].skipped += 1;
    });

    let maxDayTokens = 0;
    let peakDay = null;

    for (let d = 0; d < numDays; d++) {
      const dayDate = new Date(startDateUTC.getTime() + d * 24 * 3600 * 1000 + (5.5 * 3600 * 1000));
      const dateStr = dayDate.toISOString().slice(0, 10);
      const dayLabel = dayDate.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: numDays <= 7 ? 'short' : undefined,
        day: 'numeric',
        month: 'short',
      });

      const item = dailyMap[dateStr] || { tokensCreated: 0, served: 0, cancelled: 0, skipped: 0, revenue: 0 };
      flow.push({
        date: dateStr,
        dayLabel,
        tokensCreated: item.tokensCreated,
        served: item.served,
        cancelled: item.cancelled,
        skipped: item.skipped,
        revenue: item.revenue,
      });

      if (item.tokensCreated > maxDayTokens) {
        maxDayTokens = item.tokensCreated;
        peakDay = dayLabel;
      }
    }

    if (peakDay !== null && maxDayTokens > 0) {
      peakHour = {
        label: `Peak: ${peakDay}`,
        tokensCreated: maxDayTokens,
      };
    }
  }

  // Service breakdown
  const serviceMap = {};
  periodTokens.forEach((t) => {
    const sId = t.service_id || 'general';
    if (!serviceMap[sId]) {
      const svc = mockStore.services.find((s) => s.id === sId);
      serviceMap[sId] = {
        serviceId: t.service_id || null,
        serviceName: svc?.name || 'General Service',
        tokens: 0,
        served: 0,
        cancelled: 0,
        skipped: 0,
        revenue: 0,
        waits: [],
      };
    }
    serviceMap[sId].tokens += 1;
    if (t.status === 'SERVED') {
      serviceMap[sId].served += 1;
      const price = (t.service_price_at_join !== null && t.service_price_at_join !== undefined)
        ? parseFloat(t.service_price_at_join)
        : (parseFloat(mockStore.services.find((s) => s.id === t.service_id)?.price) || 0);
      serviceMap[sId].revenue += price;
    }
    if (t.status === 'CANCELLED') serviceMap[sId].cancelled += 1;
    if (t.status === 'SKIPPED') serviceMap[sId].skipped += 1;
    if ((t.status === 'SERVING' || t.status === 'SERVED') && (t.called_at || t.served_at)) {
      const start = new Date(t.created_at).getTime();
      const end = new Date(t.called_at || t.served_at).getTime();
      serviceMap[sId].waits.push(Math.max(0, (end - start) / 60000));
    }
  });

  const services = Object.values(serviceMap)
    .map((s) => ({
      serviceId: s.serviceId,
      serviceName: s.serviceName,
      tokens: s.tokens,
      served: s.served,
      cancelled: s.cancelled,
      skipped: s.skipped,
      revenue: s.revenue,
      avgWaitMinutes: s.waits.length > 0 ? Math.round((s.waits.reduce((a, b) => a + b, 0) / s.waits.length) * 10) / 10 : null,
      percentage: totalTokens > 0 ? Math.round((s.tokens / totalTokens) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.tokens - a.tokens);

  const dailyRevenue = normalizedPeriod === 'today'
    ? [{ date: todayStr, dayLabel: 'Today', revenue: totalRevenue, served: servedCount }]
    : flow.map((item) => ({
        date: item.date,
        dayLabel: item.dayLabel,
        revenue: item.revenue ?? 0,
        served: item.served ?? 0,
      }));

  return {
    period: normalizedPeriod,
    hasData: totalTokens > 0,
    summary: {
      totalTokens,
      waitingCount,
      servingCount,
      servedCount,
      cancelledCount,
      skippedCount,
      totalRevenue,
      avgTicketValue,
      completionRate,
      cancellationRate,
      skipRate,
      queueLoadLevel,
    },
    flow,
    revenue: {
      totalRevenue,
      avgTicketValue,
      servedCustomerCount: servedCount,
      daily: dailyRevenue,
    },
    services,
    queueLoad: {
      currentWaiting: waitingCount,
      currentServing: servingCount,
      currentServed: servedCount,
      currentCancelled: cancelledCount,
      currentSkipped: skippedCount,
      peakWaiting: Math.max(waitingCount, flow.reduce((max, f) => Math.max(max, f.tokensCreated || 0), 0)),
      loadLevel: queueLoadLevel,
    },
    waitTime: {
      avgWaitMinutes,
      minWaitMinutes,
      maxWaitMinutes,
      distribution: waitDistribution,
    },
    serviceDuration: {
      avgDurationMinutes,
      minDurationMinutes,
      maxDurationMinutes,
      isMeasurable: serviceDurations.length > 0,
    },
    peakHour,
  };
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
  getEstimatedRevenueToday,
  getBusinessAnalytics,
  setCustomQueryHandler,
};
