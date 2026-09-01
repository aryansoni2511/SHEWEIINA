import { query } from '../config/db.js';

/**
 * Queue Model — Data Access Layer for Shewwina Core Queue System
 */

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
      password_hash: '$2a$10$xeZWtpeK/b6p4GxPVzYUx.vrtGWMK1MpRhepesx4seU4Vd5qyGO8i', // Hashed 'password123'
      role: 'BUSINESS',
      business_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      created_at: new Date().toISOString(),
    },
  ],
};

export async function findBusinessById(businessId) {
  const res = await query('SELECT * FROM businesses WHERE id = $1 AND is_active = TRUE;', [businessId]);
  if (res && res.rows.length > 0) return res.rows[0];
  return mockStore.businesses.find((b) => b.id === businessId || b.slug === businessId) || null;
}

export async function findBusinessBySlug(slug) {
  if (!slug) return null;
  const res = await query('SELECT * FROM businesses WHERE (slug = $1 OR id = $1) AND is_active = TRUE;', [slug]);
  if (res && res.rows.length > 0) return res.rows[0];
  return mockStore.businesses.find((b) => b.slug === slug || b.id === slug) || null;
}

export async function findQueueById(queueId) {
  const res = await query('SELECT * FROM queues WHERE id = $1;', [queueId]);
  if (res && res.rows.length > 0) return res.rows[0];
  return mockStore.queues.find((q) => q.id === queueId) || null;
}

export async function findQueueByBusinessId(businessId) {
  const res = await query('SELECT * FROM queues WHERE business_id = $1 ORDER BY is_open DESC LIMIT 1;', [businessId]);
  if (res && res.rows.length > 0) return res.rows[0];
  return mockStore.queues.find((q) => q.business_id === businessId) || mockStore.queues[0];
}

export async function findServiceById(serviceId) {
  const res = await query('SELECT * FROM services WHERE id = $1;', [serviceId]);
  if (res && res.rows.length > 0) return res.rows[0];
  return mockStore.services.find((s) => s.id === serviceId) || null;
}

