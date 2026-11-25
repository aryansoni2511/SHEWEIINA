import test from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { EventEmitter } from 'events';
import app from '../app.js';
import { subscribeQueueRealtime } from '../../frontend/services/realtime.js';

test('Phase 4.2.1.2 Realtime SSE Reconnection & Reliability Test Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const ts = Date.now();
  const pass = 'Password123!';

  let bizToken = '';
  let bizId = '';
  let queueId = '';
  let serviceId = '';

  let cusToken = '';
  let cusId = '';
  let tokenId = '';

  try {
    // 1. Setup Business
    const bizRes = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Reconnection Salon Owner',
        email: `recon_biz_${ts}@example.com`,
        phone: '9912345678',
        password: pass,
        businessName: 'Reconnection Salon',
        category: 'salon',
        city: 'Delhi',
      }),
    });
    const bizData = await bizRes.json();
    assert.strictEqual(bizRes.status, 201);
    bizToken = bizData.data.token;
    bizId = bizData.data.business.id;
    queueId = bizData.data.queue.id;

    const svcRes = await fetch(`${baseUrl}/api/v1/business/services?businessId=${bizId}`);
    const svcData = await svcRes.json();
    serviceId = svcData.data.services[0].id;

    // 2. Register Customer
    const cusRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Reconnection Customer',
        email: `recon_cus_${ts}@example.com`,
        phone: '9923456789',
        password: pass,
      }),
    });
    const cusData = await cusRes.json();
    assert.strictEqual(cusRes.status, 201);
    cusToken = cusData.data.token;
    cusId = cusData.data.user.id;

    // 3. Customer Joins Queue
    const joinRes = await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cusToken}`,
      },
      body: JSON.stringify({
        businessId: bizId,
        queueId,
        serviceId,
        customerName: 'Reconnection Customer',
        customerPhone: '9923456789',
      }),
    });
    const joinData = await joinRes.json();
    assert.strictEqual(joinRes.status, 201);
    tokenId = joinData.data.tokenId;

    // Helper: Mock EventSource implementation for Node.js test environment
    class MockEventSource extends EventEmitter {
      constructor(url) {
        super();
        this.url = url;
        this.closed = false;
        MockEventSource.instances.push(this);

        if (MockEventSource.failAll) {
          process.nextTick(() => {
            if (typeof this.onerror === 'function') {
              this.onerror(new Error('Simulated network outage'));
            }
          });
          return;
        }

        // Make real HTTP GET request to backend SSE endpoint
        this.req = http.get(url, (res) => {
          this.statusCode = res.statusCode;
          if (res.statusCode === 200) {
            if (typeof this.onopen === 'function') this.onopen();
            let buf = '';
            res.on('data', (chunk) => {
              buf += chunk.toString();
              const lines = buf.split('\n\n');
              buf = lines.pop(); // keep last incomplete chunk
              for (const block of lines) {
                let eventName = 'message';
                let dataStr = '';
                for (const line of block.split('\n')) {
                  if (line.startsWith('event: ')) {
                    eventName = line.slice(7).trim();
                  } else if (line.startsWith('data: ')) {
                    dataStr = line.slice(6);
                  }
                }
                if (dataStr) {
                  this.emit(eventName, { data: dataStr });
                }
              }
            });
          } else {
            // Non-200 (e.g. 401 Unauthorized): trigger error
            if (typeof this.onerror === 'function') {
              this.onerror(new Error(`HTTP ${res.statusCode}`));
            }
          }
        });

        this.req.on('error', (err) => {
          if (!this.closed && typeof this.onerror === 'function') {
            this.onerror(err);
          }
        });
      }

      close() {
        this.closed = true;
        if (this.req) {
          this.req.destroy();
        }
      }

      addEventListener(event, listener) {
        this.on(event, listener);
      }

      removeEventListener(event, listener) {
        this.off(event, listener);
      }
    }

    MockEventSource.instances = [];

    // Polyfill global EventSource for tests
    globalThis.EventSource = MockEventSource;

    // ----------------------------------------------------------------------------------
    // Test 1: Fresh ticket requested after unexpected disconnect, and old ticket is never reused
    // ----------------------------------------------------------------------------------
    await t.test('Test 1: Fresh ticket is requested on disconnect; old ticket is never reused', async () => {
      MockEventSource.instances = [];
      const usedTickets = [];
      let disconnectTriggered = false;
      let reconnected = false;

      const unsubscribe = subscribeQueueRealtime({
        tokenId,
        _token: cusToken,
        _apiBaseUrl: baseUrl,
        _backoffDelays: [30, 60, 100],
        onUpdate: () => {},
      });

      // Wait for initial EventSource instance to be created
      await new Promise((resolve) => setTimeout(resolve, 50));
      assert.strictEqual(MockEventSource.instances.length, 1);
      const firstES = MockEventSource.instances[0];

      // Extract ticket from URL
      const ticket1Match = firstES.url.match(/ticket=([^&]+)/);
      assert.ok(ticket1Match);
      const ticket1 = decodeURIComponent(ticket1Match[1]);
      usedTickets.push(ticket1);

      // Now simulate unexpected disconnect by destroying the active HTTP connection
      firstES.req.destroy(new Error('Simulated network drop'));

      // Wait for reconnect delay (30ms backoff) + HTTP handshake
      await new Promise((resolve) => setTimeout(resolve, 150));

      assert.strictEqual(MockEventSource.instances.length, 2, 'Should create exactly a second EventSource instance');
      const secondES = MockEventSource.instances[1];

      const ticket2Match = secondES.url.match(/ticket=([^&]+)/);
      assert.ok(ticket2Match);
      const ticket2 = decodeURIComponent(ticket2Match[1]);
      usedTickets.push(ticket2);

      // Verify that the second ticket is a DIFFERENT, fresh ticket
      assert.notStrictEqual(ticket1, ticket2, 'Reconnection must use a brand new ticket');
      assert.strictEqual(secondES.statusCode, 200, 'Reconnection with fresh ticket must succeed with 200');

      // Verify that attempting to reuse the old ticket1 directly on the server returns 401
      const reuseRes = await fetch(`${baseUrl}/api/v1/queue/stream?ticket=${ticket1}`);
      assert.strictEqual(reuseRes.status, 401, 'Old ticket must be invalid/consumed and return 401');

      unsubscribe();
    });

    // ----------------------------------------------------------------------------------
    // Test 2: Bounded exponential backoff delays and maximum retry limit (stops at 3)
    // ----------------------------------------------------------------------------------
    await t.test('Test 2: Reconnection obeys backoff delays and halts after max 3 retries', async () => {
      MockEventSource.instances = [];
      MockEventSource.failAll = true; // Simulate persistent network outage
      let maxRetriesExceeded = false;

      const unsubscribe = subscribeQueueRealtime({
        tokenId,
        _token: cusToken,
        _apiBaseUrl: baseUrl,
        _backoffDelays: [30, 60, 100], // 30ms, 60ms, 100ms
        _maxRetries: 3,
        onError: (err) => {
          if (err?.message?.includes('Max reconnection attempts')) {
            maxRetriesExceeded = true;
          }
        },
      });

      // Wait for 30ms + 60ms + 100ms + margin = ~350ms (allow extra time for async ticket calls in CI/Windows)
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Initial instance (1) + 3 retries = 4 instances total
      assert.strictEqual(MockEventSource.instances.length, 4, 'Must not exceed 1 initial + 3 retries');
      assert.strictEqual(maxRetriesExceeded, true, 'onError should notify when max retries exceeded');

      MockEventSource.failAll = false;
      unsubscribe();
    });

    // ----------------------------------------------------------------------------------
    // Test 3: Successful reconnection resets retry count
    // ----------------------------------------------------------------------------------
    await t.test('Test 3: Successful connection resets retry count', async () => {
      MockEventSource.instances = [];

      const unsubscribe = subscribeQueueRealtime({
        tokenId,
        _token: cusToken,
        _apiBaseUrl: baseUrl,
        _backoffDelays: [40, 80, 160],
        _maxRetries: 3,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
      assert.strictEqual(MockEventSource.instances.length, 1);

      // Simulate 1 drop
      MockEventSource.instances[0].req.destroy(new Error('First glitch'));
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Second instance successfully connects (status 200)
      assert.strictEqual(MockEventSource.instances.length, 2);
      assert.strictEqual(MockEventSource.instances[1].statusCode, 200);

      // Simulate second drop after successful connection
      MockEventSource.instances[1].req.destroy(new Error('Second glitch'));
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Third instance connects
      assert.strictEqual(MockEventSource.instances.length, 3);
      assert.strictEqual(MockEventSource.instances[2].statusCode, 200);

      unsubscribe();
    });

    // ----------------------------------------------------------------------------------
    // Test 4: Manual unsubscribe cancels pending reconnect timer and halts connections
    // ----------------------------------------------------------------------------------
    await t.test('Test 4: Manual unsubscribe prevents further reconnection attempts', async () => {
      MockEventSource.instances = [];

      const unsubscribe = subscribeQueueRealtime({
        tokenId,
        _token: cusToken,
        _apiBaseUrl: baseUrl,
        _backoffDelays: [200, 400, 800], // 200ms delay
      });

      await new Promise((resolve) => setTimeout(resolve, 40));
      assert.strictEqual(MockEventSource.instances.length, 1);
      const firstES = MockEventSource.instances[0];

      // Break connection to trigger scheduleReconnect
      firstES.req.destroy(new Error('Simulated drop'));

      // Call unsubscribe IMMEDIATELY before backoff timer (200ms) fires
      unsubscribe();

      // Wait 300ms to verify no new EventSource instance was created
      await new Promise((resolve) => setTimeout(resolve, 300));
      assert.strictEqual(MockEventSource.instances.length, 1, 'No new instance should be created after unsubscribe');
    });

    // ----------------------------------------------------------------------------------
    // Test 5: Reconnection does NOT occur on terminal token states
    // ----------------------------------------------------------------------------------
    await t.test('Test 5: Reconnection does NOT trigger after token reaches terminal state', async () => {
      MockEventSource.instances = [];

      const unsubscribe = subscribeQueueRealtime({
        tokenId,
        _token: cusToken,
        _apiBaseUrl: baseUrl,
        _backoffDelays: [30, 60, 100],
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
      assert.strictEqual(MockEventSource.instances.length, 1);
      const activeES = MockEventSource.instances[0];

      // Emit terminal event 'SERVED' through mock
      activeES.emit('queue_update', {
        data: JSON.stringify({
          type: 'SERVICE_COMPLETED',
          status: 'SERVED',
          tokenId,
        }),
      });

      // Now break the connection
      activeES.req.destroy(new Error('Connection closed after service completed'));

      // Wait 120ms
      await new Promise((resolve) => setTimeout(resolve, 120));
      assert.strictEqual(MockEventSource.instances.length, 1, 'Must NOT reconnect after terminal state');

      unsubscribe();
    });

    // ----------------------------------------------------------------------------------
    // Test 6: Ticket endpoint 401/403 terminates without infinite retry loop
    // ----------------------------------------------------------------------------------
    await t.test('Test 6: Ticket endpoint 401/403 stops reconnection immediately without retrying', async () => {
      MockEventSource.instances = [];
      let errorReported = null;

      // Pass an invalid / unauthorized token
      const unsubscribe = subscribeQueueRealtime({
        tokenId,
        _token: 'invalid_expired_jwt_token',
        _apiBaseUrl: baseUrl,
        _backoffDelays: [30, 60, 100],
        onError: (err) => {
          errorReported = err;
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should never have created any EventSource instance
      assert.strictEqual(MockEventSource.instances.length, 0);
      assert.ok(errorReported, 'Should report authorization error');
      assert.ok(errorReported.status === 401 || errorReported.message.includes('401'));

      unsubscribe();
    });

    // Clean up polyfill
    delete globalThis.EventSource;

  } finally {
    server.close();
  }
});
