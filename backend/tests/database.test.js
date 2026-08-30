import test from 'node:test';
import assert from 'node:assert';
import { checkDatabaseConnection } from '../config/db.js';
import {
  findBusinessBySlug,
  findServicesByBusinessId,
  findQueueByBusinessId,
  createToken,
  findTokenById,
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
    customerPhone: '+919999988888',
  });

  assert.ok(newToken);
  assert.ok(newToken.token_number);
  assert.strictEqual(newToken.customer_name, 'Test Customer');
  assert.strictEqual(newToken.status, 'WAITING');

  const fetchedToken = await findTokenById(newToken.id);
  assert.ok(fetchedToken);
  assert.strictEqual(fetchedToken.id, newToken.id);
});
