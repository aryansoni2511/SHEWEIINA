import test from 'node:test';
import assert from 'node:assert';
import app from '../app.js';

test('Phase 5A Business Profile & Setup API Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const ts = Date.now();
  const biz1Email = `bizprof1_${ts}@example.com`;
  const biz2Email = `bizprof2_${ts}@example.com`;
  const custEmail = `custprof_${ts}@example.com`;
  const pass = 'Secret123!';

  let biz1Token = '';
  let biz1Id = '';
  let biz2Token = '';
  let biz2Id = '';
  let custToken = '';

  try {
    // 0. Register Business 1 & Business 2 & Customer
    const res1 = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Profile Owner 1',
        email: biz1Email,
        phone: '+919777711111',
        password: pass,
        businessName: 'Original Salon Name',
        category: 'salon',
        city: 'Mumbai',
      }),
    });
    const data1 = await res1.json();
    biz1Token = data1.data.token;
    biz1Id = data1.data.business.id;

    const res2 = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Profile Owner 2',
        email: biz2Email,
        phone: '+919777722222',
        password: pass,
        businessName: 'Second Business Salon',
        category: 'clinic',
        city: 'Delhi',
      }),
    });
    const data2 = await res2.json();
    biz2Token = data2.data.token;
    biz2Id = data2.data.business.id;

    const resCust = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Regular Customer', email: custEmail, phone: '+919777733333', password: pass }),
    });
    const dataCust = await resCust.json();
    custToken = dataCust.data.token;

    // 1. GET /api/v1/business/profile — Success for Business Owner 1
    await t.test('GET /api/v1/business/profile retrieves own profile data', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/profile?businessId=${biz1Id}`, {
        headers: { Authorization: `Bearer ${biz1Token}` },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.id, biz1Id);
      assert.strictEqual(body.data.name, 'Original Salon Name');
    });

    // 2. PUT /api/v1/business/profile — Success updating own business profile
    await t.test('PUT /api/v1/business/profile updates own business details', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/profile?businessId=${biz1Id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${biz1Token}`,
        },
        body: JSON.stringify({
          name: 'Updated Luxury Salon',
          category: 'spa',
          phone: '+919999900000',
          address: '100 Marine Drive',
          city: 'Mumbai',
          description: 'Premium spa and wellness center',
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.name, 'Updated Luxury Salon');
      assert.strictEqual(body.data.category, 'spa');
      assert.strictEqual(body.data.phone, '+919999900000');
    });

    // 3. Unauthenticated request returns 401
    await t.test('GET /api/v1/business/profile returns 401 without JWT', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/profile`);
      assert.strictEqual(res.status, 401);
    });

    // 4. Customer role request returns 403
    await t.test('GET /api/v1/business/profile returns 403 for Customer role', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/profile`, {
        headers: { Authorization: `Bearer ${custToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    // 5. Cross-business profile access returns 403
    await t.test('Business 1 owner cannot view Business 2 profile (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/profile?businessId=${biz2Id}`, {
        headers: { Authorization: `Bearer ${biz1Token}` },
      });
      assert.strictEqual(res.status, 403);
    });

    // 6. Cross-business profile update returns 403
    await t.test('Business 1 owner cannot update Business 2 profile (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/profile?businessId=${biz2Id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${biz1Token}`,
        },
        body: JSON.stringify({ name: 'Hacked Salon Name' }),
      });
      assert.strictEqual(res.status, 403);
    });

    // 7. Validation error on empty name returns 400
    await t.test('PUT /api/v1/business/profile returns 400 when name is empty', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/profile?businessId=${biz1Id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${biz1Token}`,
        },
        body: JSON.stringify({ name: '   ' }),
      });
      assert.strictEqual(res.status, 400);
    });

  } finally {
    server.close();
  }
});
