import test from 'node:test';
import assert from 'node:assert';
import app from '../app.js';

test('Phase 3 & 4 Core Queue REST API Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const validBusinessId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const validQueueId = 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
  const closedQueueId = 'd3eebc99-closed-queue-id';
  const validServiceId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  let createdTokenId = null;
  let businessAuthToken = null;

  try {
    // 0. Login as demo business owner to obtain JWT for protected business routes
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'owner@shewwina.com',
        password: 'password123',
      }),
    });
    if (loginRes.status === 200) {
      const loginBody = await loginRes.json();
      businessAuthToken = loginBody.data.token;
    }

    const authHeaders = businessAuthToken
      ? { Authorization: `Bearer ${businessAuthToken}` }
      : {};

    // 1. POST /api/v1/queue/join — Success
    await t.test('POST /api/v1/queue/join succeeds with valid data', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: validBusinessId,
          queueId: validQueueId,
          serviceId: validServiceId,
          customerName: 'Amit Verma',
          customerPhone: '+919988776655',
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.message, 'Successfully joined queue');
      assert.ok(body.data.tokenId);
      assert.ok(body.data.tokenNumber);
      assert.strictEqual(body.data.status, 'WAITING');
      assert.ok(typeof body.data.position === 'number');

      createdTokenId = body.data.tokenId;
    });

    // 2. POST /api/v1/queue/join — Validation Failures
    await t.test('POST /api/v1/queue/join fails when required fields are missing', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: validBusinessId,
        }),
      });

      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });

    await t.test('POST /api/v1/queue/join fails with nonexistent business', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: 'non-existent-business-id',
          queueId: validQueueId,
          serviceId: validServiceId,
          customerName: 'Amit Verma',
          customerPhone: '+919988776655',
        }),
      });

      assert.strictEqual(res.status, 404);
    });

    await t.test('POST /api/v1/queue/join fails when queue is closed', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: validBusinessId,
          queueId: closedQueueId,
          serviceId: validServiceId,
          customerName: 'Amit Verma',
          customerPhone: '+919988776655',
        }),
      });

      assert.strictEqual(res.status, 409);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.ok(body.message.includes('closed'));
    });

    // 3. GET /api/v1/queue/status/:tokenId
    await t.test('GET /api/v1/queue/status/:tokenId retrieves active token status', async () => {
      const targetId = createdTokenId || 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';
      const res = await fetch(`${baseUrl}/api/v1/queue/status/${targetId}`);
      assert.strictEqual(res.status, 200);

      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.tokenId);
      assert.ok(body.data.status);
      assert.ok(typeof body.data.peopleAhead === 'number');
    });

    await t.test('GET /api/v1/queue/status/:tokenId returns 404 for nonexistent token', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/status/non-existent-token-999`);
      assert.strictEqual(res.status, 404);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });

    // 4. GET /api/v1/business/queue
    await t.test('GET /api/v1/business/queue retrieves active business queue list', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/queue?businessId=${validBusinessId}`, {
        headers: authHeaders,
      });
      assert.strictEqual(res.status, 200);

      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.queue);
      assert.ok(Array.isArray(body.data.tokens));
      assert.ok(body.data.tokens.length > 0);
    });

    // 5. Metric Verification Test: Call Next and Complete Service maintain Currently Serving = 1 or 0
    await t.test('Call Next and Complete Service maintain Currently Serving metric correctly', async () => {
      // Call Next (Token S-102) -> Currently Serving should be 1
      const callRes1 = await fetch(`${baseUrl}/api/v1/business/queue/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ businessId: validBusinessId, queueId: validQueueId }),
      });
      assert.strictEqual(callRes1.status, 200);

      const qRes1 = await fetch(`${baseUrl}/api/v1/business/queue?businessId=${validBusinessId}`, {
        headers: authHeaders,
      });
      const qBody1 = await qRes1.json();
      assert.strictEqual(qBody1.data.servingCount, 1);

      // Call Next again (Token S-103) -> Currently Serving MUST remain 1
      const callRes2 = await fetch(`${baseUrl}/api/v1/business/queue/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ businessId: validBusinessId, queueId: validQueueId }),
      });
      assert.strictEqual(callRes2.status, 200);

      const qRes2 = await fetch(`${baseUrl}/api/v1/business/queue?businessId=${validBusinessId}`, {
        headers: authHeaders,
      });
      const qBody2 = await qRes2.json();
      assert.strictEqual(qBody2.data.servingCount, 1);

      // Complete Service -> Currently Serving MUST become 0
      const compRes = await fetch(`${baseUrl}/api/v1/business/queue/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ businessId: validBusinessId, queueId: validQueueId }),
      });
      assert.strictEqual(compRes.status, 200);

      const qRes3 = await fetch(`${baseUrl}/api/v1/business/queue?businessId=${validBusinessId}`, {
        headers: authHeaders,
      });
      const qBody3 = await qRes3.json();
      assert.strictEqual(qBody3.data.servingCount, 0);
      assert.ok(qBody3.data.totalTokens >= 3);
    });

    // 6. GET /api/v1/business/services
    await t.test('GET /api/v1/business/services retrieves business details and active services', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/services?businessId=${validBusinessId}`);
      assert.strictEqual(res.status, 200);

      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.business);
      assert.ok(Array.isArray(body.data.services));
      assert.ok(body.data.services.length > 0);
    });

  } finally {
    server.close();
  }
});
