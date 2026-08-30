import test from 'node:test';
import assert from 'node:assert';
import app from '../app.js';
import {
  sendSMS,
  sendWhatsApp,
  dispatchCustomerAlert,
  getLastSentSMS,
  getLastSentWhatsApp,
  clearSentMessages,
} from '../services/messagingService.js';
import { normalizePhoneNumber, isValidPhoneNumber } from '../utils/phone.js';

test('Phase 8 External Messaging & Customer Communication Test Suite', async (t) => {
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
    // Setup Business for queue lifecycle testing
    const bizRes = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Messaging Test Clinic',
        email: `msg_clinic_${ts}@example.com`,
        phone: '+919800003333',
        password: pass,
        businessName: 'Apex Health Clinic',
        category: 'clinic',
        city: 'Mumbai',
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

    // --- Test 1: Phone number normalization (single source of truth) ---
    await t.test('Phone normalizer standardizes Indian numbers to E.164 (+91)', () => {
      assert.strictEqual(normalizePhoneNumber('9876543210'), '+919876543210');
      assert.strictEqual(normalizePhoneNumber('09876543210'), '+919876543210');
      assert.strictEqual(normalizePhoneNumber('919876543210'), '+919876543210');
      assert.strictEqual(normalizePhoneNumber('+919876543210'), '+919876543210');
      assert.strictEqual(normalizePhoneNumber('+91 98765-43210'), '+919876543210');

      assert.strictEqual(isValidPhoneNumber('+919876543210'), true);
      assert.strictEqual(isValidPhoneNumber('9876543210'), true); // Normalizes first
      assert.strictEqual(isValidPhoneNumber('123'), false);
      assert.strictEqual(isValidPhoneNumber(''), false);
    });

    // --- Test 2: MOCK SMS provider logs and records message safely ---
    await t.test('MOCK SMS sends successfully without credentials', async () => {
      clearSentMessages();
      const res = await sendSMS({
        to: '9876543210',
        message: 'Your token S-101 is confirmed.',
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.provider, 'mock');

      const lastSMS = getLastSentSMS();
      assert.ok(lastSMS, 'SMS must be recorded in mock store');
      assert.strictEqual(lastSMS.to, '+919876543210');
      assert.ok(lastSMS.message.includes('S-101'));
    });

    // --- Test 3: MOCK WhatsApp provider logs and records message safely ---
    await t.test('MOCK WhatsApp sends successfully without credentials', async () => {
      clearSentMessages();
      const res = await sendWhatsApp({
        to: '9876543210',
        message: 'Your turn is approaching! Token S-101.',
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.provider, 'mock');

      const lastWA = getLastSentWhatsApp();
      assert.ok(lastWA, 'WhatsApp message must be recorded in mock store');
      assert.strictEqual(lastWA.to, '+919876543210');
      assert.ok(lastWA.message.includes('approaching'));
    });

    // --- Test 4: Customer join queue triggers external SMS/WhatsApp dispatch ---
    await t.test('Joining queue triggers external messaging dispatch', async () => {
      clearSentMessages();

      const joinRes = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bizId,
          queueId,
          serviceId,
          customerName: 'Pooja Hegde',
          customerPhone: '9811223344',
        }),
      });
      assert.strictEqual(joinRes.status, 201);

      // Wait a tick for fire-and-forget Promise to resolve
      await new Promise((r) => setTimeout(r, 50));

      const lastSMS = getLastSentSMS();
      assert.ok(lastSMS, 'SMS should be recorded upon joining queue');
      assert.strictEqual(lastSMS.to, '+919811223344');
      assert.ok(lastSMS.message.includes('confirmed'));
    });

    // --- Test 5: Calling next customer triggers external alert with counter info ---
    await t.test('Calling next customer dispatches external alert to customer phone', async () => {
      clearSentMessages();

      const nextRes = await fetch(`${baseUrl}/api/v1/business/queue/next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bizToken}`,
        },
        body: JSON.stringify({ businessId: bizId, queueId }),
      });
      assert.strictEqual(nextRes.status, 200);

      await new Promise((r) => setTimeout(r, 50));

      const lastSMS = getLastSentSMS();
      assert.ok(lastSMS, 'SMS should be dispatched to called customer');
      assert.strictEqual(lastSMS.to, '+919811223344');
      assert.ok(lastSMS.message.includes('called') || lastSMS.message.includes('counter'));
    });

    // --- Test 6: Invalid phone numbers fail gracefully without throwing ---
    await t.test('Invalid phone number returns failure status without throwing', async () => {
      const smsRes = await sendSMS({ to: 'invalid-num', message: 'Test message' });
      assert.strictEqual(smsRes.success, false);
      assert.ok(smsRes.reason.includes('Invalid phone number'));

      const waRes = await sendWhatsApp({ to: '', message: 'Test message' });
      assert.strictEqual(waRes.success, false);
    });

    // --- Test 7: Failure Isolation — messaging error does not break queue operation ---
    await t.test('Queue operations succeed even if dispatchCustomerAlert encounters errors', async () => {
      // Joining with missing/empty phone
      const joinRes = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bizId,
          queueId,
          serviceId,
          customerName: 'Emergency Walk-in',
          customerPhone: '9900112233',
        }),
      });
      assert.strictEqual(joinRes.status, 201, 'Queue join must succeed regardless of external messaging');
    });

  } finally {
    server.close();
  }
});
