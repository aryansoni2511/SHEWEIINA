import { test } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../app.js';

import { mockHospitalStore } from '../models/hospitalModel.js';
import { mockGovtStore } from '../models/governmentModel.js';
import { createNotification } from '../models/notificationModel.js';

test('SHEWWINA Phase 3: Customer Queue Experience & Digital Token Pass Integration Suite', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const ts = Date.now();
  let businessId;
  let queueId;
  let serviceId;
  let customerAToken;
  let customerAId;
  const customerAPhone = '9820011222';
  let customerBToken;
  const customerBPhone = '9820033444';

  t.after(() => {
    server.close();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Setup: Register Business & Customers
  // ─────────────────────────────────────────────────────────────────────────

  await t.test('0. Setup: Register Test Business and Customers', async () => {
    // 1. Register business
    const bizRes = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Clinic Director',
        email: `director_${ts}@example.com`,
        phone: '9820099888',
        password: 'Password123!',
        businessName: 'Apex Health & Wellness Clinic',
        category: 'clinic',
        city: 'Mumbai',
      }),
    });
    assert.strictEqual(bizRes.status, 201);
    const bizData = await bizRes.json();
    businessId = bizData.data.business.id;
    queueId = bizData.data.queue.id;

    // Fetch service
    const svcRes = await fetch(`${baseUrl}/api/v1/business/services?businessId=${businessId}`);
    assert.strictEqual(svcRes.status, 200);
    const svcData = await svcRes.json();
    assert.ok(svcData.data.services.length > 0);
    serviceId = svcData.data.services[0].id;

    // 2. Register Customer A
    const regARes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ananya Sharma',
        email: `ananya_${ts}@example.com`,
        phone: customerAPhone,
        password: 'Password123!',
      }),
    });
    assert.strictEqual(regARes.status, 201);
    const regAData = await regARes.json();
    customerAToken = regAData.data.token;
    customerAId = regAData.data.user.id;

    // 3. Register Customer B
    const regBRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rohan Mehra',
        email: `rohan_${ts}@example.com`,
        phone: customerBPhone,
        password: 'Password123!',
      }),
    });
    assert.strictEqual(regBRes.status, 201);
    const regBData = await regBRes.json();
    customerBToken = regBData.data.token;
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Part 1: Core Queue Join Flow & Validation
  // ─────────────────────────────────────────────────────────────────────────

  let testTokenId;
  let testTokenNumber;

  await t.test('1. Customer joins active queue via POST /api/v1/queue/join with valid Indian mobile', async () => {
    const res = await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerAToken}`,
      },
      body: JSON.stringify({
        businessId,
        queueId,
        serviceId,
        customerName: 'Ananya Sharma',
        customerPhone: customerAPhone,
      }),
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.tokenId);
    assert.ok(body.data.tokenNumber);
    assert.strictEqual(body.data.status, 'WAITING');

    testTokenId = body.data.tokenId;
    testTokenNumber = body.data.tokenNumber;
  });

  await t.test('2. Customer join rejects invalid mobile format (non-10-digit)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId,
        queueId,
        serviceId,
        customerName: 'Ananya Sharma',
        customerPhone: '12345',
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /10-digit/i);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Part 2: Public Digital Token Pass Status
  // ─────────────────────────────────────────────────────────────────────────

  await t.test('3. GET /api/v1/queue/status/:tokenId returns enriched pass metadata with provider context', async () => {
    const res = await fetch(`${baseUrl}/api/v1/queue/status/${testTokenId}`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.tokenId, testTokenId);
    assert.strictEqual(body.data.tokenNumber, testTokenNumber);
    assert.strictEqual(body.data.status, 'WAITING');
    assert.ok(typeof body.data.peopleAhead === 'number');
    assert.ok(typeof body.data.estimatedWaitMinutes === 'number');
    assert.strictEqual(body.data.customerName, 'Ananya Sharma');
    assert.strictEqual(body.data.businessName, 'Apex Health & Wellness Clinic');
    assert.strictEqual(body.data.businessCategory, 'clinic');
  });

  await t.test('4. GET /api/v1/queue/status/:tokenId returns 404 for invalid/expired token ID', async () => {
    const res = await fetch(`${baseUrl}/api/v1/queue/status/completely-invalid-uuid-token`);
    assert.strictEqual(res.status, 404);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Part 3: Hospital OPD Consultation Pass
  // ─────────────────────────────────────────────────────────────────────────

  await t.test('5. GET /api/v1/hospital/token/:tokenId returns full clinical consultation metadata', async () => {
    const seededHospitalToken = {
      id: 'htok-phase3-test',
      queue_id: 'q-doc-101',
      hospital_id: 'hosp-101',
      doctor_id: 'doc-101',
      department_id: 'dept-101',
      patient_id: 'pat-101',
      patient_code: 'P-9801',
      patient_name: 'Priya Verma',
      patient_phone: '9820011999',
      token_number: 'OPD-101',
      sequence_number: 1,
      status: 'WAITING',
      position: 1,
      estimated_wait_minutes: 10,
      called_at: null,
      served_at: null,
      created_at: new Date().toISOString(),
    };
    mockHospitalStore.tokens.push(seededHospitalToken);

    const res = await fetch(`${baseUrl}/api/v1/hospital/token/htok-phase3-test`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    const tok = body.data.token;
    assert.strictEqual(tok.token_number, 'OPD-101');
    assert.strictEqual(tok.patient_name, 'Priya Verma');
    assert.ok(tok.doctor_name, 'Should resolve attending doctor');
    assert.ok(tok.department_name, 'Should resolve clinical department');
    assert.ok(tok.hospital_name, 'Should resolve hospital name');
    assert.strictEqual(tok.status, 'WAITING');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Part 4: Government Kendra Facilitation Pass
  // ─────────────────────────────────────────────────────────────────────────

  await t.test('6. GET /api/v1/government/token/:tokenId returns Kendra desk and fee breakdown', async () => {
    const seededCitizenToken = {
      id: 'gtok-phase3-test',
      centre_id: 'gcentre-101',
      counter_id: 'gcnt-101',
      service_id: 'gsvc-101',
      token_number: 'A-101',
      citizen_name: 'Vikram Joshi',
      citizen_phone: '9820022888',
      status: 'WAITING',
      sequence_number: 1,
      people_ahead: 0,
      estimated_wait_minutes: 15,
      created_at: new Date().toISOString(),
    };
    mockGovtStore.tokens.push(seededCitizenToken);

    const res = await fetch(`${baseUrl}/api/v1/government/token/gtok-phase3-test`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    const tok = body.data.token;
    assert.strictEqual(tok.token_number, 'A-101');
    assert.strictEqual(tok.citizen_name, 'Vikram Joshi');
    assert.strictEqual(tok.counter_number, 'Counter 1');
    assert.strictEqual(tok.status, 'WAITING');
    assert.ok(typeof tok.official_fee === 'number');
    assert.ok(typeof tok.facilitation_fee === 'number');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Part 5: Customer Dashboard & Active Token
  // ─────────────────────────────────────────────────────────────────────────

  await t.test('7. GET /api/v1/customer/active-token returns active pass for authenticated customer', async () => {
    const res = await fetch(`${baseUrl}/api/v1/customer/active-token`, {
      headers: { Authorization: `Bearer ${customerAToken}` },
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data, 'Customer must have active token');
    assert.strictEqual(body.data.tokenId, testTokenId);
    assert.strictEqual(body.data.status, 'WAITING');
    assert.strictEqual(body.data.businessName, 'Apex Health & Wellness Clinic');
    assert.strictEqual(body.data.businessCategory, 'clinic');
  });

  await t.test('8. GET /api/v1/customer/tokens returns complete token history', async () => {
    const res = await fetch(`${baseUrl}/api/v1/customer/tokens`, {
      headers: { Authorization: `Bearer ${customerAToken}` },
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);
    assert.strictEqual(body.data[0].tokenId, testTokenId);
  });

  await t.test('9. In-app notifications contract: create, list, mark read, mark all read', async () => {
    const seededNotif = await createNotification({
      userId: customerAId,
      type: 'YOUR_TURN_APPROACHING',
      title: 'Your Turn is Approaching',
      message: 'Token S-101 is next in sequence. Please make your way to the waiting area.',
    });

    // 1. Get notifications
    const getRes = await fetch(`${baseUrl}/api/v1/customer/notifications`, {
      headers: { Authorization: `Bearer ${customerAToken}` },
    });
    assert.strictEqual(getRes.status, 200);
    const notifs = (await getRes.json()).data.notifications;
    assert.ok(notifs.some((n) => n.id === seededNotif.id));

    // 2. Mark specific notification as read
    const readRes = await fetch(`${baseUrl}/api/v1/customer/notifications/${seededNotif.id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customerAToken}` },
    });
    assert.strictEqual(readRes.status, 200);

    // 3. Mark all as read via PATCH /api/v1/customer/notifications/read-all
    const markAllRes = await fetch(`${baseUrl}/api/v1/customer/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${customerAToken}` },
    });
    assert.strictEqual(markAllRes.status, 200);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Part 6: Token Cancellation Security & Ownership
  // ─────────────────────────────────────────────────────────────────────────

  await t.test('10. Token Ownership Protection: Customer B cannot cancel Customer A token (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/queue/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerBToken}`,
      },
      body: JSON.stringify({ tokenId: testTokenId }),
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /only cancel your own token/i);
  });

  await t.test('11. Customer A successfully cancels their own active token via POST /api/v1/queue/cancel', async () => {
    const res = await fetch(`${baseUrl}/api/v1/queue/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerAToken}`,
      },
      body: JSON.stringify({ tokenId: testTokenId }),
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'CANCELLED');

    // Confirm status via public endpoint
    const statusRes = await fetch(`${baseUrl}/api/v1/queue/status/${testTokenId}`);
    const statusBody = await statusRes.json();
    assert.strictEqual(statusBody.data.status, 'CANCELLED');
    assert.strictEqual(statusBody.data.peopleAhead, 0);
  });

  await t.test('12. Unauthorized cancellation: Unauthenticated request rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/api/v1/queue/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId: testTokenId }),
    });

    assert.strictEqual(res.status, 401);
  });
});
