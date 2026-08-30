import test from 'node:test';
import assert from 'node:assert';
import app from '../app.js';

test('Phase 5B Business Services Management Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const ts = Date.now();
  const bizAEmail = `bizsvcA_${ts}@example.com`;
  const bizBEmail = `bizsvcB_${ts}@example.com`;
  const custEmail = `custsvc_${ts}@example.com`;
  const pass = 'Secret123!';

  let bizAToken = '';
  let bizAId = '';
  let queueAId = '';
  let bizBToken = '';
  let bizBId = '';
  let custToken = '';

  let createdSvcId = '';

  try {
    // 0. Setup Business A, Business B, Customer
    const bizARes = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Govt Office Manager',
        email: bizAEmail,
        phone: '+919666611111',
        password: pass,
        businessName: 'City Passport & License Office',
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
        name: 'Hospital Admin',
        email: bizBEmail,
        phone: '+919666622222',
        password: pass,
        businessName: 'City Care Hospital',
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
      body: JSON.stringify({ name: 'Citizen Customer', email: custEmail, phone: '+919666633333', password: pass }),
    });
    const custData = await custRes.json();
    custToken = custData.data.token;

    // 1. Business A lists own services
    await t.test('Business A can list own services', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/services?businessId=${bizAId}`, {
        headers: { Authorization: `Bearer ${bizAToken}` },
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data.services));
    });

    // 2. Business A creates a new custom service (e.g. Document Verification)
    await t.test('Business A can create a custom service', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bizAToken}`,
        },
        body: JSON.stringify({
          name: 'Document Verification',
          durationMinutes: 20,
          price: 50.0,
          description: 'Official document & identity verification',
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.name, 'Document Verification');
      assert.strictEqual(body.data.durationMinutes, 20);
      assert.strictEqual(body.data.price, 50.0);
      assert.strictEqual(body.data.isActive, true);
      createdSvcId = body.data.id;
    });

    // 3. Business A updates the created service
    await t.test('Business A can update own custom service', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/services/${createdSvcId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bizAToken}`,
        },
        body: JSON.stringify({
          name: 'Express Document Verification',
          durationMinutes: 10,
          price: 100.0,
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.name, 'Express Document Verification');
      assert.strictEqual(body.data.durationMinutes, 10);
    });

    // 4. Customer joins queue with active service -> SUCCESS
    let tokenAId = '';
    await t.test('Customer can join queue with active custom service', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${custToken}`,
        },
        body: JSON.stringify({
          businessId: bizAId,
          queueId: queueAId,
          serviceId: createdSvcId,
          customerName: 'Citizen Customer',
          customerPhone: '+919666633333',
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.data.serviceName, 'Express Document Verification');
      tokenAId = body.data.tokenId;
    });

    // 5. Business A deactivates service
    await t.test('Business A can deactivate own service', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/services/${createdSvcId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bizAToken}`,
        },
        body: JSON.stringify({ isActive: false }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.data.isActive, false);
    });

    // 6. Customers only see active services on public service lookup
    await t.test('Public customer services endpoint excludes deactivated service', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/services?businessId=${bizAId}`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      const ids = body.data.services.map((s) => s.id);
      assert.strictEqual(ids.includes(createdSvcId), false);
    });

    // 7. Joining queue with a deactivated service returns 400 Bad Request
    await t.test('Joining queue with deactivated service returns 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${custToken}`,
        },
        body: JSON.stringify({
          businessId: bizAId,
          queueId: queueAId,
          serviceId: createdSvcId,
          customerName: 'Citizen Customer 2',
          customerPhone: '+919666633344',
        }),
      });

      assert.strictEqual(res.status, 400);
    });

    // 8. Historical token referencing deactivated service remains completely intact
    await t.test('Historical queue token referencing deactivated service remains intact', async () => {
      const res = await fetch(`${baseUrl}/api/v1/queue/status/${tokenAId}`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.data.service, 'Express Document Verification');
    });

    // 9. Business B cannot modify Business A's service (403 Forbidden)
    await t.test('Business B owner cannot modify Business A service (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/services/${createdSvcId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bizBToken}`,
        },
        body: JSON.stringify({ name: 'Tampered Service Name' }),
      });

      assert.strictEqual(res.status, 403);
    });

    // 10. Customer cannot create or modify services (403 Forbidden)
    await t.test('Customer role cannot create services (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${custToken}`,
        },
        body: JSON.stringify({ name: 'Unauthorized Customer Service', durationMinutes: 15, price: 0 }),
      });

      assert.strictEqual(res.status, 403);
    });

    // 11. Unauthenticated request returns 401 Unauthorized
    await t.test('Unauthenticated request to create service returns 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'No Auth Service', durationMinutes: 15, price: 0 }),
      });

      assert.strictEqual(res.status, 401);
    });

  } finally {
    server.close();
  }
});
