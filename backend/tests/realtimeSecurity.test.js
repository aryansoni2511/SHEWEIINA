import test from 'node:test';
import assert from 'node:assert';
import http from 'http';
import app from '../app.js';
import ticketService from '../services/ticketService.js';
import realtimeService from '../services/realtimeService.js';
import { processRequestOpdToken, processCallNextPatient } from '../services/hospitalService.js';
import { processRequestToken as processRequestGovtToken, processCallNext as processCallNextGovt } from '../services/governmentService.js';

test('Phase 4.2.1 Realtime SSE Security Hardening Test Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const ts = Date.now();
  const pass = 'Password123!';

  let salonBizToken = '';
  let salonBizId = '';
  let salonQueueId = '';
  let salonServiceId = '';

  let customerAToken = '';
  let customerAId = '';
  const customerAPhone = '9911001100';

  let customerBToken = '';
  let customerBId = '';
  const customerBPhone = '9922002200';

  let customerATokenId = '';
  let customerBTokenId = '';

  try {
    // 1. Setup Salon Business
    const bizRes = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Salon Owner',
        email: `salon_${ts}@example.com`,
        phone: '9900112233',
        password: pass,
        businessName: 'Royal Salon',
        category: 'salon',
        city: 'Delhi',
      }),
    });
    const bizData = await bizRes.json();
    assert.strictEqual(bizRes.status, 201);
    salonBizToken = bizData.data.token;
    salonBizId = bizData.data.business.id;
    salonQueueId = bizData.data.queue.id;

    const svcRes = await fetch(`${baseUrl}/api/v1/business/services?businessId=${salonBizId}`);
    const svcData = await svcRes.json();
    salonServiceId = svcData.data.services[0].id;

    // 2. Register Customer A
    const cusARes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Customer A',
        email: `cus_a_${ts}@example.com`,
        phone: customerAPhone,
        password: pass,
      }),
    });
    const cusAData = await cusARes.json();
    assert.strictEqual(cusARes.status, 201);
    customerAToken = cusAData.data.token;
    customerAId = cusAData.data.user.id;

    // 3. Register Customer B
    const cusBRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Customer B',
        email: `cus_b_${ts}@example.com`,
        phone: customerBPhone,
        password: pass,
      }),
    });
    const cusBData = await cusBRes.json();
    assert.strictEqual(cusBRes.status, 201);
    customerBToken = cusBData.data.token;
    customerBId = cusBData.data.user.id;

    // 4. Customer A joins Salon queue
    const joinARes = await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerAToken}`,
      },
      body: JSON.stringify({
        businessId: salonBizId,
        queueId: salonQueueId,
        serviceId: salonServiceId,
        customerName: 'Customer A',
        customerPhone: customerAPhone,
      }),
    });
    const joinAData = await joinARes.json();
    assert.strictEqual(joinARes.status, 201);
    customerATokenId = joinAData.data.tokenId;

    // 5. Customer B joins Salon queue
    const joinBRes = await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerBToken}`,
      },
      body: JSON.stringify({
        businessId: salonBizId,
        queueId: salonQueueId,
        serviceId: salonServiceId,
        customerName: 'Customer B',
        customerPhone: customerBPhone,
      }),
    });
    const joinBData = await joinBRes.json();
    assert.strictEqual(joinBRes.status, 201);
    customerBTokenId = joinBData.data.tokenId;

    // ----------------------------------------------------------------------------------
    // Test 1: Unauthenticated customer cannot subscribe (returns 401)
    // ----------------------------------------------------------------------------------
    await t.test('Test 1: Unauthenticated customer connection to /queue/stream returns 401', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/stream?tokenId=${customerATokenId}`);
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('Authentication required') || data.message.includes('Unauthorized'));
    });

    // ----------------------------------------------------------------------------------
    // Test 2: Customer A cannot subscribe to Customer B's token (returns 403)
    // ----------------------------------------------------------------------------------
    await t.test('Test 2: Customer A cannot subscribe to Customer B token (via stream-ticket and direct SSE)', async () => {
      // Via POST /stream-ticket
      const ticketRes = await fetch(`${baseUrl}/api/v1/queue/stream-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerAToken}`,
        },
        body: JSON.stringify({ tokenId: customerBTokenId }),
      });
      assert.strictEqual(ticketRes.status, 403);
      const ticketData = await ticketRes.json();
      assert.strictEqual(ticketData.success, false);
      assert.ok(ticketData.message.includes('Forbidden') || ticketData.message.includes('not own'));

      // Via direct Bearer on GET /queue/stream
      const directRes = await fetch(`${baseUrl}/api/v1/queue/stream?tokenId=${customerBTokenId}`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      assert.strictEqual(directRes.status, 403);
      const directData = await directRes.json();
      assert.strictEqual(directData.success, false);
      assert.ok(directData.message.includes('Forbidden') || directData.message.includes('not own'));
    });

    // ----------------------------------------------------------------------------------
    // Test 3: Customer cannot subscribe to another business stream (returns 403)
    // ----------------------------------------------------------------------------------
    await t.test('Test 3: Customer cannot subscribe to business stream (returns 403)', async () => {
      const ticketRes = await fetch(`${baseUrl}/api/v1/queue/stream-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerAToken}`,
        },
        body: JSON.stringify({ businessId: salonBizId }),
      });
      assert.strictEqual(ticketRes.status, 403);

      const directRes = await fetch(`${baseUrl}/api/v1/queue/stream?businessId=${salonBizId}`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      assert.strictEqual(directRes.status, 403);
    });

    // ----------------------------------------------------------------------------------
    // Test 4: Business operator cannot subscribe to an unauthorized business (returns 403)
    // ----------------------------------------------------------------------------------
    await t.test('Test 4: Business operator cannot subscribe to unauthorized business stream', async () => {
      // Register second business
      const otherBizRes = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Other Operator',
          email: `other_op_${ts}@example.com`,
          phone: '9900998877',
          password: pass,
          businessName: 'Other Clinic',
          category: 'clinic',
          city: 'Delhi',
        }),
      });
      const otherBizData = await otherBizRes.json();
      const otherBizToken = otherBizData.data.token;

      // Operator of second biz tries to subscribe to salonBizId
      const ticketRes = await fetch(`${baseUrl}/api/v1/queue/stream-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${otherBizToken}`,
        },
        body: JSON.stringify({ businessId: salonBizId }),
      });
      assert.strictEqual(ticketRes.status, 403);

      const directRes = await fetch(`${baseUrl}/api/v1/queue/stream?businessId=${salonBizId}`, {
        headers: { Authorization: `Bearer ${otherBizToken}` },
      });
      assert.strictEqual(directRes.status, 403);
    });

    // ----------------------------------------------------------------------------------
    // Test 5: Authorized customer can subscribe to their own token (returns 200 with ticket and Bearer header)
    // ----------------------------------------------------------------------------------
    await t.test('Test 5: Authorized customer can subscribe to own token (ticket & Bearer header)', async () => {
      // 5a. Via ticket
      const ticketRes = await fetch(`${baseUrl}/api/v1/queue/stream-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerAToken}`,
        },
        body: JSON.stringify({ tokenId: customerATokenId }),
      });
      assert.strictEqual(ticketRes.status, 200);
      const ticketData = await ticketRes.json();
      const ticket = ticketData.data.ticket;
      assert.ok(ticket && ticket.startsWith('sst_'));

      await new Promise((resolve, reject) => {
        const req = http.get(`${baseUrl}/api/v1/queue/stream?ticket=${ticket}`, (res) => {
          assert.strictEqual(res.statusCode, 200);
          assert.strictEqual(res.headers['content-type'], 'text/event-stream');
          let buf = '';
          res.on('data', (chunk) => {
            buf += chunk.toString();
            if (buf.includes('event: connected')) {
              req.destroy();
              resolve();
            }
          });
          res.on('error', reject);
        });
        req.on('error', reject);
      });

      // 5b. Via direct Bearer header
      await new Promise((resolve, reject) => {
        const req = http.get(
          `${baseUrl}/api/v1/queue/stream?tokenId=${customerATokenId}`,
          { headers: { Authorization: `Bearer ${customerAToken}` } },
          (res) => {
            assert.strictEqual(res.statusCode, 200);
            assert.strictEqual(res.headers['content-type'], 'text/event-stream');
            let buf = '';
            res.on('data', (chunk) => {
              buf += chunk.toString();
              if (buf.includes('event: connected')) {
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

    // ----------------------------------------------------------------------------------
    // Test 6: Hospital events cannot reach Salon/Clinic subscribers (module isolation)
    // ----------------------------------------------------------------------------------
    await t.test('Test 6: Hospital events cannot reach Salon subscribers', async () => {
      // Customer A (Salon) connects to SSE
      const ticketRes = await fetch(`${baseUrl}/api/v1/queue/stream-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerAToken}`,
        },
        body: JSON.stringify({ tokenId: customerATokenId }),
      });
      const { ticket } = (await ticketRes.json()).data;

      let receivedEvent = null;

      await new Promise((resolve) => {
        const req = http.get(`${baseUrl}/api/v1/queue/stream?ticket=${ticket}`, (res) => {
          res.on('data', (chunk) => {
            const str = chunk.toString();
            if (str.includes('HOSPITAL_PATIENT_CALLED') || str.includes('HOSPITAL_PATIENT_JOINED')) {
              receivedEvent = str;
            }
          });
        });

        setTimeout(() => {
          // Trigger hospital broadcast directly
          realtimeService.broadcastQueueEvent({
            businessId: 'hosp-test-123',
            queueId: 'hosp-q-123',
            tokenId: 'hosp-tok-999',
            type: 'HOSPITAL_PATIENT_CALLED',
            module: 'hospital',
            data: {
              tokenNumber: 'OPD-101',
              status: 'CALLED',
            },
          });

          // Wait 150ms to ensure client did NOT receive hospital event
          setTimeout(() => {
            req.destroy();
            resolve();
          }, 150);
        }, 100);
      });

      assert.strictEqual(receivedEvent, null, 'Salon subscriber must not receive hospital events');
    });

    // ----------------------------------------------------------------------------------
    // Test 7: Government events cannot reach Hospital subscribers (module isolation)
    // ----------------------------------------------------------------------------------
    await t.test('Test 7: Government events cannot reach Hospital subscribers', async () => {
      // Connect mock hospital client directly to realtimeService
      const receivedChunks = [];
      const mockRes = {
        writeHead: () => {},
        flushHeaders: () => {},
        write: (chunk) => {
          receivedChunks.push(chunk);
        },
      };

      const hospClientId = realtimeService.registerClient({
        res: mockRes,
        businessId: 'hosp-100',
        tokenId: 'hosp-tok-100',
        queueId: 'hosp-q-100',
        module: 'hospital',
      });

      // Broadcast government event
      realtimeService.broadcastQueueEvent({
        businessId: 'gov-centre-200',
        queueId: 'counter-3',
        tokenId: 'gov-tok-200',
        type: 'GOVERNMENT_CITIZEN_CALLED',
        module: 'government',
        data: {
          tokenNumber: 'GOV-501',
          counterNumber: 'Counter 3',
          status: 'CALLED',
        },
      });

      // Clean up
      realtimeService.removeClient(hospClientId);

      const receivedGovtEvent = receivedChunks.some(c => c.includes('GOVERNMENT_CITIZEN_CALLED'));
      assert.strictEqual(receivedGovtEvent, false, 'Hospital subscriber must not receive government events');
    });

    // ----------------------------------------------------------------------------------
    // Test 8: No patient/citizen PII in broadcasts
    // ----------------------------------------------------------------------------------
    await t.test('Test 8: Hospital and Government broadcast payloads contain zero PII', async () => {
      const capturedBroadcasts = [];
      const originalBroadcast = realtimeService.broadcastQueueEvent;

      realtimeService.broadcastQueueEvent = (options) => {
        capturedBroadcasts.push(options);
        return originalBroadcast.call(realtimeService, options);
      };

      try {
        // Create hospital OPD token
        await processRequestOpdToken({
          hospitalId: 'hosp-101',
          doctorId: 'doc-101',
          patientName: 'Confidential Patient',
          patientPhone: '9988776655',
          patientAge: 45,
          patientGender: 'Female',
        });

        // Request government token
        await processRequestGovtToken({
          centreId: 'gcentre-101',
          serviceId: 'gserv-101',
          citizenName: 'Confidential Citizen',
          citizenPhone: '9911223344',
        });

        // Check captured broadcasts
        assert.ok(capturedBroadcasts.length >= 2, 'Expected broadcast events to be emitted');

        for (const item of capturedBroadcasts) {
          const payloadStr = JSON.stringify(item);
          assert.ok(!payloadStr.includes('Confidential Patient'), 'PII Leak: Patient name found in broadcast!');
          assert.ok(!payloadStr.includes('9988776655'), 'PII Leak: Patient phone found in broadcast!');
          assert.ok(!payloadStr.includes('Confidential Citizen'), 'PII Leak: Citizen name found in broadcast!');
          assert.ok(!payloadStr.includes('9911223344'), 'PII Leak: Citizen phone found in broadcast!');
        }
      } finally {
        realtimeService.broadcastQueueEvent = originalBroadcast;
      }
    });

    // ----------------------------------------------------------------------------------
    // Test 9: Invalid and expired stream tickets are rejected (returns 401)
    // ----------------------------------------------------------------------------------
    await t.test('Test 9: Invalid and expired stream tickets return 401', async () => {
      // 9a. Non-existent ticket
      const resBad = await fetch(`${baseUrl}/api/v1/queue/stream?ticket=sst_nonexistent123`);
      assert.strictEqual(resBad.status, 401);
      const dataBad = await resBad.json();
      assert.ok(dataBad.message.includes('Invalid or expired'));

      // 9b. Artificially expired ticket
      const ticket = ticketService.createTicket({
        userId: customerAId,
        role: 'CUSTOMER',
        tokenId: customerATokenId,
        businessId: salonBizId,
        queueId: salonQueueId,
        module: 'salon',
      });
      // Force ticket to have expired
      ticket.expiresAt = Date.now() - 1000;

      const resExp = await fetch(`${baseUrl}/api/v1/queue/stream?ticket=${ticket.id}`);
      assert.strictEqual(resExp.status, 401);
      const dataExp = await resExp.json();
      assert.ok(dataExp.message.includes('Invalid or expired'));
    });

    // ----------------------------------------------------------------------------------
    // Test 10: Single-use ticket reuse is rejected (returns 401)
    // ----------------------------------------------------------------------------------
    await t.test('Test 10: Single-use ticket cannot be reused (second attempt returns 401)', async () => {
      // Obtain ticket
      const ticketRes = await fetch(`${baseUrl}/api/v1/queue/stream-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerAToken}`,
        },
        body: JSON.stringify({ tokenId: customerATokenId }),
      });
      const { ticket } = (await ticketRes.json()).data;

      // First use: connects successfully
      await new Promise((resolve, reject) => {
        const req = http.get(`${baseUrl}/api/v1/queue/stream?ticket=${ticket}`, (res) => {
          assert.strictEqual(res.statusCode, 200);
          req.destroy();
          resolve();
        });
        req.on('error', reject);
      });

      // Second use: must be rejected with 401
      const reuseRes = await fetch(`${baseUrl}/api/v1/queue/stream?ticket=${ticket}`);
      assert.strictEqual(reuseRes.status, 401);
      const reuseData = await reuseRes.json();
      assert.strictEqual(reuseData.success, false);
      assert.ok(reuseData.message.includes('Invalid or expired'));
    });

  } finally {
    server.close();
  }
});
