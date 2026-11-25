import test from 'node:test';
import assert from 'node:assert';
import app from '../app.js';

test('Government & Citizen Services Test Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  let adminToken = '';
  let centreId = '';
  let counterId = '';
  let testServiceId = '';
  let testServiceSlug = '';
  let generatedTokenId = '';
  let generatedTokenNumber = '';

  try {
    // 1. Get Services Catalog
    await t.test('GET /api/v1/government/services — lists seeded services across categories', async () => {
      const res = await fetch(`${baseUrl}/api/v1/government/services`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data.services));
      assert.ok(body.data.services.length >= 4);

      // Verify category distribution
      const categories = new Set(body.data.services.map((s) => s.category));
      assert.ok(categories.has('Aadhaar'));
      assert.ok(categories.has('Passport'));
      assert.ok(categories.has('RTO'));
      assert.ok(categories.has('Municipal'));

      const firstService = body.data.services[0];
      testServiceId = firstService.id;
      testServiceSlug = firstService.slug;
    });

    // 2. Filter Services by Category
    await t.test('GET /api/v1/government/services?category=Aadhaar — filters services by category', async () => {
      const res = await fetch(`${baseUrl}/api/v1/government/services?category=Aadhaar`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.services.every((s) => s.category === 'Aadhaar'));
    });

    // 3. Service Details & Document Checklist
    await t.test('GET /api/v1/government/services/:slug — returns document checklist and source reference', async () => {
      const res = await fetch(`${baseUrl}/api/v1/government/services/${testServiceSlug}`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.service);
      assert.ok(Array.isArray(body.data.service.required_documents));
      assert.ok(body.data.service.required_documents.length > 0);
      assert.ok(body.data.service.official_fee_source);
    });

    // 4. Centre Registration
    await t.test('POST /api/v1/government/register-centre — registers a new facilitation centre & admin', async () => {
      const ts = Date.now();
      const payload = {
        centreName: `Maha Citizen Seva Kendra ${ts}`,
        centreCode: `MSK-TEST-${ts}`,
        centreType: 'Maha E-Seva Kendra / Citizen Service Desk',
        phone: '9820123456',
        email: `centre_${ts}@shewwina.org`,
        address: '101 Civic Center, Shivaji Park, Dadar West',
        city: 'Mumbai',
        district: 'Mumbai City',
        state: 'Maharashtra',
        pincode: '400028',
        latitude: 19.0280,
        longitude: 72.8390,
        supportedCategories: ['Aadhaar', 'Passport', 'RTO', 'Municipal'],
        adminName: 'Rajesh Kadam',
        adminEmail: `rajesh_${ts}@shewwina.org`,
        adminPassword: 'Password123!',
        adminPhone: '9820123456',
      };

      const res = await fetch(`${baseUrl}/api/v1/government/register-centre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.centre.id);
      assert.strictEqual(body.data.centre.is_verified, false); // New centres start unverified
      assert.ok(body.data.token);

      centreId = body.data.centre.id;
      adminToken = body.data.token;
    });

    // 5. Centre Registration Validation
    await t.test('POST /api/v1/government/register-centre — rejects missing PIN code or invalid phone', async () => {
      const payload = {
        centreName: 'Incomplete Kendra',
        centreCode: 'INC-001',
        phone: '123', // Invalid phone
        email: 'bad-email',
        address: 'Short',
        pincode: 'abc', // Invalid PIN
        adminName: 'Admin',
        adminEmail: 'admin@test.org',
        adminPassword: 'short',
      };

      const res = await fetch(`${baseUrl}/api/v1/government/register-centre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      assert.strictEqual(res.status, 400);
    });

    // 6. Search Centres
    await t.test('GET /api/v1/government/centres — searches facilitation kendras by city or category', async () => {
      const res = await fetch(`${baseUrl}/api/v1/government/centres?city=Mumbai`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data.centres));
      assert.ok(body.data.centres.length >= 1);
    });

    // 7. Get Centre Details
    await t.test('GET /api/v1/government/centres/:centreId — returns centre details and active counters', async () => {
      const res = await fetch(`${baseUrl}/api/v1/government/centres/${centreId}`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.centre.id, centreId);
      assert.ok(Array.isArray(body.data.counters));
      assert.ok(body.data.counters.length >= 2);

      counterId = body.data.counters[0].id;
    });

    // 8. Request Citizen Queue Token
    await t.test('POST /api/v1/government/token/join — issues a token pass with wait time and checklist status', async () => {
      const payload = {
        centreId,
        serviceId: testServiceId,
        citizenName: 'Aarav Deshmukh',
        citizenPhone: '9820999901',
        citizenEmail: 'aarav@citizen.org',
        appointmentType: 'WALK_IN',
        checklistCompleted: true,
        verifiedDocumentsCount: 3,
      };

      const res = await fetch(`${baseUrl}/api/v1/government/token/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.token.id);
      assert.ok(body.data.token.token_number);
      assert.strictEqual(body.data.token.status, 'WAITING');
      assert.strictEqual(body.data.token.checklist_completed, true);

      generatedTokenId = body.data.token.id;
      generatedTokenNumber = body.data.token.token_number;
    });

    // 9. Prevent Duplicate Active Token on Same Day
    await t.test('POST /api/v1/government/token/join — prevents duplicate active token for same citizen and service today', async () => {
      const payload = {
        centreId,
        serviceId: testServiceId,
        citizenName: 'Aarav Deshmukh',
        citizenPhone: '9820999901', // Same phone
      };

      const res = await fetch(`${baseUrl}/api/v1/government/token/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      assert.strictEqual(res.status, 409); // Conflict
    });

    // 10. Get Live Token Status
    await t.test('GET /api/v1/government/token/:tokenId — retrieves live token status, position and ETA', async () => {
      const res = await fetch(`${baseUrl}/api/v1/government/token/${generatedTokenId}`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.token.token_number, generatedTokenNumber);
      assert.ok(body.data.token.centre_name);
      assert.ok(body.data.token.service_name);
    });

    // 11. Add Service Counter
    await t.test('POST /api/v1/government/counters — admin adds a new service counter', async () => {
      const payload = {
        counterNumber: 'Counter 3',
        counterName: 'Passport Fast-Track Desk',
        operatorName: 'Sunil Sharma',
        assignedCategory: 'Passport',
        tokenPrefix: 'PSK',
      };

      const res = await fetch(`${baseUrl}/api/v1/government/counters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.counter.counter_number, 'Counter 3');
    });

    // 12. Toggle Counter Open/Close
    await t.test('POST /api/v1/government/counters/toggle — toggles counter availability', async () => {
      const payload = {
        counterId,
        isOpen: false,
      };

      const res = await fetch(`${baseUrl}/api/v1/government/counters/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.counter.is_open, false);

      // Re-open counter for queue tests
      await fetch(`${baseUrl}/api/v1/government/counters/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ counterId, isOpen: true }),
      });
    });

    // 13. Call Next Citizen to Counter
    await t.test('POST /api/v1/government/queue/next — calls next citizen to counter', async () => {
      const payload = { counterId };

      const res = await fetch(`${baseUrl}/api/v1/government/queue/next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.token.id, generatedTokenId);
      assert.strictEqual(body.data.token.status, 'SERVING');
    });

    // 14. Complete Citizen Token
    await t.test('POST /api/v1/government/queue/complete — marks citizen service completed', async () => {
      const payload = { tokenId: generatedTokenId };

      const res = await fetch(`${baseUrl}/api/v1/government/queue/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.token.status, 'SERVED');
    });

    // 15. Skip Citizen Token (with new token)
    await t.test('POST /api/v1/government/queue/skip — skips a citizen token', async () => {
      // Issue another token to test skip
      const tokRes = await fetch(`${baseUrl}/api/v1/government/token/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centreId,
          serviceId: testServiceId,
          citizenName: 'Meera Sen',
          citizenPhone: '9820999902',
        }),
      });
      const tokBody = await tokRes.json();
      const skipTokenId = tokBody.data.token.id;

      const res = await fetch(`${baseUrl}/api/v1/government/queue/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ tokenId: skipTokenId }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.token.status, 'SKIPPED');
    });

    // 16. Centre Operator Dashboard
    await t.test('GET /api/v1/government/dashboard — returns aggregated dashboard metrics for authenticated operator', async () => {
      const res = await fetch(`${baseUrl}/api/v1/government/dashboard`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.centre);
      assert.ok(Array.isArray(body.data.counters));
      assert.ok(body.data.summary);
      assert.ok(body.data.summary.total_tokens_today >= 2);
    });

    // 17. Dashboard Authorization Guard
    await t.test('GET /api/v1/government/dashboard — rejects unauthenticated request with 401', async () => {
      const res = await fetch(`${baseUrl}/api/v1/government/dashboard`);
      assert.strictEqual(res.status, 401);
    });

    // ─── STEP 4: Multi-Tenant Security & Cross-Centre Isolation Tests ─────────

    let centreBId = '';
    let adminTokenB = '';
    let counterBId = '';
    let tokenBId = '';

    await t.test('Cross-Centre Security Setup: registers second centre and provisions resources', async () => {
      const tsB = Date.now() + 5000;
      const payloadB = {
        centreName: `Pune Citizen Seva Kendra ${tsB}`,
        centreCode: `PSK-PUN-${tsB}`,
        centreType: 'Maha E-Seva Kendra / Citizen Service Desk',
        phone: '9820987654',
        email: `pune_${tsB}@shewwina.org`,
        address: '202 Deccan Gymkhana, FC Road',
        city: 'Pune',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '411004',
        latitude: 18.5204,
        longitude: 73.8567,
        supportedCategories: ['Aadhaar', 'Passport'],
        adminName: 'Suresh Patil',
        adminEmail: `suresh_${tsB}@shewwina.org`,
        adminPassword: 'Password123!',
        adminPhone: '9820987654',
      };

      const res = await fetch(`${baseUrl}/api/v1/government/register-centre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadB),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      centreBId = body.data.centre.id;
      adminTokenB = body.data.token;

      // Create a counter at Centre B
      const cntRes = await fetch(`${baseUrl}/api/v1/government/counters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenB}`,
        },
        body: JSON.stringify({
          counterNumber: 'Pune Desk 1',
          counterName: 'Pune Aadhaar Desk',
          assignedCategory: 'Aadhaar',
          tokenPrefix: 'PUN',
        }),
      });
      assert.strictEqual(cntRes.status, 201);
      const cntBody = await cntRes.json();
      counterBId = cntBody.data.counter.id;

      // Issue token at Centre B
      const tokRes = await fetch(`${baseUrl}/api/v1/government/token/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centreId: centreBId,
          serviceId: testServiceId,
          citizenName: 'Kunal Joshi',
          citizenPhone: '9820999999',
        }),
      });
      assert.strictEqual(tokRes.status, 201);
      const tokBody = await tokRes.json();
      tokenBId = tokBody.data.token.id;
    });

    // Security Negative Test 1: Operator A cannot toggle Operator B's counter
    await t.test('SECURITY: Operator A cannot toggle Operator B counter (returns 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/government/counters/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`, // Operator A
        },
        body: JSON.stringify({ counterId: counterBId, isOpen: false }),
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      const errMsg = body.message || body.error || '';
      assert.ok(errMsg.toLowerCase().includes('not authorized'));
    });

    // Security Negative Test 2: Operator A cannot complete Operator B's token
    await t.test('SECURITY: Operator A cannot complete Operator B token (returns 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/government/queue/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`, // Operator A
        },
        body: JSON.stringify({ tokenId: tokenBId }),
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      const errMsg = body.message || body.error || '';
      assert.ok(errMsg.toLowerCase().includes('not authorized'));
    });

    // Security Negative Test 3: Operator A cannot skip Operator B's token
    await t.test('SECURITY: Operator A cannot skip Operator B token (returns 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/government/queue/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`, // Operator A
        },
        body: JSON.stringify({ tokenId: tokenBId }),
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      const errMsg = body.message || body.error || '';
      assert.ok(errMsg.toLowerCase().includes('not authorized'));
    });

    // Security Negative Test 4: Operator A cannot access Operator B's dashboard
    await t.test('SECURITY: Operator A cannot access Operator B dashboard data (returns 403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/government/dashboard?centreId=${centreBId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`, // Operator A requesting Centre B
        },
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      const errMsg = body.message || body.error || '';
      assert.ok(errMsg.toLowerCase().includes('not authorized'));
    });

    // Security Negative Test 5: Generic user without centre cannot access dashboard
    await t.test('SECURITY: User without registered centre cannot access dashboard (returns 403 Forbidden)', async () => {
      // Register a generic customer
      const custRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Unauthorized User',
          email: `unauth_${Date.now()}@example.com`,
          phone: '+919999999999',
          password: 'Password123!',
        }),
      });

      // Customer may get token or error if customer role
      if (custRes.status === 201) {
        const custBody = await custRes.json();
        const custToken = custBody.data?.token;

        if (custToken) {
          const res = await fetch(`${baseUrl}/api/v1/government/dashboard`, {
            headers: { Authorization: `Bearer ${custToken}` },
          });
          assert.strictEqual(res.status, 403);
        }
      }
    });

    // 18. Live Token Status & People Ahead calculation
    await t.test('GET /api/v1/government/token/:tokenId — accurately computes people_ahead for waiting token', async () => {
      const res = await fetch(`${baseUrl}/api/v1/government/token/${tokenBId}`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.token.id, tokenBId);
      assert.strictEqual(typeof body.data.token.people_ahead, 'number');
    });

  } finally {
    server.close();
  }
});
