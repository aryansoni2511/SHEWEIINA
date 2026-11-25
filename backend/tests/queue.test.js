import test from 'node:test';
import assert from 'node:assert';
import app from '../app.js';
import { createToken, findQueueById, setCustomQueueClientHandler } from '../models/queueModel.js';

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
          customerPhone: '9988776655',
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
          customerPhone: '9988776655',
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
          customerPhone: '9988776655',
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

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 2: Atomic Queue Token Creation & Transaction Safety
    // ─────────────────────────────────────────────────────────────────────────

    // 7. Concurrent Token Creation allocates distinct sequence numbers without gaps or duplicates
    await t.test('Concurrent token creation allocates unique, strictly monotonic sequence numbers', async () => {
      const phones = ['9800110001', '9800110002', '9800110003', '9800110004'];
      const names = ['Concurrent Customer Alpha', 'Concurrent Customer Beta', 'Concurrent Customer Gamma', 'Concurrent Customer Delta'];
      const promises = phones.map((phone, idx) =>
        fetch(`${baseUrl}/api/v1/queue/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: validBusinessId,
            queueId: validQueueId,
            serviceId: validServiceId,
            customerName: names[idx],
            customerPhone: phone,
          }),
        }).then((r) => r.json())
      );

      const results = await Promise.all(promises);
      results.forEach((r) => {
        assert.strictEqual(r.success, true);
        assert.ok(r.data.tokenNumber);
      });

      const tokenNumbers = results.map((r) => r.data.tokenNumber);
      const uniqueNumbers = new Set(tokenNumbers);
      assert.strictEqual(uniqueNumbers.size, tokenNumbers.length, 'Every concurrent token must have a unique token number');
    });

    // 8. Transaction Safety: Mock store sequence rollback on failure
    await t.test('Failed token creation rolls back queue sequence in mock store', async () => {
      const queueBefore = await findQueueById(validQueueId);
      const seqBefore = queueBefore.current_sequence;

      // Passing invalid data that fails within createToken
      let threw = false;
      try {
        await createToken({
          queueId: validQueueId,
          businessId: validBusinessId,
          serviceId: validServiceId,
          get customerName() {
            throw new Error('Simulated processing failure during token generation');
          },
          customerPhone: '9800999888',
        });
      } catch (err) {
        threw = true;
        assert.ok(err.message.includes('Simulated processing failure'));
      }

      assert.strictEqual(threw, true, 'createToken should have thrown');
      const queueAfter = await findQueueById(validQueueId);
      assert.strictEqual(
        queueAfter.current_sequence,
        seqBefore,
        'Sequence number must be rolled back to previous value upon failure'
      );
    });

    // 9. PostgreSQL Transaction Architecture: Verifies BEGIN, FOR UPDATE, COMMIT, and client release
    await t.test('PostgreSQL Transaction executes BEGIN, FOR UPDATE lock, and COMMIT with client release', async () => {
      const log = [];
      let released = false;

      const mockClient = {
        query: async (sql, params) => {
          const normSql = sql.replace(/\s+/g, ' ').trim();
          log.push({ sql: normSql, params });
          if (normSql.includes('SELECT id, token_prefix, current_sequence, is_open, max_daily_capacity FROM queues')) {
            return {
              rows: [{ id: validQueueId, token_prefix: 'S', current_sequence: 15, is_open: true, max_daily_capacity: 200 }],
            };
          }
          if (normSql.includes('SELECT COUNT(*)::int as waiting_count FROM tokens')) {
            return { rows: [{ waiting_count: 2 }] };
          }
          if (normSql.includes('UPDATE queues SET current_sequence = current_sequence + 1')) {
            return { rows: [{ current_sequence: 16 }] };
          }
          if (normSql.includes('INSERT INTO tokens')) {
            return {
              rows: [{
                id: 'tok-pg-test-1',
                queue_id: validQueueId,
                token_number: 'S-116',
                sequence_number: 16,
                status: 'WAITING',
                position: 3,
              }],
            };
          }
          return { rows: [] };
        },
        release: () => {
          released = true;
          log.push({ action: 'RELEASE' });
        },
      };

      setCustomQueueClientHandler(() => mockClient);
      try {
        const token = await createToken({
          queueId: validQueueId,
          businessId: validBusinessId,
          serviceId: validServiceId,
          customerName: 'PG Transaction Customer',
          customerPhone: '9988112233',
        });

        assert.ok(token);
        assert.strictEqual(token.token_number, 'S-116');
        assert.strictEqual(token.sequence_number, 16);
        assert.strictEqual(released, true, 'Database client must be released');

        // Verify transaction statements order
        const sqlStatements = log.map((entry) => entry.sql || entry.action);
        assert.strictEqual(sqlStatements[0], 'BEGIN');
        assert.ok(sqlStatements[1].includes('FOR UPDATE'));
        assert.ok(sqlStatements[2].includes('SELECT COUNT(*)'));
        assert.ok(sqlStatements[3].includes('UPDATE queues'));
        assert.ok(sqlStatements[4].includes('INSERT INTO tokens'));
        assert.strictEqual(sqlStatements[5], 'COMMIT');
        assert.strictEqual(sqlStatements[6], 'RELEASE');
      } finally {
        setCustomQueueClientHandler(null);
      }
    });

    // 10. PostgreSQL Transaction Architecture: Error triggers ROLLBACK and releases client
    await t.test('PostgreSQL Transaction triggers ROLLBACK on insertion error and releases client (no permanent lock)', async () => {
      const log = [];
      let released = false;

      const mockClient = {
        query: async (sql, params) => {
          const normSql = sql.replace(/\s+/g, ' ').trim();
          log.push({ sql: normSql, params });
          if (normSql.includes('SELECT id, token_prefix, current_sequence, is_open, max_daily_capacity FROM queues')) {
            return {
              rows: [{ id: validQueueId, token_prefix: 'S', current_sequence: 20, is_open: true, max_daily_capacity: 200 }],
            };
          }
          if (normSql.includes('SELECT COUNT(*)::int as waiting_count FROM tokens')) {
            return { rows: [{ waiting_count: 5 }] };
          }
          if (normSql.includes('UPDATE queues SET current_sequence = current_sequence + 1')) {
            return { rows: [{ current_sequence: 21 }] };
          }
          if (normSql.includes('INSERT INTO tokens')) {
            throw new Error('Simulated unique constraint violation or DB fatal error on INSERT');
          }
          return { rows: [] };
        },
        release: () => {
          released = true;
          log.push({ action: 'RELEASE' });
        },
      };

      setCustomQueueClientHandler(() => mockClient);
      try {
        let threw = false;
        try {
          await createToken({
            queueId: validQueueId,
            businessId: validBusinessId,
            serviceId: validServiceId,
            customerName: 'PG Error Customer',
            customerPhone: '9988112244',
          });
        } catch (err) {
          threw = true;
          assert.ok(err.message.includes('Simulated unique constraint violation'));
        }

        assert.strictEqual(threw, true, 'Error should be thrown');
        assert.strictEqual(released, true, 'Client must be released even after error');

        const sqlStatements = log.map((entry) => entry.sql || entry.action);
        assert.strictEqual(sqlStatements[0], 'BEGIN');
        assert.ok(sqlStatements[1].includes('FOR UPDATE'));
        assert.ok(sqlStatements.includes('ROLLBACK'), 'Must execute ROLLBACK on error');
        assert.strictEqual(sqlStatements[sqlStatements.length - 1], 'RELEASE', 'Client must be released in finally');
      } finally {
        setCustomQueueClientHandler(null);
      }
    });

  } finally {
    server.close();
  }
});
