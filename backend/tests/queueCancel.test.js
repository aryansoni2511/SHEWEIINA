import test from 'node:test';
import assert from 'node:assert';
import app from '../app.js';

test('Phase 4B Customer Queue Management — Token Cancellation & Recalculation Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const ts = Date.now();
  const custAEmail = `cancel_custA_${ts}@example.com`;
  const custBEmail = `cancel_custB_${ts}@example.com`;
  const custCEmail = `cancel_custC_${ts}@example.com`;
  const bizEmail = `cancel_biz_${ts}@example.com`;
  const pass = 'Secret123!';

  let custAToken = '';
  let custBToken = '';
  let custCToken = '';
  let bizToken = '';
  let bizId = '';
  let queueId = '';
  let serviceId = '';

  let tokenIdA = '';
  let tokenNumA = '';
  let tokenIdB = '';
  let tokenNumB = '';
  let tokenIdC = '';
  let tokenNumC = '';

  try {
    // 0. Setup Business & 3 Customers
    const bizRes = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Cancellation Test Manager',
        email: bizEmail,
        phone: '+919888877777',
        password: pass,
        businessName: 'Cancel Test Salon',
        category: 'salon',
        city: 'Mumbai',
      }),
    });
    const bizData = await bizRes.json();
    bizToken = bizData.data.token;
    bizId = bizData.data.business.id;
    queueId = bizData.data.queue.id;

    const svcRes = await fetch(`${baseUrl}/api/v1/business/services?businessId=${bizId}`);
    const svcData = await svcRes.json();
    serviceId = svcData.data.services[0].id;

    // Register Customer A, B, C
    const regA = await (await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Customer A', email: custAEmail, phone: '+919000000001', password: pass }),
    })).json();
    custAToken = regA.data.token;

    const regB = await (await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Customer B', email: custBEmail, phone: '+919000000002', password: pass }),
    })).json();
    custBToken = regB.data.token;

    const regC = await (await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Customer C', email: custCEmail, phone: '+919000000003', password: pass }),
    })).json();
    custCToken = regC.data.token;

    // Customers A, B, C join queue in sequence
    const joinA = await (await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custAToken}` },
      body: JSON.stringify({ businessId: bizId, queueId, serviceId, customerName: 'Customer A', customerPhone: '+919000000001' }),
    })).json();
    tokenIdA = joinA.data.tokenId;
    tokenNumA = joinA.data.tokenNumber;

    const joinB = await (await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custBToken}` },
      body: JSON.stringify({ businessId: bizId, queueId, serviceId, customerName: 'Customer B', customerPhone: '+919000000002' }),
    })).json();
    tokenIdB = joinB.data.tokenId;
    tokenNumB = joinB.data.tokenNumber;

    const joinC = await (await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custCToken}` },
      body: JSON.stringify({ businessId: bizId, queueId, serviceId, customerName: 'Customer C', customerPhone: '+919000000003' }),
    })).json();
    tokenIdC = joinC.data.tokenId;
    tokenNumC = joinC.data.tokenNumber;

    // Verify initial positions: A = 0 ahead, B = 1 ahead, C = 2 ahead
    const statusCBefore = await (await fetch(`${baseUrl}/api/v1/queue/status/${tokenIdC}`)).json();
    assert.strictEqual(statusCBefore.data.peopleAhead, 2);

    // 1. Customer B cancels Customer B's token -> SUCCESS
    await t.test('Customer B can cancel Customer B token', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custBToken}` },
        body: JSON.stringify({ tokenId: tokenIdB }),
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.status, 'CANCELLED');
    });

    // 2. Queue position recalculation after B cancels: Customer C peopleAhead updates from 2 -> 1
    await t.test('Queue position and wait time automatically update after cancellation', async () => {
      const statusCAfter = await (await fetch(`${baseUrl}/api/v1/queue/status/${tokenIdC}`)).json();
      assert.strictEqual(statusCAfter.data.peopleAhead, 1);
    });

    // 3. Customer A cannot cancel Customer C's token (Forbidden 403)
    await t.test('Customer A cannot cancel Customer C token (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custAToken}` },
        body: JSON.stringify({ tokenId: tokenIdC }),
      });
      assert.strictEqual(res.status, 403);
    });

    // 4. Unauthenticated user cannot cancel token (401 Unauthorized)
    await t.test('Unauthenticated user receives 401 when cancelling token', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId: tokenIdA }),
      });
      assert.strictEqual(res.status, 401);
    });

    // 5. Business user cannot use customer cancellation endpoint (403 Forbidden)
    await t.test('Business user receives 403 when calling customer cancel endpoint', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bizToken}` },
        body: JSON.stringify({ tokenId: tokenIdA }),
      });
      assert.strictEqual(res.status, 403);
    });

    // 6. Already CANCELLED token cannot be cancelled again (400 Bad Request)
    await t.test('Already CANCELLED token cannot be cancelled again (400 Bad Request)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custBToken}` },
        body: JSON.stringify({ tokenId: tokenIdB }),
      });
      assert.strictEqual(res.status, 400);
    });

    // 7. SERVING token cannot be cancelled (400 Bad Request)
    await t.test('SERVING token cannot be cancelled (400 Bad Request)', async () => {
      // Business calls next -> Customer A becomes SERVING
      const callA = await fetch(`${baseUrl}/api/v1/business/queue/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bizToken}` },
        body: JSON.stringify({ businessId: bizId }),
      });
      assert.strictEqual(callA.status, 200);

      // Customer A tries to cancel while SERVING -> 400 Bad Request
      const cancelA = await fetch(`${baseUrl}/api/v1/queue/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custAToken}` },
        body: JSON.stringify({ tokenId: tokenIdA }),
      });
      assert.strictEqual(cancelA.status, 400);
    });

    // 8. SERVED token cannot be cancelled (400 Bad Request)
    await t.test('SERVED token cannot be cancelled (400 Bad Request)', async () => {
      // Business completes Customer A
      const compA = await fetch(`${baseUrl}/api/v1/business/queue/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bizToken}` },
        body: JSON.stringify({ businessId: bizId }),
      });
      assert.strictEqual(compA.status, 200);

      // Customer A tries to cancel while SERVED -> 400 Bad Request
      const cancelA = await fetch(`${baseUrl}/api/v1/queue/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custAToken}` },
        body: JSON.stringify({ tokenId: tokenIdA }),
      });
      assert.strictEqual(cancelA.status, 400);
    });

    // 9. Business Dashboard ignores CANCELLED token: Call Next selects Customer C directly (skipping Customer B)
    await t.test('Business Dashboard Call Next skips CANCELLED Customer B and selects Customer C', async () => {
      const callNext = await (await fetch(`${baseUrl}/api/v1/business/queue/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bizToken}` },
        body: JSON.stringify({ businessId: bizId }),
      })).json();

      assert.strictEqual(callNext.success, true);
      assert.strictEqual(callNext.data.tokenId, tokenIdC);
      assert.strictEqual(callNext.data.tokenNumber, tokenNumC);
    });

  } finally {
    server.close();
  }
});