export async function findServicesByBusinessId(businessId, includeInactive = false) {
  const sql = includeInactive
    ? 'SELECT * FROM services WHERE business_id = $1 ORDER BY created_at ASC;'
    : 'SELECT * FROM services WHERE business_id = $1 AND is_active = TRUE ORDER BY created_at ASC;';
  const res = await query(sql, [businessId]);
  if (res) return res.rows;
  return mockStore.services.filter((s) => (s.business_id === businessId || s.business_id === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') && (includeInactive || s.is_active));
}

export async function createService({ businessId, name, durationMinutes = 15, price = 0, description = '' }) {
  const res = await query(
    `INSERT INTO services (business_id, name, duration_minutes, price, description, is_active)
     VALUES ($1, $2, $3, $4, $5, TRUE)
     RETURNING *;`,
    [businessId, name, durationMinutes, price, description]
  );

  if (res && res.rows.length > 0) {
    return res.rows[0];
  }

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

  if (res && res.rows.length > 0) {
    return res.rows[0];
  }

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
  const res = await query(
    `UPDATE services
     SET is_active = $3, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND business_id = $2
     RETURNING *;`,
    [serviceId, businessId, Boolean(isActive)]
  );

  if (res && res.rows.length > 0) {
    return res.rows[0];
  }

  const svc = mockStore.services.find((s) => s.id === serviceId && (s.business_id === businessId || s.business_id === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'));
  if (!svc) return null;

  svc.is_active = Boolean(isActive);
  svc.updated_at = new Date().toISOString();

  return svc;
}

export async function createToken({ queueId, businessId, serviceId, customerName, customerPhone, estimatedWaitMinutes = 15, userId = null }) {
  const seqRes = await query(
    'UPDATE queues SET current_sequence = current_sequence + 1 WHERE id = $1 RETURNING current_sequence;',
    [queueId]
  );
  
  let sequenceNumber;
  if (seqRes && seqRes.rows.length > 0) {
    sequenceNumber = seqRes.rows[0].current_sequence;
  } else {
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

  // Calculate current waiting position
  const countRes = await query(
    "SELECT COUNT(*)::int as waiting_count FROM tokens WHERE queue_id = $1 AND status = 'WAITING';",
    [queueId]
  );

  let position;
  if (countRes && countRes.rows.length > 0) {
    position = countRes.rows[0].waiting_count + 1;
  } else {
    position = mockStore.tokens.filter((t) => (t.queue_id === queueId || t.business_id === businessId) && t.status === 'WAITING').length + 1;
  }

  const insertRes = await query(
    `INSERT INTO tokens (queue_id, business_id, service_id, customer_name, customer_phone, token_number, sequence_number, status, position, estimated_wait_minutes, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'WAITING', $8, $9, $10)
     RETURNING *;`,
    [queueId, businessId, serviceId, customerName, customerPhone, tokenNumber, sequenceNumber, position, estimatedWaitMinutes, userId]
  );

  if (insertRes && insertRes.rows.length > 0) {
    return insertRes.rows[0];
  }

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
  const res = await query(
    `SELECT t.*, s.name as service_name, s.duration_minutes as service_duration
     FROM tokens t
     LEFT JOIN services s ON t.service_id = s.id
     WHERE t.id = $1 OR t.token_number = $2;`,
    [tokenId, tokenId]
  );
  
  if (res && res.rows.length > 0) return res.rows[0];
  
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
  return mockStore.tokens
    .filter((t) => t.queue_id === queueId)
    .sort((a, b) => a.sequence_number - b.sequence_number);
}

export async function getPeopleAheadCount(queueId, tokenSequenceNumber) {
  const res = await query(
    "SELECT COUNT(*)::int as count FROM tokens WHERE queue_id = $1 AND status = 'WAITING' AND sequence_number < $2;",
    [queueId, tokenSequenceNumber]
  );
  if (res && res.rows.length > 0) return res.rows[0].count;
  return mockStore.tokens.filter(
    (t) => t.queue_id === queueId && t.status === 'WAITING' && t.sequence_number < tokenSequenceNumber
  ).length;
}

/**
 * Transitions currently SERVING token to SERVED, then calls the next WAITING token.
 * Ensures only ONE token is active SERVING at a time per queue.
 */
export async function callNextWaitingToken(queueId, businessId) {
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

  if (nextRes && nextRes.rows.length > 0) {
    return nextRes.rows[0];
  }

  // Fallback for mockStore / test environment
  // Mark previous SERVING token as SERVED in mockStore
  mockStore.tokens.forEach((t) => {
    if ((t.queue_id === queueId || t.business_id === businessId) && t.status === 'SERVING') {
      t.status = 'SERVED';
      t.served_at = new Date().toISOString();
    }
  });

  // Find next WAITING token
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

  // Update positions of remaining waiting tokens
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
 * Resets currently SERVING count to 0 when complete.
 */
export async function completeServingToken(queueId, businessId) {
  const completeRes = await query(
    `UPDATE tokens 
     SET status = 'SERVED', served_at = CURRENT_TIMESTAMP 
     WHERE queue_id = $1 AND status = 'SERVING'
     RETURNING *;`,
    [queueId]
  );

  if (completeRes && completeRes.rows.length > 0) {
    return completeRes.rows[0];
  }

  // Fallback for mockStore
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
  if (res && res.rows.length > 0) return res.rows[0];
  return mockStore.users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
}

export async function findUserById(userId) {
  if (!userId) return null;
  const res = await query('SELECT * FROM users WHERE id = $1;', [userId]);
  if (res && res.rows.length > 0) return res.rows[0];
  return mockStore.users.find((u) => u.id === userId) || null;
}

export async function createUser({ name, email, phone, passwordHash, role = 'CUSTOMER', businessId = null }) {
  const cleanEmail = email.trim().toLowerCase();
  const insertRes = await query(
    `INSERT INTO users (name, email, phone, password_hash, role, business_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *;`,
    [name.trim(), cleanEmail, phone || null, passwordHash, role, businessId]
  );

  if (insertRes && insertRes.rows.length > 0) {
    return insertRes.rows[0];
  }

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
  const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || `biz-${Date.now()}`;

  // 1. Create Business
  let business;
  const bizRes = await query(
    `INSERT INTO businesses (name, slug, category, phone, email, address, city, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
     RETURNING *;`,
    [businessName.trim(), slug, category, phone, cleanEmail, address, city]
  );

  if (bizRes && bizRes.rows.length > 0) {
    business = bizRes.rows[0];
  } else {
    business = {
      id: `biz-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: businessName.trim(),
      slug,
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
  const queueRes = await query(
    `INSERT INTO queues (business_id, name, is_open, current_sequence)
     VALUES ($1, $2, TRUE, 0)
     RETURNING *;`,
    [business.id, `${businessName.trim()} Express Queue`]
  );

  if (queueRes && queueRes.rows.length > 0) {
    queue = queueRes.rows[0];
  } else {
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
  const serviceRes = await query(
    `INSERT INTO services (business_id, name, duration_minutes, price, is_active)
     VALUES ($1, 'General Service', 15, 300.0, TRUE)
     RETURNING *;`,
    [business.id]
  );

  if (!serviceRes || serviceRes.rows.length === 0) {
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
  const res = await query(
    `SELECT t.*, b.name as business_name, s.name as service_name
     FROM tokens t
     LEFT JOIN businesses b ON t.business_id = b.id
     LEFT JOIN services s ON t.service_id = s.id
     WHERE t.user_id = $1 OR ($2::text IS NOT NULL AND $2::text != '' AND t.customer_phone = $2)
     ORDER BY t.created_at DESC;`,
    [userId, cleanPhone]
  );

  if (res) return res.rows;

  return mockStore.tokens
    .filter((t) => t.user_id === userId || (cleanPhone && t.customer_phone === cleanPhone))
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
  const res = await query(
    `UPDATE tokens
     SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP
     WHERE id = $1 OR token_number = $2
     RETURNING *;`,
    [tokenId, tokenId]
  );

  if (res && res.rows.length > 0) {
    return res.rows[0];
  }

  const token = mockStore.tokens.find((t) => t.id === tokenId || t.token_number === tokenId);
  if (!token) return null;

  token.status = 'CANCELLED';
  token.cancelled_at = new Date().toISOString();
  return token;
}

export async function updateBusiness(businessId, { name, category, phone, address, city, description }) {
  const res = await query(
    `UPDATE businesses
     SET name = COALESCE($2, name),
         category = COALESCE($3, category),
         phone = COALESCE($4, phone),
         address = COALESCE($5, address),
         city = COALESCE($6, city),
         description = COALESCE($7, description),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 OR slug = $1
     RETURNING *;`,
    [businessId, name, category, phone, address, city, description]
  );

  if (res && res.rows.length > 0) {
    return res.rows[0];
  }

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

  if (res && res.rows.length > 0) {
    return res.rows[0];
  }

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
  // 1. Mark the token as SKIPPED in PostgreSQL
  const skipRes = await query(
    `UPDATE tokens
     SET status = 'SKIPPED', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND queue_id = $2 AND business_id = $3 AND status = 'WAITING'
     RETURNING *;`,
    [tokenId, queueId, businessId]
  );

  if (skipRes && skipRes.rows.length > 0) {
    // 2. Recalculate positions of remaining WAITING tokens (PostgreSQL path)
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

  // Fallback for mockStore
  const token = mockStore.tokens.find(
    (t) =>
      t.id === tokenId &&
      (t.queue_id === queueId || t.business_id === businessId) &&
      t.status === 'WAITING'
  );

  if (!token) return null;

  token.status = 'SKIPPED';
  token.updated_at = new Date().toISOString();

  // Recalculate positions for remaining WAITING tokens in mockStore
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
 * Returns the average actual service time (in minutes) for the last `limit` SERVED tokens
 * in the given queue. Used by the Phase 9 AI layer to build a real throughput signal.
 *
 * Returns null when:
 * - No served tokens exist yet (queue is new today)
 * - served_at or called_at timestamps are absent
 * - Database is offline (mockStore path has no served_at timestamps)
 * - Any query error
 */
export async function getRecentThroughput(queueId, limit = 10) {
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

  if (res && res.rows.length > 0 && res.rows[0].avg_minutes != null) {
    return parseFloat(res.rows[0].avg_minutes);
  }

  // mockStore path: calculate from in-memory served tokens if available
  const servedWithBoth = mockStore.tokens.filter(
    (t) => t.queue_id === queueId && t.status === 'SERVED' && t.served_at && t.called_at
  );
  if (servedWithBoth.length === 0) return null;

  const recent = servedWithBoth.slice(-limit);
  const avgMs =
    recent.reduce((sum, t) => sum + (new Date(t.served_at) - new Date(t.called_at)), 0) /
    recent.length;
  return Math.round((avgMs / 60000) * 10) / 10; // minutes, 1 decimal
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

