import test from 'node:test';
import assert from 'node:assert';
import app from '../app.js';

test('Phase 5C Queue Configuration API Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const ts = Date.now();
  const bizAEmail = `queuecfgA_${ts}@example.com`;
  const bizBEmail = `queuecfgB_${ts}@example.com`;
  const custEmail = `custcfg_${ts}@example.com`;
  const pass = 'Secret123!';

  let bizAToken = '';
  let bizAId = '';
  let queueAId = '';
  let bizBToken = '';
  let bizBId = '';
  let custToken = '';
  let serviceId = '';

  try {
    // 0. Setup Business A (Government Office), Business B (Clinic), Customer
    const bizARes = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Govt Office Officer',
        email: bizAEmail,
        phone: '+919555511111',
        password: pass,
        businessName: 'Regional Passport Office',
        category: 'government',
        city: 'Mumbai',
      }),
    });
    const bizAData = await bizARes.json();
    bizAToken = bizAData.data.token;
    bizAId = bizAData.data.business.id;
    queueAId = bizAData.data.queue.id;

    const bizBRes = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Clinic Doctor',
        email: bizBEmail,
        phone: '+919555522222',
        password: pass,
        businessName: 'Apex Health Clinic',
        category: 'clinic',
        city: 'Delhi',
      }),
    });
    const bizBData = await bizBRes.json();
    bizBToken = bizBData.data.token;
    bizBId = bizBData.data.business.id;

    const custRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Citizen User', email: custEmail, phone: '+919555533333', password: pass }),
    });
    const custData = await custRes.json();
    custToken = custData.data.token;

    // Get default service for Business A
    const svcRes = await fetch(`${baseUrl}/api/v1/business/services?businessId=${bizAId}`);
    const svcData = await svcRes.json();
    serviceId = svcData.data.services[0].id;

    // 1. Business A gets own queue settings
    await t.test('Business A can retrieve own queue settings', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/queue/settings?queueId=${queueAId}`, {
        headers: { Authorization: `Bearer ${bizAToken}` },
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.id, queueAId);
      assert.strictEqual(body.data.isOpen, true);
    });

    // 2. Business A updates queue settings (Name, Prefix: GOV, Capacity: 2, Duration: 20)
    await t.test('Business A can update queue settings with custom token prefix and capacity', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/queue/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bizAToken}`,
        },
        body: JSON.stringify({
          queueId: queueAId,
          name: 'Passport Verification Queue',
          isOpen: true,
          tokenPrefix: 'GOV',
          maxDailyCapacity: 2,
          avgServiceDuration: 20,
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.name, 'Passport Verification Queue');
      assert.strictEqual(body.data.tokenPrefix, 'GOV');
      assert.strictEqual(body.data.maxDailyCapacity, 2);
    });

    // 3. Customer joins queue and receives token with custom prefix 'GOV-'
    let token1Id = '';
    await t.test('Customer receives token with updated custom prefix GOV-', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${custToken}`,
        },
        body: JSON.stringify({
          businessId: bizAId,
          queueId: queueAId,
          serviceId,
          customerName: 'Citizen One',
          customerPhone: '+919555533333',
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.ok(body.data.tokenNumber.startsWith('GOV-'));
      token1Id = body.data.tokenId;
    });

    // 4. Fill capacity to limit (2 tokens max)
    await t.test('Second customer joins queue up to max capacity', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${custToken}`,
        },
        body: JSON.stringify({
          businessId: bizAId,
          queueId: queueAId,
          serviceId,
          customerName: 'Citizen Two',
          customerPhone: '+919555544444',
        }),
      });
      assert.strictEqual(res.status, 201);
    });

    // 5. Exceeding max capacity returns 409 Conflict
    await t.test('Customer join fails with 409 Conflict when queue daily capacity is reached', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${custToken}`,
        },
        body: JSON.stringify({
          businessId: bizAId,
          queueId: queueAId,
          serviceId,
          customerName: 'Overflow Citizen',
          customerPhone: '+919555555555',
        }),
      });

      assert.strictEqual(res.status, 409);
    });

    // 6. Business A closes the queue
    await t.test('Business A can close queue', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/queue/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bizAToken}`,
        },
        body: JSON.stringify({
          queueId: queueAId,
          isOpen: false,
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.data.isOpen, false);
    });

    // 7. Closed queue prevents NEW customer joins (409 Conflict)
    await t.test('Closed queue prevents new customer token creation (409 Conflict)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${custToken}`,
        },
        body: JSON.stringify({
          businessId: bizAId,
          queueId: queueAId,
          serviceId,
          customerName: 'New Citizen After Close',
          customerPhone: '+919555566666',
        }),
      });

      assert.strictEqual(res.status, 409);
    });

    // 8. Existing tokens remain valid and callable even when queue is CLOSED
    await t.test('Business can call next existing token even when queue is CLOSED', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/queue/next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bizAToken}`,
        },
        body: JSON.stringify({ businessId: bizAId, queueId: queueAId }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.data.tokenId, token1Id);
    });

    // 9. Business B cannot modify Business A queue settings (403 Forbidden)
    await t.test('Business B owner cannot modify Business A queue settings (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/queue/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bizBToken}`,
        },
        body: JSON.stringify({ queueId: queueAId, name: 'Hacked Queue Name' }),
      });

      assert.strictEqual(res.status, 403);
    });

    // 10. Customer role cannot modify queue settings (403 Forbidden)
    await t.test('Customer role cannot modify queue settings (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/queue/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${custToken}`,
        },
        body: JSON.stringify({ queueId: queueAId, name: 'Customer Hacked Name' }),
      });

      assert.strictEqual(res.status, 403);
    });

    // 11. Unauthenticated request returns 401 Unauthorized
    await t.test('Unauthenticated request to get queue settings returns 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/queue/settings`);
      assert.strictEqual(res.status, 401);
    });

  } finally {
    server.close();
  }
});
