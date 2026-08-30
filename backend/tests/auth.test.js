import test from 'node:test';
import assert from 'node:assert';
import app from '../app.js';

test('Phase 3 Authentication & Authorization API Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const customerEmail = `customer_${Date.now()}@example.com`;
  const businessEmail = `owner_${Date.now()}@shewwinabiz.com`;
  const otherBusinessEmail = `other_owner_${Date.now()}@otherbiz.com`;
  const password = 'Password123!';

  let customerToken = null;
  let businessToken = null;
  let businessId = null;

  let otherBusinessToken = null;
  let otherBusinessId = null;

  try {
    // 1. Customer Registration Success
    await t.test('POST /api/v1/auth/register registers a new customer', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Ananya Roy',
          email: customerEmail,
          phone: '+919988001122',
          password,
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.token);
      assert.strictEqual(body.data.user.role, 'CUSTOMER');
      customerToken = body.data.token;
    });

    // 2. Duplicate Email Registration Failure (HTTP 409)
    await t.test('POST /api/v1/auth/register fails on duplicate email (409)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Duplicate Person',
          email: customerEmail,
          password,
        }),
      });

      assert.strictEqual(res.status, 409);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });

    // 3. Business Owner Registration Success
    await t.test('POST /api/v1/auth/register-business registers business & owner', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Karan Johar',
          email: businessEmail,
          phone: '+919876500000',
          password,
          businessName: 'Karan Style Studio',
          category: 'salon',
          city: 'Mumbai',
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.token);
      assert.strictEqual(body.data.user.role, 'BUSINESS');
      assert.ok(body.data.business.id);

      businessToken = body.data.token;
      businessId = body.data.business.id;
    });

    // 3b. Register Second Business Owner for Tenant Isolation Tests
    await t.test('Register second business owner for tenant isolation', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Rohan Mehta',
          email: otherBusinessEmail,
          phone: '+919876511111',
          password,
          businessName: 'Rohan Clinic',
          category: 'clinic',
          city: 'Delhi',
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      otherBusinessToken = body.data.token;
      otherBusinessId = body.data.business.id;
    });

    // 4. Login Success
    await t.test('POST /api/v1/auth/login succeeds with valid credentials', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: businessEmail,
          password,
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.token);
      assert.strictEqual(body.data.user.email, businessEmail.toLowerCase());
    });

    // 5. Incorrect Password Failure (HTTP 401)
    await t.test('POST /api/v1/auth/login fails with incorrect password (401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: businessEmail,
          password: 'wrongpassword',
        }),
      });

      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });

    // 6. GET /api/v1/auth/me Success
    await t.test('GET /api/v1/auth/me retrieves current profile with valid JWT', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${businessToken}` },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.email, businessEmail.toLowerCase());
      assert.strictEqual(body.data.role, 'BUSINESS');
    });

    // 7. GET /api/v1/auth/me Missing/Invalid JWT (HTTP 401)
    await t.test('GET /api/v1/auth/me returns 401 when token is missing or invalid', async () => {
      const res1 = await fetch(`${baseUrl}/api/v1/auth/me`);
      assert.strictEqual(res1.status, 401);

      const res2 = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: 'Bearer invalid-garbage-token' },
      });
      assert.strictEqual(res2.status, 401);
    });

    // 8. Protected Business Queue APIs return 401 without JWT
    await t.test('GET /api/v1/business/queue returns 401 without token', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/queue?businessId=${businessId}`);
      assert.strictEqual(res.status, 401);
    });

    // 9. Role Authorization — CUSTOMER role trying to access Business Queue returns 403
    await t.test('Customer role receives 403 Forbidden accessing Business Queue APIs', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/queue?businessId=${businessId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.ok(body.message.includes('Access denied'));
    });

    // 10. Business Tenant Isolation — Business A accessing Business B's queue returns 403
    await t.test('Business owner receives 403 when trying to access another business queue (Tenant Isolation)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/queue?businessId=${otherBusinessId}`, {
        headers: { Authorization: `Bearer ${businessToken}` },
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.ok(body.message.includes('another business'));
    });

    // 11. Business Owner can successfully access their own business queue
    await t.test('Business owner can access their own queue', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/queue?businessId=${businessId}`, {
        headers: { Authorization: `Bearer ${businessToken}` },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.business.id, businessId);
    });

    // 12. Business Tenant Isolation on Queue Actions (/next)
    await t.test('Business A cannot call next on Business B queue (403)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/queue/next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${businessToken}`,
        },
        body: JSON.stringify({ businessId: otherBusinessId }),
      });

      assert.strictEqual(res.status, 403);
    });

  } finally {
    server.close();
  }
});
