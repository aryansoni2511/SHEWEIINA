/**
 * messagingGateway.test.js — Phase 11 Automated Test Suite
 *
 * Comprehensive tests for:
 * 1. Provider router & MOCK mode defaults
 * 2. Standardized message templates
 * 3. Per-phone anti-spam throttling
 * 4. Provider adapter failure isolation (Fast2SMS, Twilio, WhatsApp Cloud)
 * 5. Business queue notification settings (SMS on/off, WhatsApp on/off, alert threshold)
 * 6. Disabled channel suppression in dispatchCustomerAlert
 * 7. Merchant test alert endpoint (POST /api/v1/business/messaging/test)
 */

import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../app.js';
import {
  sendSMS,
  sendWhatsApp,
  dispatchCustomerAlert,
  getActiveSmsProvider,
  getActiveWhatsAppProvider,
  clearMessagingCooldown,
  clearSentMessages,
  getLastSentSMS,
  getLastSentWhatsApp,
  MESSAGING_PROVIDERS,
} from '../services/messagingService.js';
import { sendFast2SMS } from '../services/messaging/fast2smsProvider.js';
import { sendTwilioMessage } from '../services/messaging/twilioProvider.js';
import { sendWhatsAppCloudMessage } from '../services/messaging/whatsappCloudProvider.js';
import { formatTemplateMessage, MESSAGE_TYPES } from '../services/messaging/messageTemplates.js';

// ─── HTTP Helper ─────────────────────────────────────────────────────────────

async function req(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const options = {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      };
      const clientReq = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          server.close();
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });
      clientReq.on('error', (err) => { server.close(); reject(err); });
      if (body) clientReq.write(JSON.stringify(body));
      clientReq.end();
    });
  });
}

// ─── Shared State ────────────────────────────────────────────────────────────

let businessToken = null;
const demoBusinessId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

before(async () => {
  const email = `phase11_test_${Date.now()}@shewwina.test`;
  await req('POST', '/api/v1/auth/register-business', {
    name: 'Gateway Owner',
    email,
    phone: '9876543210',
    password: 'password123',
    businessName: 'Gateway Test Clinic',
    category: 'clinic',
    address: '45 Bandra West',
    city: 'Mumbai',
  });
  const loginRes = await req('POST', '/api/v1/auth/login', { email, password: 'password123' });
  businessToken = loginRes.body.data?.token || null;
});

beforeEach(() => {
  clearSentMessages();
  clearMessagingCooldown();
});

// ─── Suite 1: Provider Routing & Defaults ─────────────────────────────────────

