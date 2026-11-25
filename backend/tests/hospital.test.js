import test from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { createHospitalToken, findDoctorQueueByDoctorId, setCustomHospitalClientHandler } from '../models/hospitalModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

test('Hospital Management & OPD Queue Test Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  let adminToken = '';
  let adminUserIdA = '';
  let hospitalId = '';
  let departmentId = '';
  let doctorId = '';
  let generatedTokenId = '';
  let generatedTokenNumber = '';

  try {
    // 1. Hospital Registration
    await t.test('POST /api/v1/hospital/register-hospital — registers hospital and admin account successfully', async () => {
      const ts = Date.now();
      const payload = {
        hospitalName: `Apollo Care Medical Center ${ts}`,
        registrationNumber: `REG-MAH-${ts}`,
        hospitalType: 'Multi-Specialty',
        phone: '9820123456',
        email: `admin_${ts}@apollocare.org`,
        address: '77 Health Boulevard, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        latitude: 19.0596,
        longitude: 72.8295,
        facilities: ['Emergency 24x7', 'ICU', 'Pharmacy', 'Radiology'],
        adminName: 'Dr. Vikram Malhotra',
        adminEmail: `vikram_${ts}@apollocare.org`,
        adminPassword: 'Password123!',
        adminPhone: '9820123456',
      };

      const res = await fetch(`${baseUrl}/api/v1/hospital/register-hospital`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.hospital.id);
      assert.strictEqual(body.data.hospital.name, payload.hospitalName);
      assert.ok(body.data.token);
      assert.ok(Array.isArray(body.data.starterDepartments));

      adminToken = body.data.token;
      hospitalId = body.data.hospital.id;
      adminUserIdA = body.data.admin.id;
    });

    // 2. Validation
    await t.test('POST /api/v1/hospital/register-hospital — validates required inputs and rejects weak password', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/register-hospital`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalName: 'X',
          registrationNumber: 'R',
          phone: '123',
          email: 'invalid-email',
          address: 'No',
          city: 'M',
          pincode: '123',
          adminName: 'A',
          adminEmail: 'bad-email',
          adminPassword: 'short',
        }),
      });

      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });

    // 3. Patient Registration
    await t.test('POST /api/v1/hospital/register-patient — creates patient with unique patient code', async () => {
      const ts = Date.now();
      const res = await fetch(`${baseUrl}/api/v1/hospital/register-patient`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Kavita Joshi',
          age: 32,
          gender: 'Female',
          phone: `9820${String(ts).slice(-6)}`,
          email: `kavita_${ts}@example.com`,
          address: 'Flat 402, Lotus Towers, Andheri East, Mumbai',
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.patient.patient_id);
      assert.match(body.data.patient.patient_id, /^SHW-P-\d+$/);
      assert.strictEqual(body.data.patient.name, 'Kavita Joshi');
    });

    // 4. Search & Discovery
    await t.test('GET /api/v1/hospital/search — searches hospitals by name, city, or pincode', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/search?city=Mumbai`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data.hospitals));
      assert.ok(body.data.hospitals.length >= 1);
    });

    // 5. Details
    await t.test('GET /api/v1/hospital/details/:hospitalId — returns hospital info, departments & doctors with live queues', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/details/${hospitalId}`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.hospital.id, hospitalId);
      assert.ok(Array.isArray(body.data.departments));
      assert.ok(body.data.departments.length >= 1);

      departmentId = body.data.departments[0].id;
    });

    // 6. Create Department
    await t.test('POST /api/v1/hospital/departments — admin creates a new medical department', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          hospitalId,
          name: 'Neurology & Brain Sciences',
          code: 'NEURO',
          description: 'Brain, stroke, migraine and nerve disorder consultations.',
          floorRoom: '3rd Floor, Neuro Wing',
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.department.name, 'Neurology & Brain Sciences');
      assert.strictEqual(body.data.department.code, 'NEURO');
    });

    // 7. Register Doctor
    await t.test('POST /api/v1/hospital/doctors — admin registers a doctor and auto-provisions doctor OPD queue', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/doctors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          hospitalId,
          departmentId,
          name: 'Dr. Ananya Roy',
          qualification: 'MBBS, MD (General Medicine)',
          specialization: 'Internal Medicine Specialist',
          roomNumber: 'OPD Cabin 105',
          consultationDuration: 15,
          consultationFee: 600,
          availability: 'Mon - Sat (09:00 AM - 01:00 PM)',
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.doctor.id);
      assert.ok(body.data.queue.id);
      assert.strictEqual(body.data.doctor.name, 'Dr. Ananya Roy');

      doctorId = body.data.doctor.id;
    });

    // 8. Request OPD Token
    await t.test('POST /api/v1/hospital/token/join — patient requests OPD token for specific doctor', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/token/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId,
          doctorId,
          patientName: 'Rohan Deshmukh',
          patientPhone: '9820987654',
          patientAge: 45,
          patientGender: 'Male',
        }),
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.token.id);
      assert.ok(body.data.token.token_number);
      assert.strictEqual(body.data.token.status, 'WAITING');
      assert.strictEqual(body.data.token.position, 1);
      assert.strictEqual(body.data.doctor.id, doctorId);

      generatedTokenId = body.data.token.id;
      generatedTokenNumber = body.data.token.token_number;
    });

    // 9. Prevent Duplicate Active Token
    await t.test('POST /api/v1/hospital/token/join — prevents duplicate active token for same patient and doctor today', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/token/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId,
          doctorId,
          patientName: 'Rohan Deshmukh',
          patientPhone: '9820987654', // duplicate
        }),
      });

      assert.strictEqual(res.status, 409);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.match(body.message, /already have an active token/i);
    });

    // 10. Get Token Status
    await t.test('GET /api/v1/hospital/token/:tokenId — retrieves live token status', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/token/${generatedTokenId}`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.token.id, generatedTokenId);
      assert.strictEqual(body.data.token.token_number, generatedTokenNumber);
      assert.strictEqual(body.data.token.status, 'WAITING');
    });

    // 11. Call Next Patient
    await t.test('POST /api/v1/hospital/queue/next — doctor calls next patient in OPD queue', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/queue/next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          hospitalId,
          doctorId,
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.token.id, generatedTokenId);
      assert.strictEqual(body.data.token.status, 'SERVING');
    });

    // 12. Complete Consultation
    await t.test('POST /api/v1/hospital/queue/complete — doctor completes consultation', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/queue/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          hospitalId,
          doctorId,
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.token.id, generatedTokenId);
      assert.strictEqual(body.data.token.status, 'SERVED');
    });

    // 13. Toggle Queue
    await t.test('POST /api/v1/hospital/queue/toggle — toggles doctor queue open/closed status', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/queue/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          hospitalId,
          doctorId,
          isOpen: false,
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.queue.is_open, false);
    });

    // 14. Hospital Dashboard
    await t.test('GET /api/v1/hospital/dashboard — returns aggregated hospital dashboard summary', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/dashboard`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.hospital);
      assert.ok(body.data.summary);
      assert.strictEqual(typeof body.data.summary.totalWaiting, 'number');
      assert.strictEqual(typeof body.data.summary.totalServedToday, 'number');
      assert.ok(Array.isArray(body.data.doctorStations));
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 1 Security Hardening Tests: Cross-Hospital Authorization
    // ─────────────────────────────────────────────────────────────────────────

    let adminTokenB = '';
    let hospitalIdB = '';
    let departmentIdB = '';
    let doctorIdB = '';
    let tokenIdB = '';

    await t.test('SETUP: Register Hospital B and Doctor B for security isolation tests', async () => {
      const tsB = Date.now() + 1;
      const regRes = await fetch(`${baseUrl}/api/v1/hospital/register-hospital`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalName: `Fortis Care Health ${tsB}`,
          registrationNumber: `REG-MAH-${tsB}`,
          hospitalType: 'Multi-Specialty',
          phone: '9820987654',
          email: `admin_${tsB}@fortiscare.org`,
          address: '100 Central Road, Andheri',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400069',
          facilities: ['Emergency', 'ICU', 'Cardiology'],
          adminName: 'Dr. Neha Sharma',
          adminEmail: `neha_${tsB}@fortiscare.org`,
          adminPassword: 'Password123!',
          adminPhone: '9820987654',
        }),
      });
      assert.strictEqual(regRes.status, 201);
      const regBody = await regRes.json();
      adminTokenB = regBody.data.token;
      hospitalIdB = regBody.data.hospital.id;

      // Create department in Hospital B
      const deptRes = await fetch(`${baseUrl}/api/v1/hospital/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenB}`,
        },
        body: JSON.stringify({
          name: 'Orthopedics',
          code: 'ORTH',
          floorRoom: 'Wing B Room 102',
        }),
      });
      assert.strictEqual(deptRes.status, 201);
      const deptBody = await deptRes.json();
      departmentIdB = deptBody.data.department.id;

      // Create doctor in Hospital B
      const docRes = await fetch(`${baseUrl}/api/v1/hospital/doctors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenB}`,
        },
        body: JSON.stringify({
          departmentId: departmentIdB,
          name: 'Dr. Rajesh Khanna',
          qualification: 'MS Orthopedics',
          specialization: 'Joint Replacement',
          roomNumber: 'B-102',
          consultationDuration: 20,
        }),
      });
      assert.strictEqual(docRes.status, 201);
      const docBody = await docRes.json();
      doctorIdB = docBody.data.doctor.id;

      // Patient books token in Hospital B
      const tokRes = await fetch(`${baseUrl}/api/v1/hospital/token/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId: hospitalIdB,
          doctorId: doctorIdB,
          patientName: 'Rohan Verma',
          patientPhone: '9820112233',
          patientAge: 40,
          patientGender: 'Male',
        }),
      });
      assert.strictEqual(tokRes.status, 201);
      const tokBody = await tokRes.json();
      tokenIdB = tokBody.data.token.id;
    });

    await t.test('SECURITY: Hospital A cannot access Hospital B dashboard', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/dashboard?hospitalId=${hospitalIdB}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      const errMsg = (body.message || body.error || '').toLowerCase();
      assert.ok(errMsg.includes('not authorized'), `Expected unauthorized message, got: ${errMsg}`);
    });

    await t.test('SECURITY: Hospital A cannot call next patient for Hospital B doctor', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/queue/next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          doctorId: doctorIdB,
        }),
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });

    await t.test('SECURITY: Hospital A cannot complete consultation for Hospital B doctor', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/queue/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          doctorId: doctorIdB,
        }),
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });

    await t.test('SECURITY: Hospital A cannot skip token for Hospital B doctor', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/queue/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          doctorId: doctorIdB,
          tokenId: tokenIdB,
        }),
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });

    await t.test('SECURITY: Hospital A cannot toggle Hospital B doctor queue', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/queue/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          doctorId: doctorIdB,
          isOpen: false,
        }),
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });

    await t.test('SECURITY: Hospital A cannot add doctor to Hospital B department', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/doctors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          departmentId: departmentIdB,
          name: 'Dr. Intruder',
          qualification: 'MBBS',
          roomNumber: '99',
        }),
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });

    await t.test('SECURITY: Hospital A cannot update Hospital B department', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/departments/${departmentIdB}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Hacked Department Name',
        }),
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });

    await t.test('SECURITY: Non-hospital business user cannot access hospital operator routes (missing hospital ownership returns 403)', async () => {
      const tsNonHosp = Date.now() + 2;
      const nonHospBizRes = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Salon Owner',
          email: `salon_${tsNonHosp}@example.com`,
          phone: '9820556677',
          password: 'Password123!',
          businessName: 'Glamour Salon',
          category: 'salon',
          city: 'Mumbai',
        }),
      });
      assert.strictEqual(nonHospBizRes.status, 201);
      const nonHospBizBody = await nonHospBizRes.json();
      const nonHospToken = nonHospBizBody.data.token;

      const res = await fetch(`${baseUrl}/api/v1/hospital/dashboard`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${nonHospToken}`,
        },
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });

    await t.test('SECURITY: Customer role is rejected from operator-only routes with 403', async () => {
      const tsCust = Date.now() + 3;
      const custRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Regular Customer',
          email: `customer_${tsCust}@example.com`,
          phone: '9820778899',
          password: 'Password123!',
        }),
      });
      assert.strictEqual(custRes.status, 201);
      const custBody = await custRes.json();
      const customerToken = custBody.data.token;

      const res = await fetch(`${baseUrl}/api/v1/hospital/dashboard`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });

    await t.test('SECURITY: Unauthenticated requests to operator-only routes return 401', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/dashboard`, {
        method: 'GET',
      });
      assert.strictEqual(res.status, 401);
    });

    await t.test('VERIFICATION: Hospital B operator can legitimately operate Hospital B queue & dashboard', async () => {
      // 1. Call next for Doctor B
      const callRes = await fetch(`${baseUrl}/api/v1/hospital/queue/next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenB}`,
        },
        body: JSON.stringify({ doctorId: doctorIdB }),
      });
      assert.strictEqual(callRes.status, 200);
      const callBody = await callRes.json();
      assert.strictEqual(callBody.success, true);
      assert.strictEqual(callBody.data.token.id, tokenIdB);
      assert.strictEqual(callBody.data.token.status, 'SERVING');

      // 2. Complete consultation for Doctor B
      const compRes = await fetch(`${baseUrl}/api/v1/hospital/queue/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminTokenB}`,
        },
        body: JSON.stringify({ doctorId: doctorIdB }),
      });
      assert.strictEqual(compRes.status, 200);
      const compBody = await compRes.json();
      assert.strictEqual(compBody.success, true);
      assert.strictEqual(compBody.data.token.status, 'SERVED');

      // 3. Hospital B dashboard reflects Hospital B data only
      const dashRes = await fetch(`${baseUrl}/api/v1/hospital/dashboard`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminTokenB}`,
        },
      });
      assert.strictEqual(dashRes.status, 200);
      const dashBody = await dashRes.json();
      assert.strictEqual(dashBody.success, true);
      assert.strictEqual(dashBody.data.hospital.id, hospitalIdB);
      assert.strictEqual(dashBody.data.summary.totalServedToday, 1);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 1 Security Review: Strict Database Relationship Ownership Tests
    // ─────────────────────────────────────────────────────────────────────────

    await t.test('SECURITY: User A cannot access Hospital B by placing Hospital B ID in hospitalId claim', async () => {
      // Forged token: Authenticated user is User A, but hospitalId claim is set to Hospital B
      const forgedHospitalIdToken = jwt.sign(
        {
          userId: adminUserIdA,
          email: 'vikram@apollocare.org',
          role: 'BUSINESS',
          businessId: hospitalId,
          hospitalId: hospitalIdB,
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await fetch(`${baseUrl}/api/v1/hospital/dashboard`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${forgedHospitalIdToken}`,
        },
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      const errMsg = (body.message || body.error || '').toLowerCase();
      assert.ok(errMsg.includes('not have administrative access') || errMsg.includes('not authorized'));
    });

    await t.test('SECURITY: User A cannot access Hospital B by placing Hospital B ID in businessId claim', async () => {
      // Forged token: Authenticated user is User A, but businessId claim is set to Hospital B
      const forgedBusinessIdToken = jwt.sign(
        {
          userId: adminUserIdA,
          email: 'vikram@apollocare.org',
          role: 'BUSINESS',
          businessId: hospitalIdB,
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await fetch(`${baseUrl}/api/v1/hospital/dashboard`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${forgedBusinessIdToken}`,
        },
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      const errMsg = (body.message || body.error || '').toLowerCase();
      assert.ok(errMsg.includes('not have administrative access') || errMsg.includes('not authorized'));
    });

    await t.test('SECURITY: User with no verified hospital ownership receives 403', async () => {
      // Token: User exists, role is BUSINESS, but user does not own any hospital in the database
      const unownedUserToken = jwt.sign(
        {
          userId: 'user-without-hospital-99999',
          email: 'unowned@example.com',
          role: 'BUSINESS',
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await fetch(`${baseUrl}/api/v1/hospital/dashboard`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${unownedUserToken}`,
        },
      });

      assert.strictEqual(res.status, 403);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      const errMsg = (body.message || body.error || '').toLowerCase();
      assert.ok(errMsg.includes('not have administrative access') || errMsg.includes('not authorized'));
    });

    await t.test('SECURITY: Legitimate Hospital A operator can still access Hospital A dashboard', async () => {
      const res = await fetch(`${baseUrl}/api/v1/hospital/dashboard`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.hospital.id, hospitalId);
      assert.ok(body.data.summary);
      assert.ok(Array.isArray(body.data.doctorStations));
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 2: Hospital OPD Atomic Token Creation & Transaction Safety
    // ─────────────────────────────────────────────────────────────────────────

    await t.test('ATOMIC: Concurrent OPD token requests allocate unique, monotonic sequence numbers', async () => {
      // Ensure the doctor queue is open before testing concurrent joins
      await fetch(`${baseUrl}/api/v1/hospital/queue/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          hospitalId,
          doctorId,
          isOpen: true,
        }),
      });

      const phones = ['9820011111', '9820011112', '9820011113', '9820011114'];
      const names = ['Patient Alpha', 'Patient Beta', 'Patient Gamma', 'Patient Delta'];
      const promises = phones.map((phone, idx) =>
        fetch(`${baseUrl}/api/v1/hospital/token/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hospitalId,
            doctorId,
            patientName: names[idx],
            patientPhone: phone,
            patientAge: 25 + idx,
            patientGender: 'Female',
          }),
        }).then((r) => r.json())
      );

      const results = await Promise.all(promises);
      results.forEach((r) => {
        assert.strictEqual(r.success, true);
        assert.ok(r.data.token.token_number);
        assert.ok(r.data.token.sequence_number);
      });

      const tokenNumbers = results.map((r) => r.data.token.token_number);
      const uniqueNumbers = new Set(tokenNumbers);
      assert.strictEqual(uniqueNumbers.size, tokenNumbers.length, 'Every concurrent token must have a unique token number');

      const sequences = results.map((r) => r.data.token.sequence_number).sort((a, b) => a - b);
      // Verify strictly monotonic ordering
      for (let i = 1; i < sequences.length; i++) {
        assert.ok(sequences[i] > sequences[i - 1], 'Sequences must be strictly monotonic');
      }
    });

    await t.test('ATOMIC: Failed OPD token creation rolls back doctor queue sequence in mock store', async () => {
      const queue = await findDoctorQueueByDoctorId(doctorId);
      const seqBefore = queue.current_sequence;

      let threw = false;
      try {
        await createHospitalToken({
          queueId: queue.id,
          hospitalId,
          doctorId,
          departmentId,
          patientCode: 'PAT-SIM-FAIL',
          get patientName() {
            throw new Error('Simulated failure during hospital token insert');
          },
          patientPhone: '9820099999',
        });
      } catch (err) {
        threw = true;
        assert.ok(err.message.includes('Simulated failure'));
      }

      assert.strictEqual(threw, true, 'createHospitalToken should have thrown');
      const queueAfter = await findDoctorQueueByDoctorId(doctorId);
      assert.strictEqual(
        queueAfter.current_sequence,
        seqBefore,
        'Doctor queue sequence number must be rolled back upon creation failure'
      );
    });

    await t.test('ATOMIC: PostgreSQL Transaction executes BEGIN, FOR UPDATE lock, and COMMIT with client release', async () => {
      const log = [];
      let released = false;
      const queue = await findDoctorQueueByDoctorId(doctorId);

      const mockClient = {
        query: async (sql, params) => {
          const normSql = sql.replace(/\s+/g, ' ').trim();
          log.push({ sql: normSql, params });
          if (normSql.includes('SELECT id, token_prefix, current_sequence, is_open, max_daily_capacity FROM doctor_queues')) {
            return {
              rows: [{ id: queue.id, token_prefix: 'H', current_sequence: 10, is_open: true, max_daily_capacity: 100 }],
            };
          }
          if (normSql.includes('SELECT id, token_number FROM hospital_tokens WHERE queue_id = $1 AND patient_phone = $2')) {
            return { rows: [] };
          }
          if (normSql.includes('SELECT COUNT(*)::int as waiting_count FROM hospital_tokens')) {
            return { rows: [{ waiting_count: 3 }] };
          }
          if (normSql.includes('UPDATE doctor_queues SET current_sequence = current_sequence + 1')) {
            return { rows: [{ current_sequence: 11 }] };
          }
          if (normSql.includes('INSERT INTO hospital_tokens')) {
            return {
              rows: [{
                id: 'htok-pg-test-1',
                queue_id: queue.id,
                token_number: 'H-11',
                sequence_number: 11,
                status: 'WAITING',
                position: 4,
              }],
            };
          }
          return { rows: [] };
        },
        release: () => {
          released = true;
          log.push({ action: 'RELEASE' });
        },
      };

      setCustomHospitalClientHandler(() => mockClient);
      try {
        const token = await createHospitalToken({
          queueId: queue.id,
          hospitalId: 'a0000000-0000-0000-0000-000000000001',
          doctorId: 'b0000000-0000-0000-0000-000000000002',
          departmentId: 'c0000000-0000-0000-0000-000000000003',
          patientName: 'PG Hospital Patient',
          patientPhone: '9820011999',
          patientCode: 'PAT-PG-1',
        });

        assert.ok(token);
        assert.strictEqual(token.token_number, 'H-11');
        assert.strictEqual(token.sequence_number, 11);
        assert.strictEqual(released, true, 'Database client must be released in finally');

        const sqlStatements = log.map((entry) => entry.sql || entry.action);
        assert.strictEqual(sqlStatements[0], 'BEGIN');
        assert.ok(sqlStatements[1].includes('doctor_queues') && sqlStatements[1].includes('FOR UPDATE'));
        assert.ok(sqlStatements[2].includes('hospital_tokens') && sqlStatements[2].includes('FOR UPDATE'));
        assert.ok(sqlStatements[3].includes('SELECT COUNT(*)'));
        assert.ok(sqlStatements[4].includes('UPDATE doctor_queues'));
        assert.ok(sqlStatements[5].includes('INSERT INTO hospital_tokens'));
        assert.strictEqual(sqlStatements[6], 'COMMIT');
        assert.strictEqual(sqlStatements[7], 'RELEASE');
      } finally {
        setCustomHospitalClientHandler(null);
      }
    });

    await t.test('ATOMIC: PostgreSQL Transaction triggers ROLLBACK on insertion error and releases client (no permanent lock)', async () => {
      const log = [];
      let released = false;
      const queue = await findDoctorQueueByDoctorId(doctorId);

      const mockClient = {
        query: async (sql, params) => {
          const normSql = sql.replace(/\s+/g, ' ').trim();
          log.push({ sql: normSql, params });
          if (normSql.includes('SELECT id, token_prefix, current_sequence, is_open, max_daily_capacity FROM doctor_queues')) {
            return {
              rows: [{ id: queue.id, token_prefix: 'H', current_sequence: 15, is_open: true, max_daily_capacity: 100 }],
            };
          }
          if (normSql.includes('SELECT id, token_number FROM hospital_tokens WHERE queue_id = $1 AND patient_phone = $2')) {
            return { rows: [] };
          }
          if (normSql.includes('SELECT COUNT(*)::int as waiting_count FROM hospital_tokens')) {
            return { rows: [{ waiting_count: 5 }] };
          }
          if (normSql.includes('UPDATE doctor_queues SET current_sequence = current_sequence + 1')) {
            return { rows: [{ current_sequence: 16 }] };
          }
          if (normSql.includes('INSERT INTO hospital_tokens')) {
            throw new Error('Simulated database write failure on hospital_tokens insertion');
          }
          return { rows: [] };
        },
        release: () => {
          released = true;
          log.push({ action: 'RELEASE' });
        },
      };

      setCustomHospitalClientHandler(() => mockClient);
      try {
        let threw = false;
        try {
          await createHospitalToken({
            queueId: queue.id,
            hospitalId: 'a0000000-0000-0000-0000-000000000001',
            doctorId: 'b0000000-0000-0000-0000-000000000002',
            departmentId: 'c0000000-0000-0000-0000-000000000003',
            patientName: 'PG Error Patient',
            patientPhone: '9820011888',
            patientCode: 'PAT-PG-2',
          });
        } catch (err) {
          threw = true;
          assert.ok(err.message.includes('Simulated database write failure'));
        }

        assert.strictEqual(threw, true, 'Error should be thrown');
        assert.strictEqual(released, true, 'Client must be released even after error (no permanent lock)');

        const sqlStatements = log.map((entry) => entry.sql || entry.action);
        assert.strictEqual(sqlStatements[0], 'BEGIN');
        assert.ok(sqlStatements[1].includes('FOR UPDATE'));
        assert.ok(sqlStatements.includes('ROLLBACK'), 'Must execute ROLLBACK on insertion failure');
        assert.strictEqual(sqlStatements[sqlStatements.length - 1], 'RELEASE', 'Client must be released in finally');
      } finally {
        setCustomHospitalClientHandler(null);
      }
    });
  } finally {
    server.close();
  }
});
