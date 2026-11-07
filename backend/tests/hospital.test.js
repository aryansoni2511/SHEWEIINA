import test from 'node:test';
import assert from 'node:assert';
import app from '../app.js';

test('Hospital Management & OPD Queue Test Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  let adminToken = '';
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
  } finally {
    server.close();
  }
});