describe('Phase 11 — Provider Router & MOCK Engine', () => {
  it('1. Default SMS and WhatsApp providers resolve to MOCK in development', () => {
    const smsProv = getActiveSmsProvider();
    const waProv = getActiveWhatsAppProvider();
    assert.strictEqual(smsProv, MESSAGING_PROVIDERS.MOCK);
    assert.strictEqual(waProv, MESSAGING_PROVIDERS.MOCK);
  });

  it('2. sendSMS dispatches via MOCK, stores in memory, and normalizes phone', async () => {
    const res = await sendSMS({
      to: '9876543210',
      message: 'Your token S-101 is ready',
      metadata: { type: 'TEST' },
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.provider, 'mock');
    assert.ok(res.messageId);

    const last = getLastSentSMS();
    assert.ok(last);
    assert.strictEqual(last.to, '+919876543210');
    assert.strictEqual(last.message, 'Your token S-101 is ready');
  });

  it('3. sendWhatsApp dispatches via MOCK and stores in memory', async () => {
    const res = await sendWhatsApp({
      to: '+919876543210',
      message: 'WhatsApp alert: Token called',
      metadata: { type: 'TEST' },
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.provider, 'mock');

    const last = getLastSentWhatsApp();
    assert.ok(last);
    assert.strictEqual(last.channel, 'WHATSAPP');
  });

  it('4. Rejects invalid phone numbers gracefully without throwing', async () => {
    const res = await sendSMS({ to: 'invalid-num', message: 'Hi' });
    assert.strictEqual(res.success, false);
    assert.ok(res.reason.includes('Invalid phone number'));
  });
});

// ─── Suite 2: Message Templates ──────────────────────────────────────────────

describe('Phase 11 — Standardized Message Templates', () => {
  it('5. Formats CUSTOMER_JOINED_QUEUE template correctly', () => {
    const text = formatTemplateMessage(MESSAGE_TYPES.CUSTOMER_JOINED_QUEUE, {
      businessName: 'Elite Salon',
      tokenNumber: 'S-105',
      position: 3,
      estimatedWaitMinutes: 45,
      trackingUrl: 'https://shewwina.in/token/123',
    });
    assert.ok(text.includes('token S-105 is confirmed at Elite Salon'));
    assert.ok(text.includes('#3 in line'));
    assert.ok(text.includes('~45 min'));
    assert.ok(text.includes('https://shewwina.in/token/123'));
  });

  it('6. Formats YOUR_TURN_APPROACHING template for 2 ahead and 0 ahead', () => {
    const text2 = formatTemplateMessage(MESSAGE_TYPES.YOUR_TURN_APPROACHING, {
      businessName: 'Apollo Clinic',
      tokenNumber: 'A-22',
      peopleAhead: 2,
    });
    assert.ok(text2.includes('Almost your turn! Token A-22 at Apollo Clinic (2 ahead)'));

    const text0 = formatTemplateMessage(MESSAGE_TYPES.YOUR_TURN_APPROACHING, {
      businessName: 'Apollo Clinic',
      tokenNumber: 'A-22',
      peopleAhead: 0,
    });
    assert.ok(text0.includes("You're next! Token A-22 at Apollo Clinic"));
  });

  it('7. Formats CUSTOMER_CALLED and SERVICE_COMPLETED templates', () => {
    const calledText = formatTemplateMessage(MESSAGE_TYPES.CUSTOMER_CALLED, {
      businessName: 'City Barbers',
      tokenNumber: 'B-10',
    });
    assert.ok(calledText.includes("It's your turn! Token B-10 has been called at City Barbers"));

    const completedText = formatTemplateMessage(MESSAGE_TYPES.SERVICE_COMPLETED, {
      businessName: 'City Barbers',
      tokenNumber: 'B-10',
    });
    assert.ok(completedText.includes('token B-10 at City Barbers has been completed'));
  });
});

// ─── Suite 3: Per-Phone Cooldown Anti-Spam ───────────────────────────────────

describe('Phase 11 — Per-Phone Anti-Spam Throttling', () => {
  it('8. Throttles rapid duplicate dispatches to the same phone within cooldown', async () => {
    const first = await sendSMS({
      to: '9876543210',
      message: 'Message 1',
      metadata: { type: 'CUSTOMER_JOINED_QUEUE' },
    });
    assert.strictEqual(first.success, true);

    // Immediate second dispatch to same phone and same type
    const second = await sendSMS({
      to: '9876543210',
      message: 'Message 2 (duplicate spam)',
      metadata: { type: 'CUSTOMER_JOINED_QUEUE' },
    });
    assert.strictEqual(second.success, false);
    assert.strictEqual(second.throttled, true);
    assert.ok(second.reason.includes('anti-spam cooldown'));

    // After clearing cooldown, dispatch succeeds again
    clearMessagingCooldown();
    const third = await sendSMS({
      to: '9876543210',
      message: 'Message 3',
      metadata: { type: 'CUSTOMER_JOINED_QUEUE' },
    });
    assert.strictEqual(third.success, true);
  });
});

// ─── Suite 4: Provider Adapter Failure Isolation ─────────────────────────────

describe('Phase 11 — Gateway Adapter Failure Isolation', () => {
  it('9. Fast2SMS returns safe error if API key missing without throwing', async () => {
    const res = await sendFast2SMS({ to: '9876543210', message: 'Hello', apiKey: null });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.provider, 'fast2sms');
    assert.ok(res.error.includes('Fast2SMS API key not configured'));
  });

  it('10. Twilio returns safe error if credentials missing without throwing', async () => {
    const res = await sendTwilioMessage({
      to: '+919876543210',
      message: 'Hello',
      accountSid: null,
      authToken: null,
      fromNumber: null,
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.provider, 'twilio');
    assert.ok(res.error.includes('Twilio credentials not configured'));
  });

  it('11. WhatsApp Cloud returns safe error if token missing without throwing', async () => {
    const res = await sendWhatsAppCloudMessage({
      to: '9876543210',
      message: 'Hello',
      accessToken: null,
      phoneNumberId: null,
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.provider, 'whatsapp_cloud');
    assert.ok(res.error.includes('WhatsApp Cloud credentials not configured'));
  });
});

// ─── Suite 5: Business Queue Notification Settings API ───────────────────────

describe('Phase 11 — Business Queue Notification Settings API', () => {
  it('12. GET /api/v1/business/queue/settings includes notification configuration', async () => {
    const res = await req('GET', '/api/v1/business/queue/settings', null, businessToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    const settings = res.body.data;
    assert.strictEqual(typeof settings.smsNotificationsEnabled, 'boolean');
    assert.strictEqual(typeof settings.whatsappNotificationsEnabled, 'boolean');
    assert.strictEqual(typeof settings.turnAlertThreshold, 'number');
    assert.ok(settings.turnAlertThreshold >= 1 && settings.turnAlertThreshold <= 5);
  });

  it('13. PUT /api/v1/business/queue/settings updates notification toggles and threshold', async () => {
    const updatePayload = {
      smsNotificationsEnabled: true,
      whatsappNotificationsEnabled: true,
      turnAlertThreshold: 3,
    };

    const res = await req('PUT', '/api/v1/business/queue/settings', updatePayload, businessToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.smsNotificationsEnabled, true);
    assert.strictEqual(res.body.data.whatsappNotificationsEnabled, true);
    assert.strictEqual(res.body.data.turnAlertThreshold, 3);
  });

  it('14. Validates turnAlertThreshold bounds (must be between 1 and 5)', async () => {
    const invalidRes = await req('PUT', '/api/v1/business/queue/settings', {
      turnAlertThreshold: 10,
    }, businessToken);
    assert.strictEqual(invalidRes.status, 400);
    assert.strictEqual(invalidRes.body.success, false);
    assert.ok(invalidRes.body.message.includes('between 1 and 5'));
  });

  it('15. Disabled SMS channel suppresses outgoing SMS dispatches', async () => {
    await dispatchCustomerAlert({
      phone: '9876543210',
      message: 'No SMS should go',
      preferences: { smsEnabled: false, whatsappEnabled: false },
    });

    // Wait 50ms for fire-and-forget promise
    await new Promise((r) => setTimeout(r, 50));
    assert.strictEqual(getLastSentSMS(), null, 'No SMS should have been dispatched');
    assert.strictEqual(getLastSentWhatsApp(), null, 'No WhatsApp should have been dispatched');
  });
});

// ─── Suite 6: Merchant Test Alert Endpoint ───────────────────────────────────

describe('Phase 11 — Merchant Test Alert Endpoint', () => {
  it('16. POST /api/v1/business/messaging/test sends test alert in MOCK mode', async () => {
    const res = await req('POST', '/api/v1/business/messaging/test', {
      channel: 'SMS',
      testPhone: '9876543210',
    }, businessToken);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.channel, 'SMS');
    assert.strictEqual(res.body.data.status, 'DISPATCHED');
    assert.strictEqual(res.body.data.provider, 'mock');
  });

  it('17. Rejects test alert if phone is missing (400)', async () => {
    const res = await req('POST', '/api/v1/business/messaging/test', {
      channel: 'SMS',
      testPhone: '',
    }, businessToken);

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  it('18. Rejects unauthenticated test alert request (401)', async () => {
    const res = await req('POST', '/api/v1/business/messaging/test', {
      channel: 'SMS',
      testPhone: '9876543210',
    }, null);

    assert.strictEqual(res.status, 401);
  });
});
