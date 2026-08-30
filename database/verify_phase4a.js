import app from '../backend/app.js';
import assert from 'node:assert';

async function verifyPhase4A() {
  console.log('Starting Phase 4A Customer Dashboard Manual Runtime Verification...\n');
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const ts = Date.now();
  const custAEmail = `verify_custA_${ts}@example.com`;
  const custBEmail = `verify_custB_${ts}@example.com`;
  const bizEmail = `verify_bizowner_${ts}@example.com`;
  const pass = 'Secret123!';

  let custAToken = '';
  let custBToken = '';
  let bizToken = '';
  let bizId = '';
  let queueId = '';
  let serviceId = '';

  try {
    // 1. Setup Business & Customers
    const bizRes = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dashboard Owner',
        email: bizEmail,
        phone: '+919111122222',
        password: pass,
        businessName: 'Phase 4A Test Salon',
        category: 'salon',
        city: 'Mumbai',
      }),
    });
    const bizData = await bizRes.json();
    bizToken = bizData.data.token;
    bizId = bizData.data.business.id;
    queueId = bizData.data.queue.id;

    const svcRes = await fetch(`${baseUrl}/api/v1/business/services?businessId=${bizId}`);
    const svcData = await svcRes.json();
    serviceId = svcData.data.services[0].id;

    const custARes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Customer A', email: custAEmail, phone: '+919000011111', password: pass }),
    });
    const custAData = await custARes.json();
    custAToken = custAData.data.token;

    const custBRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Customer B', email: custBEmail, phone: '+919000022222', password: pass }),
    });
    const custBData = await custBRes.json();
    custBToken = custBData.data.token;

    // Test 1: GET /api/v1/customer/profile
    const profRes = await fetch(`${baseUrl}/api/v1/customer/profile`, {
      headers: { Authorization: `Bearer ${custAToken}` },
    });
    assert.strictEqual(profRes.status, 200);
    const profData = await profRes.json();
    assert.strictEqual(profData.data.email, custAEmail.toLowerCase());
    console.log('✅ Customer Profile API: PASS');

    // Test 2: Unauthenticated 401
    const unauthRes = await fetch(`${baseUrl}/api/v1/customer/profile`);
    assert.strictEqual(unauthRes.status, 401);
    console.log('✅ Unauthenticated 401 Protection: PASS');

    // Test 3: Business user 403
    const bizCustRes = await fetch(`${baseUrl}/api/v1/customer/profile`, {
      headers: { Authorization: `Bearer ${bizToken}` },
    });
    assert.strictEqual(bizCustRes.status, 403);
    console.log('✅ Business User 403 Protection: PASS');

    // Test 4: Customer A joins queue
    const joinRes = await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${custAToken}`,
      },
      body: JSON.stringify({
        businessId: bizId,
        queueId: queueId,
        serviceId: serviceId,
        customerName: 'Customer A',
        customerPhone: '+919000011111',
      }),
    });
    const joinData = await joinRes.json();
    assert.strictEqual(joinRes.status, 201);
    const tokenNumber = joinData.data.tokenNumber;
    console.log(`✅ Customer A Joined Queue (#${tokenNumber}): PASS`);

    // Test 5: GET /api/v1/customer/active-token
    const activeRes = await fetch(`${baseUrl}/api/v1/customer/active-token`, {
      headers: { Authorization: `Bearer ${custAToken}` },
    });
    assert.strictEqual(activeRes.status, 200);
    const activeData = await activeRes.json();
    assert.strictEqual(activeData.data.tokenNumber, tokenNumber);
    assert.strictEqual(activeData.data.businessName, 'Phase 4A Test Salon');
    console.log('✅ Active Token Retrieval & Live Wait Display: PASS');

    // Test 6: Customer B active token (Isolation)
    const activeBRes = await fetch(`${baseUrl}/api/v1/customer/active-token`, {
      headers: { Authorization: `Bearer ${custBToken}` },
    });
    assert.strictEqual(activeBRes.status, 200);
    const activeBData = await activeBRes.json();
    assert.strictEqual(activeBData.data, null);
    console.log('✅ Customer Active Token Isolation (Customer B sees null): PASS');

    // Test 7: GET /api/v1/customer/tokens (History)
    const histRes = await fetch(`${baseUrl}/api/v1/customer/tokens`, {
      headers: { Authorization: `Bearer ${custAToken}` },
    });
    assert.strictEqual(histRes.status, 200);
    const histData = await histRes.json();
    assert.strictEqual(histData.data.length, 1);
    assert.strictEqual(histData.data[0].tokenNumber, tokenNumber);
    console.log('✅ Customer Token History Retrieval: PASS');

    // Test 8: Customer B Token History (Isolation)
    const histBRes = await fetch(`${baseUrl}/api/v1/customer/tokens`, {
      headers: { Authorization: `Bearer ${custBToken}` },
    });
    assert.strictEqual(histBRes.status, 200);
    const histBData = await histBRes.json();
    assert.strictEqual(histBData.data.length, 0);
    console.log('✅ Customer Token History Isolation (Customer B sees empty history): PASS');

    console.log('\nPhase 4A Customer Dashboard Manual Verification COMPLETE: ALL TESTS PASSED!');

  } finally {
    server.close();
  }
}

verifyPhase4A();
