import test from 'node:test';
import assert from 'node:assert';
import app from '../app.js';

test('Phase 6B Security Hardening Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const ts = Date.now();

  // Pre-register test users BEFORE any rate limiting tests run
  // so auth quota is consumed in a predictable order
  let customerToken = '';
  let bizToken = '';

  const custRegRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Security Test Customer',
      email: `sec_cust_${ts}@example.com`,
      phone: '+919800007777',
      password: 'Password123!',
    }),
  });
  const custRegData = await custRegRes.json();
  customerToken = custRegData.data?.token || '';

  const bizRegRes = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Security Biz Owner',
      email: `sec_biz_${ts}@example.com`,
      phone: '+919800006666',
      password: 'Password123!',
      businessName: 'Security Test Biz',
      category: 'clinic',
      city: 'Delhi',
    }),
  });
  const bizRegData = await bizRegRes.json();
  bizToken = bizRegData.data?.token || '';

  try {
    // --- Test 1: Protected customer route without JWT returns 401 ---
    await t.test('Protected customer route without token returns 401', async () => {
      const res = await fetch(`${baseUrl}/api/v1/customer/profile`);
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('token') || data.message.includes('Authentication'));
    });

    // --- Test 2: Protected business route without JWT returns 401 ---
    await t.test('Protected business route without token returns 401', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/queue`);
      assert.strictEqual(res.status, 401);
    });

    // --- Test 3: CUSTOMER role JWT rejected on business routes (403) ---
    await t.test('CUSTOMER role JWT rejected with 403 on business routes', async () => {
      assert.ok(customerToken, 'Customer token must be available from setup');
      const bizRes = await fetch(`${baseUrl}/api/v1/business/queue`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.strictEqual(bizRes.status, 403, 'Customer role should be denied business routes');
    });

    // --- Test 4: BUSINESS role JWT rejected on customer-only routes (403) ---
    await t.test('BUSINESS role JWT rejected with 403 on customer-only routes', async () => {
      assert.ok(bizToken, 'Business token must be available from setup');
      const custRes = await fetch(`${baseUrl}/api/v1/customer/profile`, {
        headers: { Authorization: `Bearer ${bizToken}` },
      });
      assert.strictEqual(custRes.status, 403, 'Business role should be denied customer routes');
    });

    // --- Test 5: Malformed JWT returns 401 (not 500) ---
    await t.test('Malformed JWT token returns 401 (not 500)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/customer/profile`, {
        headers: { Authorization: 'Bearer this.is.not.a.valid.jwt' },
      });
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    // --- Test 6: 404 not found does not leak stack traces ---
    await t.test('Unknown routes return 404 with safe message (no stack trace)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/nonexistent-route-xyz`);
      assert.strictEqual(res.status, 404);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message, 'Should have a message');
      assert.ok(!data.message.includes('at '), 'Message should not contain stack trace');
      assert.ok(!data.message.includes('node:'), 'Message should not reference node internals');
    });

    // --- Test 7: GET /api/v1/business/services without businessId returns 400 ---
    await t.test('GET /api/v1/business/services without businessId returns 400 (no demo fallback)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/services`);
      assert.strictEqual(res.status, 400, 'Missing businessId should return 400 not demo data');
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    // --- Test 8: Auth rate limiter returns 429 after threshold ---
    // This test MUST run last because it exhausts the rate limit for this server instance
    await t.test('Auth rate limiter returns 429 after exceeding threshold (10 req/min)', async () => {
      const rateEmail = `ratelimit_${ts}@example.com`;
      let got429 = false;

      for (let i = 0; i < 15; i++) {
        const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: rateEmail, password: 'wrongpassword' }),
        });
        if (res.status === 429) {
          got429 = true;
          const data = await res.json();
          assert.strictEqual(data.success, false, 'Rate limit response should have success: false');
          assert.ok(data.message, 'Rate limit response should have a message');
          assert.ok(res.headers.get('Retry-After'), 'Should include Retry-After header');
          assert.ok(res.headers.get('X-RateLimit-Limit'), 'Should include X-RateLimit-Limit header');
          assert.strictEqual(res.headers.get('X-RateLimit-Remaining'), '0');
          break;
        }
      }

      assert.ok(got429, 'Should receive HTTP 429 within 15 login attempts');
    });

    // --- Test 9: Rate limit headers are present on normal (non-limited) requests ---
    await t.test('Rate-limited routes include X-RateLimit headers on normal responses', async () => {
      // Customer profile returns 401 (known error) but still goes through rate limiter middleware
      const res = await fetch(`${baseUrl}/api/v1/customer/profile`);
      // The general rate limiter on customer routes should set headers
      // Headers are set before the 401 is returned by authMiddleware
      assert.ok(res.status === 401 || res.status === 429);
      // If 401, check headers exist (rate limiter middleware ran)
      if (res.status === 401) {
        assert.ok(res.headers.get('X-RateLimit-Limit'), 'X-RateLimit-Limit header should be present');
      }
    });

  } finally {
    server.close();
  }
});
