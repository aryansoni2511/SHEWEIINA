import test from 'node:test';
import assert from 'node:assert';
import { checkDatabaseConnection } from '../config/db.js';
import {
  findBusinessBySlug,
  findServicesByBusinessId,
  findQueueByBusinessId,
  createToken,
  findTokenById,
  findServiceById,
  setCustomQueryHandler,
} from '../models/queueModel.js';

test('Database Connection Health Strategy returns valid architecture details', async () => {
  const dbHealth = await checkDatabaseConnection();
  assert.ok(dbHealth);
  assert.strictEqual(dbHealth.type.includes('PostgreSQL'), true);
  assert.ok(dbHealth.message);
});

test('Queue Model correctly retrieves business, services, and creates queue token', async () => {
  const business = await findBusinessBySlug('demo');
  assert.ok(business);
  assert.strictEqual(business.name, 'Shewwina Salon & Spa');

  const services = await findServicesByBusinessId(business.id);
  assert.ok(Array.isArray(services));
  assert.ok(services.length > 0);

  const queue = await findQueueByBusinessId(business.id);
  assert.ok(queue);

  const newToken = await createToken({
    queueId: queue.id,
    businessId: business.id,
    serviceId: services[0].id,
    customerName: 'Test Customer',
    customerPhone: '9999988888',
  });

  assert.ok(newToken);
  assert.ok(newToken.token_number);
  assert.strictEqual(newToken.customer_name, 'Test Customer');
  assert.strictEqual(newToken.status, 'WAITING');

  const fetchedToken = await findTokenById(newToken.id);
  assert.ok(fetchedToken);
  assert.strictEqual(fetchedToken.id, newToken.id);
});

test('findServiceById handles DB found, mock fallback, DB error, and nonexistent service', async (t) => {
  const mockServiceId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const nonexistentUuid = '00000000-0000-0000-0000-000000000000';
  const dbServiceId = '11111111-2222-3333-4444-555555555555';

  await t.test('1. DB service found: returns service from database', async () => {
    setCustomQueryHandler(async (sql, params) => {
      assert.ok(sql.includes('SELECT * FROM services WHERE id = $1'));
      assert.strictEqual(params[0], dbServiceId);
      return {
        rows: [
          {
            id: dbServiceId,
            business_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            name: 'PostgreSQL Cut & Style',
            description: 'Direct from DB',
            duration_minutes: 25,
            price: '450.00',
            is_active: true,
          },
        ],
      };
    });

    try {
      const svc = await findServiceById(dbServiceId);
      assert.ok(svc);
      assert.strictEqual(svc.id, dbServiceId);
      assert.strictEqual(svc.name, 'PostgreSQL Cut & Style');
      assert.strictEqual(svc.price, 450);
      assert.strictEqual(svc.duration_minutes, 25);
    } finally {
      setCustomQueryHandler(null);
    }
  });

  await t.test('2. DB service not found but mock service exists: falls back to mockStore', async () => {
    setCustomQueryHandler(async () => {
      return { rows: [] };
    });

    try {
      const svc = await findServiceById(mockServiceId);
      assert.ok(svc, 'Should fall back to mock service');
      assert.strictEqual(svc.id, mockServiceId);
      assert.strictEqual(svc.name, 'Haircut & Styling');
      assert.strictEqual(svc.duration_minutes, 30);
    } finally {
      setCustomQueryHandler(null);
    }
  });

  await t.test('3. DB unavailable and mock service exists: gracefully falls back to mockStore', async () => {
    setCustomQueryHandler(async () => {
      throw new Error('(ECIRCUITBREAKER) too many authentication failures, new connections are temporarily blocked');
    });

    try {
      const svc = await findServiceById(mockServiceId);
      assert.ok(svc, 'Should catch DB error and return mock service');
      assert.strictEqual(svc.id, mockServiceId);
      assert.strictEqual(svc.name, 'Haircut & Styling');
    } finally {
      setCustomQueryHandler(null);
    }
  });

  await t.test('4. Service genuinely does not exist: returns null', async () => {
    setCustomQueryHandler(async () => {
      return { rows: [] };
    });

    try {
      const svc = await findServiceById(nonexistentUuid);
      assert.strictEqual(svc, null, 'Nonexistent service should return null');
    } finally {
      setCustomQueryHandler(null);
    }
  });
});
