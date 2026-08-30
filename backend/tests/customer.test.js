import test from 'node:test';
import assert from 'node:assert';
import app from '../app.js';

test('Phase 4A Customer Dashboard API Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const ts = Date.now();
  const customerAEmail = `custA_${ts}@example.com`;
  const customerBEmail = `custB_${ts}@example.com`;
  const businessEmail = `bizowner_${ts}@example.com`;
  const pass = 'Password123!';

  let customerAToken = '';
  let customerBToken = '';
  let businessToken = '';
  let businessId = '';
  let queueId = '';
  let serviceId = '';

  try {
    // 0. Register Business & Queue
    const bizRes = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Salon Manager',
        email: businessEmail,
        phone: '+919900011100',
        password: pass,
        businessName: 'Customer Test Salon',
        category: 'salon',
        city: 'Mumbai',
      }),
    });
    const bizData = await bizRes.json();
    businessToken = bizData.data.token;
    businessId = bizData.data.business.id;
    queueId = bizData.data.queue.id;

    const svcRes = await fetch(`${baseUrl}/api/v1/business/services?businessId=${businessId}`);
    const svcData = await svcRes.json();
    serviceId = svcData.data.services[0].id;

    // Register Customer A
    const regARes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Customer Alpha',
        email: customerAEmail,
        phone: '+919911122233',
        password: pass,
      }),
    });
    const regAData = await regARes.json();
    customerAToken = regAData.data.token;

    // Register Customer B
    const regBRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Customer Beta',
        email: customerBEmail,
        phone: '+919944455566',
        password: pass,
      }),
    });
    const regBData = await regBRes.json();
    customerBToken = regBData.data.token;

    // 1. GET /api/v1/customer/profile — Success for Customer A
    await t.test('GET /api/v1/customer/profile returns customer profile', async () => {
      const res = await fetch(`${baseUrl}/api/v1/customer/profile`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.email, customerAEmail.toLowerCase());
      assert.strictEqual(body.data.role, 'CUSTOMER');
    });

    // 2. Unauthenticated request to /api/v1/customer/profile returns 401
    await t.test('GET /api/v1/customer/profile returns 401 for unauthenticated request', async () => {
      const res = await fetch(`${baseUrl}/api/v1/customer/profile`);
      assert.strictEqual(res.status, 401);
    });

    // 3. Business user accessing /api/v1/customer/profile returns 403
    await t.test('GET /api/v1/customer/profile returns 403 for business user role', async () => {
      const res = await fetch(`${baseUrl}/api/v1/customer/profile`, {
        headers: { Authorization: `Bearer ${businessToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    // 4. Customer A joins queue
    let tokenANumber = '';
    await t.test('Customer A joins queue and token is associated', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerAToken}`,
        },
        body: JSON.stringify({
          businessId,
          queueId,
          serviceId,
          customerName: 'Customer Alpha',
          customerPhone: '+919911122233',
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.ok(body.data.tokenNumber);
      tokenANumber = body.data.tokenNumber;
    });

    // 5. Customer A fetches active token
    await t.test('GET /api/v1/customer/active-token returns active token for Customer A', async () => {
      const res = await fetch(`${baseUrl}/api/v1/customer/active-token`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data);
      assert.strictEqual(body.data.tokenNumber, tokenANumber);
      assert.strictEqual(body.data.status, 'WAITING');
    });

    // 6. Customer B checks active token (Customer Isolation) — should return null or no token for B
    await t.test('Customer B cannot see Customer A active token (Customer Data Isolation)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/customer/active-token`, {
        headers: { Authorization: `Bearer ${customerBToken}` },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.data, null);
    });

    // 7. Customer A fetches token history
    await t.test('GET /api/v1/customer/tokens returns token history for Customer A', async () => {
      const res = await fetch(`${baseUrl}/api/v1/customer/tokens`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.strictEqual(body.data.length, 1);
      assert.strictEqual(body.data[0].tokenNumber, tokenANumber);
    });

    // 8. Customer B fetches token history — should be empty array (Customer Isolation)
    await t.test('Customer B token history does not contain Customer A tokens', async () => {
      const res = await fetch(`${baseUrl}/api/v1/customer/tokens`, {
        headers: { Authorization: `Bearer ${customerBToken}` },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.strictEqual(body.data.length, 0);
    });

  } finally {
    server.close();
  }
});
