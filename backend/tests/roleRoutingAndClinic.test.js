import { test } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import app from '../app.js';
import { resolveDashboardRoute, getUserDisplayRole } from '../../frontend/utils/navigation.js';
import { processGetBusinessServices } from '../services/queueService.js';
import { createGovernmentCentre } from '../models/governmentModel.js';

test('SHEWWINA Phase 3: Frontend Role Routing & Clinic Integration Test Suite', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const ts = Date.now();

  try {
    // ─────────────────────────────────────────────────────────────────────────
    // Part 1: Navigation Resolver Unit Tests
    // ─────────────────────────────────────────────────────────────────────────

    await t.test('1. resolveDashboardRoute — accurately routes Hospital operators to /hospital/dashboard', () => {
      const hospitalUserA = { id: 'u-1', role: 'BUSINESS', hospitalId: 'hosp-101', module: 'hospital' };
      assert.strictEqual(resolveDashboardRoute(hospitalUserA), '/hospital/dashboard');

      const hospitalUserB = { id: 'u-2', role: 'BUSINESS', hospital: { id: 'hosp-102' } };
      assert.strictEqual(resolveDashboardRoute(hospitalUserB), '/hospital/dashboard');

      assert.strictEqual(getUserDisplayRole(hospitalUserA), 'Hospital OPD');
    });

    await t.test('2. resolveDashboardRoute — accurately routes Government Kendra operators to /government/dashboard', () => {
      const govtUserA = { id: 'u-3', role: 'BUSINESS', centreId: 'gcentre-201', module: 'government' };
      assert.strictEqual(resolveDashboardRoute(govtUserA), '/government/dashboard');

      const govtUserB = { id: 'u-4', role: 'BUSINESS', centre: { id: 'gcentre-202' } };
      assert.strictEqual(resolveDashboardRoute(govtUserB), '/government/dashboard');

      assert.strictEqual(getUserDisplayRole(govtUserA), 'Govt Kendra');
    });

    await t.test('3. resolveDashboardRoute — accurately routes Salon business operators to /dashboard', () => {
      const salonUser = { id: 'u-5', role: 'BUSINESS', businessId: 'biz-301', module: 'business' };
      assert.strictEqual(resolveDashboardRoute(salonUser), '/dashboard');
      assert.strictEqual(getUserDisplayRole(salonUser), 'Business');
    });

    await t.test('4. resolveDashboardRoute — accurately routes Clinic business operators to /dashboard', () => {
      const clinicUser = {
        id: 'u-6',
        role: 'BUSINESS',
        businessId: 'biz-302',
        module: 'business',
        business: { category: 'clinic', name: 'Apex Skin Clinic' },
      };
      assert.strictEqual(resolveDashboardRoute(clinicUser), '/dashboard');
      assert.strictEqual(getUserDisplayRole(clinicUser), 'Clinic');
    });

    await t.test('5. resolveDashboardRoute — accurately routes Customers to /customer/dashboard', () => {
      const customerUser = { id: 'u-7', role: 'CUSTOMER', module: 'customer' };
      assert.strictEqual(resolveDashboardRoute(customerUser), '/customer/dashboard');
      assert.strictEqual(getUserDisplayRole(customerUser), 'Customer');
    });

    await t.test('6. resolveDashboardRoute — safely handles null, undefined, or invalid roles with /login', () => {
      assert.strictEqual(resolveDashboardRoute(null), '/login');
      assert.strictEqual(resolveDashboardRoute(undefined), '/login');
      assert.strictEqual(resolveDashboardRoute({}), '/login');
      assert.strictEqual(resolveDashboardRoute({ role: 'UNKNOWN_ROLE' }), '/login');
      assert.strictEqual(resolveDashboardRoute({ role: 'GUEST' }), '/login');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Part 2: Backend Integration & Module Resolution (Hospital, Govt, Clinic, Salon)
    // ─────────────────────────────────────────────────────────────────────────

    let hospitalAdminToken;
    let hospitalAdminId;

    await t.test('7. Hospital Registration returns module: "hospital" and verifies hospitalId via /auth/me', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/register-hospital`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalName: `City Care Hospital ${ts}`,
          registrationNumber: `REG-HOSP-${ts}`,
          hospitalType: 'Multi-Specialty',
          phone: '9820011222',
          email: `info_hosp_${ts}@example.com`,
          address: '45 Hospital Road, Medical Enclave',
          city: 'Mumbai',
          pincode: '400001',
          adminName: 'Dr. Vivek Admin',
          adminEmail: `admin_hosp_${ts}@example.com`,
          adminPassword: 'Password123!',
          adminPhone: '9820011222',
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.token);
      assert.ok(body.data.hospital.id);

      hospitalAdminToken = body.data.token;
      hospitalAdminId = body.data.admin.id;

      // Verify GET /api/v1/auth/me returns enriched hospital ownership
      const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${hospitalAdminToken}` },
      });
      assert.strictEqual(meRes.status, 200);
      const meBody = await meRes.json();
      assert.strictEqual(meBody.data.role, 'BUSINESS');
      assert.strictEqual(meBody.data.module, 'hospital');
      assert.ok(meBody.data.hospitalId);
      assert.strictEqual(resolveDashboardRoute(meBody.data), '/hospital/dashboard');
    });

    let govtAdminToken;

    await t.test('8. Government Kendra Registration returns module: "government" and verifies centreId via /auth/me', async () => {
      const res = await fetch(`${baseUrl}/api/v1/government/register-centre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centreName: `Maha Seva Kendra ${ts}`,
          centreCode: `MSK-${ts.toString().slice(-4)}`,
          centreType: 'Citizen Facilitation Centre',
          phone: '9820022333',
          email: `kendra_${ts}@example.com`,
          address: 'Station Road, Citizen Plaza',
          city: 'Mumbai',
          pincode: '400050',
          adminName: 'Ramesh Kendra Operator',
          adminEmail: `kendra_op_${ts}@example.com`,
          adminPassword: 'Password123!',
          adminPhone: '9820022333',
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.token);
      assert.ok(body.data.centre.id);

      govtAdminToken = body.data.token;

      // Verify GET /api/v1/auth/me returns enriched government ownership
      const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${govtAdminToken}` },
      });
      assert.strictEqual(meRes.status, 200);
      const meBody = await meRes.json();
      assert.strictEqual(meBody.data.role, 'BUSINESS');
      assert.strictEqual(meBody.data.module, 'government');
      assert.ok(meBody.data.centreId);
      assert.strictEqual(resolveDashboardRoute(meBody.data), '/government/dashboard');
    });

    let clinicBusinessId;
    let clinicToken;

    await t.test('9. Clinic Business Registration creates category="clinic" and integrates with Core Queue APIs', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Sameer Joshi',
          email: `clinic_${ts}@example.com`,
          phone: '9820033444',
          password: 'Password123!',
          businessName: `Joshi Wellness Clinic ${ts}`,
          category: 'clinic',
          city: 'Mumbai',
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.token);
      assert.ok(body.data.business.id);

      clinicToken = body.data.token;
      clinicBusinessId = body.data.business.id;

      // Check /api/v1/auth/me
      const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${clinicToken}` },
      });
      assert.strictEqual(meRes.status, 200);
      const meBody = await meRes.json();
      assert.strictEqual(meBody.data.role, 'BUSINESS');
      assert.strictEqual(meBody.data.businessId, clinicBusinessId);
      assert.strictEqual(meBody.data.business?.category, 'clinic');
      assert.strictEqual(resolveDashboardRoute(meBody.data), '/dashboard');
    });

    let consultationServiceId;

    await t.test('10. Clinic Operator manages Consultation services via real backend APIs', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clinicToken}`,
        },
        body: JSON.stringify({
          name: 'General Medical Consultation',
          durationMinutes: 20,
          price: 600,
          description: 'Comprehensive physical examination and medical consultation.',
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.id);
      consultationServiceId = body.data.id;
      assert.strictEqual(body.data.name, 'General Medical Consultation');
    });

    let patientTokenId;

    await t.test('11. Customer joins Clinic queue via real public queue join API', async () => {
      // 1. Fetch clinic services
      const svcRes = await fetch(`${baseUrl}/api/v1/business/services?businessId=${clinicBusinessId}`);
      assert.strictEqual(svcRes.status, 200);
      const svcBody = await svcRes.json();
      assert.strictEqual(svcBody.data.business.id, clinicBusinessId);
      assert.strictEqual(svcBody.data.business.category, 'clinic');
      const queueId = svcBody.data.queue.id;

      // 2. Join queue
      const joinRes = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: clinicBusinessId,
          queueId,
          serviceId: consultationServiceId,
          customerName: 'Aarav Sharma',
          customerPhone: '9820044555',
        }),
      });

      assert.strictEqual(joinRes.status, 201);
      const joinBody = await joinRes.json();
      assert.strictEqual(joinBody.success, true);
      assert.ok(joinBody.data.tokenId);
      assert.strictEqual(joinBody.data.status, 'WAITING');
      patientTokenId = joinBody.data.tokenId;
    });

    await t.test('12. Clinic Operator calls next patient and completes consultation via real Queue APIs', async () => {
      // 1. Call next
      const callRes = await fetch(`${baseUrl}/api/v1/business/queue/next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clinicToken}`,
        },
        body: JSON.stringify({
          businessId: clinicBusinessId,
        }),
      });

      assert.strictEqual(callRes.status, 200);
      const callBody = await callRes.json();
      assert.strictEqual(callBody.success, true);
      assert.strictEqual(callBody.data.tokenId, patientTokenId);
      assert.strictEqual(callBody.data.status, 'SERVING');

      // 2. Complete consultation
      const compRes = await fetch(`${baseUrl}/api/v1/business/queue/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clinicToken}`,
        },
        body: JSON.stringify({
          businessId: clinicBusinessId,
        }),
      });

      assert.strictEqual(compRes.status, 200);
      const compBody = await compRes.json();
      assert.strictEqual(compBody.success, true);
      assert.strictEqual(compBody.data.tokenId, patientTokenId);
      assert.strictEqual(compBody.data.status, 'SERVED');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Part 3: Public Business Directory & Explore Services Integration
    // ─────────────────────────────────────────────────────────────────────────

    await t.test('13. GET /api/v1/business/directory lists active businesses for discovery without demo dependence', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/directory`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data.businesses));
      assert.ok(body.data.businesses.length >= 1);

      // Verify the clinic we created is discovered in the directory
      const foundClinic = body.data.businesses.find((b) => b.id === clinicBusinessId);
      assert.ok(foundClinic, 'Newly registered clinic must be discoverable in business directory');
      assert.strictEqual(foundClinic.category, 'clinic');
    });

    await t.test('14. GET /api/v1/business/directory?category=clinic filters businesses by category', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/directory?category=clinic`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data.businesses));
      body.data.businesses.forEach((b) => {
        assert.strictEqual(b.category.toLowerCase(), 'clinic');
      });
    });

    await t.test('15. GET /api/v1/business/services requires businessId and preserves security validation', async () => {
      // 1. Missing businessId returns 400
      const missingRes = await fetch(`${baseUrl}/api/v1/business/services`);
      assert.strictEqual(missingRes.status, 400);

      // 2. Nonexistent business returns 404
      const nonExistentRes = await fetch(`${baseUrl}/api/v1/business/services?businessId=non-existent-xyz`);
      assert.strictEqual(nonExistentRes.status, 404);

      // 3. Demo slug resolves to seeded demo business without substituting unrelated real businesses
      const demoRes = await fetch(`${baseUrl}/api/v1/business/services?businessId=demo`);
      assert.strictEqual(demoRes.status, 200);
      const demoBody = await demoRes.json();
      assert.strictEqual(demoBody.data.business.slug, 'demo');
      assert.notStrictEqual(demoBody.data.business.id, clinicBusinessId);
    });

    await t.test('16. Customer registration navigates to /customer/dashboard', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Pooja Verma',
          email: `pooja_${ts}@example.com`,
          phone: '9820055666',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.data.user.role, 'CUSTOMER');
      assert.strictEqual(resolveDashboardRoute(body.data.user), '/customer/dashboard');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Part 4: Safe Demo Fallback & Multi-Module Operator Ownership Regressions
    // ─────────────────────────────────────────────────────────────────────────

    await t.test('17. Safe Demo Isolation: Missing demo business never resolves to active business', async () => {
      // Direct service test: Querying nonexistent demo or invalid ID strictly throws NotFoundError
      await assert.rejects(
        async () => {
          await processGetBusinessServices('demo-unconfigured-slug');
        },
        (err) => {
          assert.strictEqual(err.statusCode, 404);
          assert.ok(err.message.includes('Business not found'));
          return true;
        }
      );

      // Real business ID resolves only to that exact business
      const realRes = await fetch(`${baseUrl}/api/v1/business/services?businessId=${clinicBusinessId}`);
      assert.strictEqual(realRes.status, 200);
      const realBody = await realRes.json();
      assert.strictEqual(realBody.data.business.id, clinicBusinessId);
      assert.strictEqual(realBody.data.business.name, `Joshi Wellness Clinic ${ts}`);

      // Invalid business ID returns 404
      const invalidRes = await fetch(`${baseUrl}/api/v1/business/services?businessId=completely-bogus-id`);
      assert.strictEqual(invalidRes.status, 404);
    });

    await t.test('18. Multi-Module Admin: Single operator owning Hospital & Kendra resolves both without suppression', async () => {
      // 1. Provision a Government Centre owned by the existing hospitalAdminId
      const centreCode = `MMC-${ts.toString().slice(-4)}`;
      const multiCentre = await createGovernmentCentre({
        name: `Integrated District Seva Kendra ${ts}`,
        slug: `integrated-district-kendra-${ts}`,
        centreCode,
        centreType: 'Citizen Facilitation Centre',
        phone: '9820099887',
        email: `multi_kendra_${ts}@example.com`,
        address: 'Collectorate Compound, Civil Lines',
        city: 'Mumbai',
        pincode: '400001',
        adminUserId: hospitalAdminId,
        isVerified: true,
      });
      assert.ok(multiCentre.id);

      // 2. Query /api/v1/auth/me with hospitalAdminToken (now an admin of both Hospital & Govt Centre)
      const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${hospitalAdminToken}` },
      });
      assert.strictEqual(meRes.status, 200);
      const meBody = await meRes.json();

      // Assert multi-module detection and presence of both modules
      assert.strictEqual(meBody.data.isMultiModule, true);
      assert.ok(meBody.data.modules.includes('hospital'));
      assert.ok(meBody.data.modules.includes('government'));
      assert.ok(meBody.data.hospital);
      assert.ok(meBody.data.centre);
      assert.strictEqual(meBody.data.centre.id, multiCentre.id);

      // Assert frontend navigation utilities handle multi-module without suppression
      assert.strictEqual(getUserDisplayRole(meBody.data), 'Hospital & Kendra Admin');
      assert.strictEqual(resolveDashboardRoute(meBody.data, 'hospital'), '/hospital/dashboard');
      assert.strictEqual(resolveDashboardRoute(meBody.data, 'government'), '/government/dashboard');

      // 3. Backend Authorization: Verify operator can legitimately access BOTH dashboards
      const hospDashRes = await fetch(`${baseUrl}/api/v1/hospital/dashboard`, {
        headers: { Authorization: `Bearer ${hospitalAdminToken}` },
      });
      assert.strictEqual(hospDashRes.status, 200);
      const hospDashBody = await hospDashRes.json();
      assert.strictEqual(hospDashBody.success, true);

      const govtDashRes = await fetch(`${baseUrl}/api/v1/government/dashboard`, {
        headers: { Authorization: `Bearer ${hospitalAdminToken}` },
      });
      assert.strictEqual(govtDashRes.status, 200);
      const govtDashBody = await govtDashRes.json();
      assert.strictEqual(govtDashBody.success, true);
    });
  } finally {
    server.close();
  }
});
