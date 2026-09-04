import test from 'node:test';
import assert from 'node:assert';
import http from 'http';
import app from '../app.js';
import realtimeService from '../services/realtimeService.js';

test('Phase 7B Realtime Queue Updates Test Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const ts = Date.now();
  const pass = 'Password123!';
  let bizToken = '';
  let bizId = '';
  let queueId = '';
  let serviceId = '';

  try {
    // Setup Business A
    const bizRes = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Realtime Hospital Admin',
        email: `realtime_biz_${ts}@example.com`,
        phone: '+919900001111',
        password: pass,
        businessName: 'City General Hospital',
        category: 'hospital',
        city: 'Delhi',
      }),
    });
    const bizData = await bizRes.json();
    assert.strictEqual(bizRes.status, 201);
    bizToken = bizData.data.token;
    bizId = bizData.data.business.id;
    queueId = bizData.data.queue.id;

    // Get default service
    const svcRes = await fetch(`${baseUrl}/api/v1/business/services?businessId=${bizId}`);
    const svcData = await svcRes.json();
    serviceId = svcData.data.services[0].id;

    // --- Test 1: Connect SSE stream with missing parameters returns 400 ---
    await t.test('GET /api/v1/queue/stream without tokenId or businessId returns 400', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/stream`);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('Must provide either tokenId or authorized businessId'));
    });

    // --- Test 2a: Business subscription with mismatched auth token returns 403 (Tenant Isolation) ---
    await t.test('GET /api/v1/queue/stream with mismatched business token returns 403', async () => {
      // Create second business to get token
      const biz2Res = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Other Biz Owner',
          email: `other_biz_${ts}@example.com`,
          phone: '+919900002222',
          password: pass,
          businessName: 'Other Business',
          category: 'salon',
          city: 'Delhi',
        }),
      });
      const biz2Data = await biz2Res.json();
      const otherToken = biz2Data.data.token;

      const res = await fetch(`${baseUrl}/api/v1/queue/stream?businessId=${bizId}`, {
        headers: { Authorization: `Bearer ${otherToken}` },
      });
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('Forbidden'));
    });

    // --- Test 2b: Public Waiting Room Display can connect to SSE unauthenticated ---
    await t.test('Public display can open SSE stream unauthenticated with public=true', async () => {
      await new Promise((resolve, reject) => {
        const req = http.get(`${baseUrl}/api/v1/queue/stream?businessId=${bizId}&public=true`, (res) => {
          assert.strictEqual(res.statusCode, 200);
          assert.strictEqual(res.headers['content-type'], 'text/event-stream');
          assert.strictEqual(res.headers['connection'], 'keep-alive');

          let received = '';
          res.on('data', (chunk) => {
            received += chunk.toString();
            if (received.includes('event: connected')) {
              req.destroy();
              resolve();
            }
          });
          res.on('error', reject);
        });
        req.on('error', reject);
      });
    });

    // --- Test 3: Customer can connect with tokenId and receives SSE initial event ---
    await t.test('Customer can open SSE stream for specific tokenId', async () => {
      // First join customer
      const joinRes = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bizId,
          queueId,
          serviceId,
          customerName: 'Aarav Patel',
          customerPhone: '+919911112222',
        }),
      });
      const joinData = await joinRes.json();
      assert.strictEqual(joinRes.status, 201);
      const tokenId = joinData.data.tokenId;

      // Connect via native http.get to observe raw SSE stream
      await new Promise((resolve, reject) => {
        const req = http.get(`${baseUrl}/api/v1/queue/stream?tokenId=${tokenId}`, (res) => {
          assert.strictEqual(res.statusCode, 200);
          assert.strictEqual(res.headers['content-type'], 'text/event-stream');
          assert.strictEqual(res.headers['connection'], 'keep-alive');

          let received = '';
          res.on('data', (chunk) => {
            received += chunk.toString();
            if (received.includes('event: connected')) {
              req.destroy(); // Cleanly disconnect
              resolve();
            }
          });
          res.on('error', reject);
        });
        req.on('error', reject);
      });
    });

    // --- Test 4: Business can open SSE stream with auth token ---
    await t.test('Business can connect to SSE stream with valid Bearer token', async () => {
      await new Promise((resolve, reject) => {
        const req = http.get(
          `${baseUrl}/api/v1/queue/stream?businessId=${bizId}`,
          {
            headers: {
              Authorization: `Bearer ${bizToken}`,
            },
          },
          (res) => {
            assert.strictEqual(res.statusCode, 200);
            assert.strictEqual(res.headers['content-type'], 'text/event-stream');

            let received = '';
            res.on('data', (chunk) => {
              received += chunk.toString();
              if (received.includes('event: connected')) {
                req.destroy();
                resolve();
              }
            });
            res.on('error', reject);
          }
        );
        req.on('error', reject);
      });
    });

    // --- Test 5: Realtime event dispatched when business calls next ---
    await t.test('Calling next customer triggers realtime queue_update event', async () => {
      // Connect business stream
      await new Promise(async (resolve, reject) => {
        let streamEstablished = false;

        const streamReq = http.get(
          `${baseUrl}/api/v1/queue/stream?businessId=${bizId}`,
          {
            headers: { Authorization: `Bearer ${bizToken}` },
          },
          (res) => {
            let buffer = '';
            res.on('data', (chunk) => {
              buffer += chunk.toString();
              if (buffer.includes('event: connected') && !streamEstablished) {
                streamEstablished = true;

                // Now call next customer to generate a CUSTOMER_CALLED event
                fetch(`${baseUrl}/api/v1/business/queue/next`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${bizToken}`,
                  },
                  body: JSON.stringify({ businessId: bizId, queueId }),
                }).catch(reject);
              }

              if (buffer.includes('event: queue_update') && buffer.includes('CUSTOMER_CALLED')) {
                streamReq.destroy();
                resolve();
              }
            });
            res.on('error', reject);
          }
        );
        streamReq.on('error', reject);
      });
    });

    // --- Test 6: Client disconnect cleans up subscribers registry ---
    await t.test('Client disconnect automatically removes client from realtime registry', async () => {
      let clientConnectedCount = 0;

      await new Promise((resolve, reject) => {
        const streamReq = http.get(
          `${baseUrl}/api/v1/queue/stream?businessId=${bizId}&token=${bizToken}`,
          (res) => {
            res.once('data', () => {
              clientConnectedCount = realtimeService.getClientCount();
              assert.ok(clientConnectedCount >= 1, 'Client count should be >= 1 while connected');
              // Now close the connection
              streamReq.destroy();
              setTimeout(() => {
                const countAfter = realtimeService.getClientCount();
                assert.strictEqual(countAfter, clientConnectedCount - 1, 'Client count should decrease by 1 after destroy');
                resolve();
              }, 150);
            });
          }
        );
        streamReq.on('error', () => {
          // Expected on destroy
        });
      });
    });

    // --- Test 7: Customer tokenId subscriber receives CUSTOMER_CALLED event (regression for Phase 7B fix) ---
    await t.test('Customer tokenId SSE subscriber receives CUSTOMER_CALLED queue_update event', async () => {
      // Join a fresh customer
      const joinRes = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bizId,
          queueId,
          serviceId,
          customerName: 'Priya Sharma',
          customerPhone: '+919922223333',
        }),
      });
      const joinData = await joinRes.json();
      assert.strictEqual(joinRes.status, 201);
      const cusTokenId = joinData.data.tokenId;

      // Connect SSE stream as the customer (tokenId only, no auth)
      await new Promise(async (resolve, reject) => {
        let streamEstablished = false;

        const streamReq = http.get(
          `${baseUrl}/api/v1/queue/stream?tokenId=${cusTokenId}`,
          (res) => {
            assert.strictEqual(res.statusCode, 200);
            let buffer = '';
            res.on('data', (chunk) => {
              buffer += chunk.toString();
              if (buffer.includes('event: connected') && !streamEstablished) {
                streamEstablished = true;
                // Business calls next to generate CUSTOMER_CALLED
                fetch(`${baseUrl}/api/v1/business/queue/next`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${bizToken}`,
                  },
                  body: JSON.stringify({ businessId: bizId, queueId }),
                }).catch(reject);
              }
              if (buffer.includes('event: queue_update') && buffer.includes('CUSTOMER_CALLED')) {
                streamReq.destroy();
                resolve();
              }
            });
            res.on('error', reject);
          }
        );
        streamReq.on('error', () => {});
      });
    });

    // --- Test 8: QUEUE_SETTINGS_UPDATED is now broadcast to business subscribers (dead-code fix regression) ---
    await t.test('QUEUE_SETTINGS_UPDATED event is emitted after queue settings update', async () => {
      await new Promise(async (resolve, reject) => {
        let streamEstablished = false;

        const streamReq = http.get(
          `${baseUrl}/api/v1/queue/stream?businessId=${bizId}`,
          { headers: { Authorization: `Bearer ${bizToken}` } },
          (res) => {
            let buffer = '';
            res.on('data', (chunk) => {
              buffer += chunk.toString();
              if (buffer.includes('event: connected') && !streamEstablished) {
                streamEstablished = true;
                // Update queue settings to trigger the broadcast
                fetch(`${baseUrl}/api/v1/business/queue/settings`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${bizToken}`,
                  },
                  body: JSON.stringify({ queueId, name: 'Updated Queue Name' }),
                }).catch(reject);
              }
              if (buffer.includes('QUEUE_SETTINGS_UPDATED')) {
                streamReq.destroy();
                resolve();
              }
            });
            res.on('error', reject);
          }
        );
        streamReq.on('error', () => {});
      });
    });

    // --- Test 9: Multiple tokenId clients both receive queue_update on CUSTOMER_CALLED (fan-out regression) ---
    await t.test('Multiple tokenId subscribers both receive CUSTOMER_CALLED fan-out event', async () => {
      // Join two customers
      const join1 = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bizId,
          queueId,
          serviceId,
          customerName: 'Arjun Singh',
          customerPhone: '+919933334444',
        }),
      });
      const data1 = await join1.json();
      assert.strictEqual(join1.status, 201);

      const join2 = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bizId,
          queueId,
          serviceId,
          customerName: 'Meera Nair',
          customerPhone: '+919944445555',
        }),
      });
      const data2 = await join2.json();
      assert.strictEqual(join2.status, 201);

      const tokenId1 = data1.data.tokenId;
      const tokenId2 = data2.data.tokenId;

      // Both customers open SSE streams
      const received1 = { called: false };
      const received2 = { called: false };

      await new Promise(async (resolve, reject) => {
        let established1 = false;
        let established2 = false;

        function maybeCallNext() {
          if (established1 && established2) {
            fetch(`${baseUrl}/api/v1/business/queue/next`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${bizToken}`,
              },
              body: JSON.stringify({ businessId: bizId, queueId }),
            }).catch(reject);
          }
        }

        function maybeResolve(req1, req2) {
          if (received1.called && received2.called) {
            req1.destroy();
            req2.destroy();
            resolve();
          }
        }

        const req1 = http.get(
          `${baseUrl}/api/v1/queue/stream?tokenId=${tokenId1}`,
          (res) => {
            let buf = '';
            res.on('data', (chunk) => {
              buf += chunk.toString();
              if (buf.includes('event: connected') && !established1) {
                established1 = true;
                maybeCallNext();
              }
              if (buf.includes('CUSTOMER_CALLED')) {
                received1.called = true;
                maybeResolve(req1, req2);
              }
            });
          }
        );
        req1.on('error', () => {});

        const req2 = http.get(
          `${baseUrl}/api/v1/queue/stream?tokenId=${tokenId2}`,
          (res) => {
            let buf = '';
            res.on('data', (chunk) => {
              buf += chunk.toString();
              if (buf.includes('event: connected') && !established2) {
                established2 = true;
                maybeCallNext();
              }
              if (buf.includes('CUSTOMER_CALLED')) {
                received2.called = true;
                maybeResolve(req1, req2);
              }
            });
          }
        );
        req2.on('error', () => {});
      });

      assert.ok(received1.called, 'Customer 1 SSE subscriber should have received CUSTOMER_CALLED');
      assert.ok(received2.called, 'Customer 2 SSE subscriber should have received CUSTOMER_CALLED');
    });

  } finally {
    server.close();
  }
});
