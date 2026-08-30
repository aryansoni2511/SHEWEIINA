import test from 'node:test';
import assert from 'node:assert';
import app from '../app.js';

test('Phase 6B Business Skip Token Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const ts = Date.now();
  const bizAEmail = `bizA_skip_${ts}@example.com`;
  const bizBEmail = `bizB_skip_${ts}@example.com`;
  const pass = 'Password123!';

  let bizAToken = '';
  let bizBToken = '';
  let bizAId = '';
  let bizBId = '';
  let queueAId = '';
  let serviceAId = '';

  let tokenWaiting1Id = '';
  let tokenWaiting2Id = '';
  let tokenWaiting3Id = '';

  try {
    // --- Setup: Register Business A ---
    const bizARes = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Skip Test Owner A',
        email: bizAEmail,
        phone: '+919800001111',
        password: pass,
        businessName: 'City Hospital A',
        category: 'clinic',
        city: 'Pune',
      }),
    });
    const bizAData = await bizARes.json();
    assert.strictEqual(bizARes.status, 201, 'Business A should register');
    bizAToken = bizAData.data.token;
    bizAId = bizAData.data.business.id;
    queueAId = bizAData.data.queue.id;

    const svcARes = await fetch(`${baseUrl}/api/v1/business/services?businessId=${bizAId}`);
    const svcAData = await svcARes.json();
    serviceAId = svcAData.data.services[0].id;

    // --- Setup: Register Business B (for cross-tenant test) ---
    const bizBRes = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Skip Test Owner B',
        email: bizBEmail,
        phone: '+919800002222',
        password: pass,
        businessName: 'Municipal Office B',
        category: 'government',
        city: 'Pune',
      }),
    });
    const bizBData = await bizBRes.json();
    bizBToken = bizBData.data.token;
    bizBId = bizBData.data.business.id;

    // --- Join 3 customers to Business A queue ---
    async function joinCustomer(name, phone) {
      const res = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bizAId,
          queueId: queueAId,
          serviceId: serviceAId,
          customerName: name,
          customerPhone: phone,
        }),
      });
      const data = await res.json();
      return data.data;
    }

    const t1 = await joinCustomer('Customer One', '+919811111111');
    tokenWaiting1Id = t1.tokenId;
    const t2 = await joinCustomer('Customer Two', '+919811111112');
    tokenWaiting2Id = t2.tokenId;
    const t3 = await joinCustomer('Customer Three', '+919811111113');
    tokenWaiting3Id = t3.tokenId;

    // --- Test 1: Business A can skip a WAITING token ---
    await t.test('Business A can skip a WAITING token', async () => {
      const skipRes = await fetch(`${baseUrl}/api/v1/business/queue/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bizAToken}`,
        },
        body: JSON.stringify({ businessId: bizAId, queueId: queueAId, tokenId: tokenWaiting1Id }),
      });
      assert.strictEqual(skipRes.status, 200, 'Skip should return 200');
      const skipData = await skipRes.json();
      assert.strictEqual(skipData.success, true);
      assert.strictEqual(skipData.data.status, 'SKIPPED');
      assert.ok(skipData.data.tokenId, 'Should return tokenId');
    });

    // --- Test 2: After skip, token is SKIPPED and cannot be skipped again ---
    await t.test('Already-skipped token cannot be skipped again (400)', async () => {
      const skipAgainRes = await fetch(`${baseUrl}/api/v1/business/queue/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bizAToken}`,
        },
        body: JSON.stringify({ businessId: bizAId, queueId: queueAId, tokenId: tokenWaiting1Id }),
      });
      assert.strictEqual(skipAgainRes.status, 400, 'Double skip should return 400');
    });

    // --- Test 3: Business A calls next — should skip the SKIPPED token, pick Customer Two ---
    await t.test('Call next after skip correctly picks next WAITING customer', async () => {
      const callRes = await fetch(`${baseUrl}/api/v1/business/queue/next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bizAToken}`,
        },
        body: JSON.stringify({ businessId: bizAId, queueId: queueAId }),
      });
      assert.strictEqual(callRes.status, 200, 'Call next should succeed');
      const callData = await callRes.json();
      // Should have picked Customer Two (token2) not Customer One (skipped)
      assert.notStrictEqual(callData.data.tokenId, tokenWaiting1Id, 'Should not call the skipped token');
      assert.strictEqual(callData.data.status, 'SERVING');
    });

    // --- Test 4: Cannot skip a SERVING token ---
    await t.test('Cannot skip a SERVING token (400)', async () => {
      // tokenWaiting2Id is now SERVING (called above)
      const skipServingRes = await fetch(`${baseUrl}/api/v1/business/queue/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bizAToken}`,
        },
        body: JSON.stringify({ businessId: bizAId, queueId: queueAId, tokenId: tokenWaiting2Id }),
      });
      assert.strictEqual(skipServingRes.status, 400, 'Skip SERVING should return 400');
    });

    // --- Test 5: Business B cannot skip Business A tokens (403) ---
    await t.test('Business B cannot skip tokens in Business A queue (403 Forbidden)', async () => {
      const crossSkipRes = await fetch(`${baseUrl}/api/v1/business/queue/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bizBToken}`,
        },
        body: JSON.stringify({ businessId: bizAId, queueId: queueAId, tokenId: tokenWaiting3Id }),
      });
      assert.strictEqual(crossSkipRes.status, 403, 'Cross-tenant skip should return 403');
    });

    // --- Test 6: Unauthenticated request returns 401 ---
    await t.test('Unauthenticated skip request returns 401', async () => {
      const unauthRes = await fetch(`${baseUrl}/api/v1/business/queue/skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: bizAId, queueId: queueAId, tokenId: tokenWaiting3Id }),
      });
      assert.strictEqual(unauthRes.status, 401, 'Unauthenticated should return 401');
    });

    // --- Test 7: Missing tokenId returns 400 ---
    await t.test('Skip without tokenId returns 400 Bad Request', async () => {
      const missingTokenRes = await fetch(`${baseUrl}/api/v1/business/queue/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bizAToken}`,
        },
        body: JSON.stringify({ businessId: bizAId, queueId: queueAId }),
      });
      assert.strictEqual(missingTokenRes.status, 400, 'Missing tokenId should return 400');
    });

    // --- Test 8: Customer role cannot call skip endpoint (403) ---
    await t.test('Customer role cannot call business skip endpoint (403 Forbidden)', async () => {
      const customerReg = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Random Customer',
          email: `cust_skip_${ts}@example.com`,
          phone: '+919800009999',
          password: pass,
        }),
      });
      const custData = await customerReg.json();
      const custToken = custData.data.token;

      const custSkipRes = await fetch(`${baseUrl}/api/v1/business/queue/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${custToken}`,
        },
        body: JSON.stringify({ businessId: bizAId, queueId: queueAId, tokenId: tokenWaiting3Id }),
      });
      assert.strictEqual(custSkipRes.status, 403, 'Customer role should get 403');
    });

  } finally {
    server.close();
  }
});
