import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../app.js';
import { clearAllRateLimitStores } from '../middleware/rateLimiter.js';

test('SHEWWINA Phase 4.1: Backend Duplicate Queue Join Protection Test Suite', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const ts = Date.now();
  let bizToken;
  let bizId1;
  let queueId1;
  let serviceId1;

  let bizId2;
  let queueId2;
  let serviceId2;

  let userAToken;
  let userAId;
  const phoneA = '9820011111';

  let userBToken;
  let userBId;
  const phoneB = '9820022222';

  t.after(() => {
    server.close();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Setup: Register Businesses & Queues
  // ─────────────────────────────────────────────────────────────────────────

  await t.test('0. Setup: Register 2 Test Businesses and Customers', async () => {
    clearAllRateLimitStores();

    // Business 1 (Salon)
    const biz1Res = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Salon Owner',
        email: `dup_salon_${ts}@test.com`,
        phone: '9820099001',
        password: 'Password123!',
        businessName: 'Luxe Salon Alpha',
        category: 'salon',
        city: 'Mumbai',
      }),
    });
    assert.strictEqual(biz1Res.status, 201);
    const biz1Data = (await biz1Res.json()).data;
    bizId1 = biz1Data.business.id;
    queueId1 = biz1Data.queue.id;
    bizToken = biz1Data.token;

    const svc1Res = await fetch(`${baseUrl}/api/v1/business/services?businessId=${bizId1}`);
    const svc1Data = (await svc1Res.json()).data;
    serviceId1 = svc1Data.services[0].id;

    // Business 2 (Clinic)
    const biz2Res = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Clinic Doctor',
        email: `dup_clinic_${ts}@test.com`,
        phone: '9820099002',
        password: 'Password123!',
        businessName: 'Family Care Clinic Beta',
        category: 'clinic',
        city: 'Mumbai',
      }),
    });
    assert.strictEqual(biz2Res.status, 201);
    const biz2Data = (await biz2Res.json()).data;
    bizId2 = biz2Data.business.id;
    queueId2 = biz2Data.queue.id;

    const svc2Res = await fetch(`${baseUrl}/api/v1/business/services?businessId=${bizId2}`);
    const svc2Data = (await svc2Res.json()).data;
    serviceId2 = svc2Data.services[0].id;

    // Customer A (Authenticated)
    const regARes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aarav Patel',
        email: `aarav_dup_${ts}@test.com`,
        phone: phoneA,
        password: 'Password123!',
      }),
    });
    assert.strictEqual(regARes.status, 201);
    const regAData = (await regARes.json()).data;
    userAToken = regAData.token;
    userAId = regAData.user.id;

    // Customer B (Authenticated)
    const regBRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Neha Roy',
        email: `neha_dup_${ts}@test.com`,
        phone: phoneB,
        password: 'Password123!',
      }),
    });
    assert.strictEqual(regBRes.status, 201);
    const regBData = (await regBRes.json()).data;
    userBToken = regBData.token;
    userBId = regBData.user.id;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 1: First join succeeds
  // ─────────────────────────────────────────────────────────────────────────
  let tokenAId;
  let tokenANumber;

  await t.test('1. First join succeeds and generates active WAITING token', async () => {
    clearAllRateLimitStores();
    const res = await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        businessId: bizId1,
        queueId: queueId1,
        serviceId: serviceId1,
        customerName: 'Aarav Patel',
        customerPhone: phoneA,
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.tokenId);
    assert.strictEqual(body.data.status, 'WAITING');

    tokenAId = body.data.tokenId;
    tokenANumber = body.data.tokenNumber;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 2: Same customer joins same queue again → duplicate rejected (409 Conflict)
  // ─────────────────────────────────────────────────────────────────────────
  await t.test('2. Same customer joins same queue again → duplicate rejected with 409 Conflict', async () => {
    clearAllRateLimitStores();

    // 2a. Authenticated attempt with same token / phone
    const resAuth = await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        businessId: bizId1,
        queueId: queueId1,
        serviceId: serviceId1,
        customerName: 'Aarav Patel',
        customerPhone: phoneA,
      }),
    });

    assert.strictEqual(resAuth.status, 409);
    const bodyAuth = await resAuth.json();
    assert.strictEqual(bodyAuth.success, false);
    assert.match(bodyAuth.message, /already have an active token/i);
    assert.match(bodyAuth.message, new RegExp(tokenANumber));

    // 2b. Guest checkout attempt with identical phone number
    const resGuest = await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: bizId1,
        queueId: queueId1,
        serviceId: serviceId1,
        customerName: 'Aarav Guest',
        customerPhone: phoneA,
      }),
    });

    assert.strictEqual(resGuest.status, 409);
    const bodyGuest = await resGuest.json();
    assert.strictEqual(bodyGuest.success, false);
    assert.match(bodyGuest.message, /already have an active token/i);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 3: Different customer joins same queue → succeeds
  // ─────────────────────────────────────────────────────────────────────────
  let tokenBId;
  await t.test('3. Different customer joins same queue → succeeds', async () => {
    clearAllRateLimitStores();
    const res = await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({
        businessId: bizId1,
        queueId: queueId1,
        serviceId: serviceId1,
        customerName: 'Neha Roy',
        customerPhone: phoneB,
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'WAITING');
    assert.strictEqual(body.data.position, 2);
    assert.strictEqual(body.data.peopleAhead, 1);
    tokenBId = body.data.tokenId;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 4: Same customer joins a different queue → succeeds
  // ─────────────────────────────────────────────────────────────────────────
  await t.test('4. Same customer joins a different queue → succeeds', async () => {
    clearAllRateLimitStores();
    // Customer A joins Queue 2 (Clinic) while still active in Queue 1 (Salon)
    const res = await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        businessId: bizId2,
        queueId: queueId2,
        serviceId: serviceId2,
        customerName: 'Aarav Patel',
        customerPhone: phoneA,
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'WAITING');
    assert.ok(body.data.tokenId);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 5: Cancelled token does not block a new join
  // ─────────────────────────────────────────────────────────────────────────
  await t.test('5. Cancelled token does not block a new join', async () => {
    clearAllRateLimitStores();

    // Customer B cancels their token in Queue 1
    const cancelRes = await fetch(`${baseUrl}/api/v1/queue/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({ tokenId: tokenBId }),
    });
    assert.strictEqual(cancelRes.status, 200);

    // Customer B now rejoins Queue 1 → must succeed!
    const rejoinRes = await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({
        businessId: bizId1,
        queueId: queueId1,
        serviceId: serviceId1,
        customerName: 'Neha Roy',
        customerPhone: phoneB,
      }),
    });

    assert.strictEqual(rejoinRes.status, 201);
    const rejoinBody = await rejoinRes.json();
    assert.strictEqual(rejoinBody.success, true);
    assert.strictEqual(rejoinBody.data.status, 'WAITING');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 6: Completed/served token follows the intended active-token policy
  // ─────────────────────────────────────────────────────────────────────────
  await t.test('6. Completed/served token follows the active-token policy (allows new join after service completion)', async () => {
    clearAllRateLimitStores();

    // Operator calls next customer (Token A transitions WAITING -> SERVING)
    const callRes = await fetch(`${baseUrl}/api/v1/business/queue/next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bizToken}`,
      },
      body: JSON.stringify({ businessId: bizId1, queueId: queueId1 }),
    });
    assert.strictEqual(callRes.status, 200);

    // While SERVING, Customer A cannot join again (blocked as active)
    const joinWhileServing = await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        businessId: bizId1,
        queueId: queueId1,
        serviceId: serviceId1,
        customerName: 'Aarav Patel',
        customerPhone: phoneA,
      }),
    });
    assert.strictEqual(joinWhileServing.status, 409);
    const servingErr = await joinWhileServing.json();
    assert.match(servingErr.message, /currently being served|active token/i);

    // Operator completes service for Token A (transitions SERVING -> SERVED)
    const completeRes = await fetch(`${baseUrl}/api/v1/business/queue/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bizToken}`,
      },
      body: JSON.stringify({ businessId: bizId1, queueId: queueId1 }),
    });
    assert.strictEqual(completeRes.status, 200);

    // After completion, Customer A joins again → must succeed!
    const joinAfterComplete = await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        businessId: bizId1,
        queueId: queueId1,
        serviceId: serviceId1,
        customerName: 'Aarav Patel',
        customerPhone: phoneA,
      }),
    });
    assert.strictEqual(joinAfterComplete.status, 201);
    const completedRejoinBody = await joinAfterComplete.json();
    assert.strictEqual(completedRejoinBody.success, true);
    assert.strictEqual(completedRejoinBody.data.status, 'WAITING');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 7: Five concurrent requests from the SAME customer → exactly ONE active token
  // ─────────────────────────────────────────────────────────────────────────
  await t.test('7. Five concurrent requests from same customer to same queue → exactly one token created', async () => {
    clearAllRateLimitStores();
    const concurrentPhone = '9833355555';
    const concurrentName = 'Concurrent Spammer';

    const promises = Array.from({ length: 5 }, () =>
      fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bizId2,
          queueId: queueId2,
          serviceId: serviceId2,
          customerName: concurrentName,
          customerPhone: concurrentPhone,
        }),
      }).then(async (res) => ({
        status: res.status,
        body: await res.json(),
      }))
    );

    const responses = await Promise.all(promises);
    const successes = responses.filter((r) => r.status === 201);
    const conflicts = responses.filter((r) => r.status === 409);

    assert.strictEqual(successes.length, 1, 'Exactly one concurrent request must succeed with 201');
    assert.strictEqual(conflicts.length, 4, 'Exactly 4 concurrent requests must be rejected with 409 Conflict');
    conflicts.forEach((c) => {
      assert.match(c.body.message, /already have an active token/i);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 8: Five concurrent requests from DIFFERENT customers → ALL succeed
  // ─────────────────────────────────────────────────────────────────────────
  await t.test('8. Five concurrent requests from different customers → all 5 valid joins succeed', async () => {
    clearAllRateLimitStores();
    const customers = [
      { name: 'Customer One', phone: '9844400001' },
      { name: 'Customer Two', phone: '9844400002' },
      { name: 'Customer Three', phone: '9844400003' },
      { name: 'Customer Four', phone: '9844400004' },
      { name: 'Customer Five', phone: '9844400005' },
    ];

    const promises = customers.map((c) =>
      fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bizId2,
          queueId: queueId2,
          serviceId: serviceId2,
          customerName: c.name,
          customerPhone: c.phone,
        }),
      }).then(async (res) => ({
        status: res.status,
        body: await res.json(),
      }))
    );

    const responses = await Promise.all(promises);
    const successes = responses.filter((r) => r.status === 201);
    assert.strictEqual(successes.length, 5, 'All 5 distinct customers must successfully join the queue');

    const tokenNumbers = successes.map((s) => s.body.data.tokenNumber);
    const uniqueTokens = new Set(tokenNumbers);
    assert.strictEqual(uniqueTokens.size, 5, 'All 5 allocated token numbers must be unique');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 9: Authenticated user joining with a DIFFERENT phone number in same queue
  //         → duplicate rejected by user_id match with DUPLICATE_ACTIVE_TOKEN
  // ─────────────────────────────────────────────────────────────────────────
  await t.test('9. Authenticated customer joining with a different phone number is blocked by user_id match', async () => {
    clearAllRateLimitStores();
    // Customer B currently has an active WAITING token in Queue 1 (from Test 5)
    const alternatePhone = '9820033333';
    const res = await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({
        businessId: bizId1,
        queueId: queueId1,
        serviceId: serviceId1,
        customerName: 'Neha Alternate Phone',
        customerPhone: alternatePhone,
      }),
    });

    assert.strictEqual(res.status, 409);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.code, 'DUPLICATE_ACTIVE_TOKEN');
    assert.ok(body.details);
    assert.strictEqual(body.details.code, 'DUPLICATE_ACTIVE_TOKEN');
    assert.ok(body.details.tokenId, 'Response details must provide tokenId for active token recovery');
    assert.ok(body.details.tokenNumber, 'Response details must provide tokenNumber');
    assert.match(body.message, /already have an active token/i);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 10: Authenticated customer joins a DIFFERENT queue with alternate phone → succeeds
  // ─────────────────────────────────────────────────────────────────────────
  await t.test('10. Authenticated customer joins a DIFFERENT queue with alternate phone → succeeds (queues remain independent)', async () => {
    clearAllRateLimitStores();
    const alternatePhone = '9820033333';
    const res = await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({
        businessId: bizId2,
        queueId: queueId2,
        serviceId: serviceId2,
        customerName: 'Neha Alternate Phone',
        customerPhone: alternatePhone,
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'WAITING');
    assert.ok(body.data.tokenId);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test 11: Unauthenticated guests with different phone numbers and NULL user IDs
  //          never match each other as duplicates
  // ─────────────────────────────────────────────────────────────────────────
  await t.test('11. Unauthenticated guest joins never collide on NULL user_id', async () => {
    clearAllRateLimitStores();
    const guestRes1 = await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: bizId1,
        queueId: queueId1,
        serviceId: serviceId1,
        customerName: 'Guest Person One',
        customerPhone: '9855511111',
      }),
    });
    assert.strictEqual(guestRes1.status, 201);

    const guestRes2 = await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: bizId1,
        queueId: queueId1,
        serviceId: serviceId1,
        customerName: 'Guest Person Two',
        customerPhone: '9855522222',
      }),
    });
    assert.strictEqual(guestRes2.status, 201);
  });
});
