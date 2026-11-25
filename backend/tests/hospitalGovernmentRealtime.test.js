import test from 'node:test';
import assert from 'node:assert';
import http from 'http';
import app from '../app.js';
import realtimeService from '../services/realtimeService.js';

test('Phase 4.2.2 Hospital & Government Real-Time SSE Integration Test Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const ts = Date.now();
  const pass = 'Password123!';

  let hospAdminToken = '';
  let hospitalId = '';
  let doctorId = '';

  let govtAdminToken = '';
  let centreId = '';
  let counterId = '';
  let serviceId = '';

  function connectSSEClient({ ticket }) {
    let resolveReady;
    const ready = new Promise((resolve) => {
      resolveReady = resolve;
    });
    const events = [];
    const req = http.get(`${baseUrl}/api/v1/queue/stream?ticket=${ticket}`, (res) => {
      let buf = '';
      res.on('data', (chunk) => {
        buf += chunk.toString();
        const parts = buf.split('\n\n');
        buf = parts.pop();
        for (const part of parts) {
          let eventName = 'message';
          let dataStr = '';
          for (const line of part.split('\n')) {
            if (line.startsWith('event: ')) eventName = line.slice(7).trim();
            else if (line.startsWith('data: ')) dataStr = line.slice(6);
          }
          if (eventName === 'connected') {
            resolveReady();
          }
          if (dataStr) {
            try {
              events.push({ event: eventName, data: JSON.parse(dataStr) });
            } catch (_) {
              events.push({ event: eventName, data: dataStr });
            }
          }
        }
      });
    });
    return {
      ready,
      events,
      close: () => req.destroy(),
    };
  }

  try {
    // ----------------------------------------------------------------------------------
    // Setup 1: Hospital, Department & Doctor
    // ----------------------------------------------------------------------------------
    const hospRegRes = await fetch(`${baseUrl}/api/v1/hospital/register-hospital`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospitalName: `Realtime City Hospital ${ts}`,
        registrationNumber: `REG-HOSP-${ts}`,
        hospitalType: 'Multi-Specialty',
        phone: '9820112233',
        email: `hosp_${ts}@shewwina.org`,
        address: '100 Health Avenue',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        facilities: ['OPD', 'Emergency'],
        adminName: 'Dr. Admin',
        adminEmail: `admin_hosp_${ts}@shewwina.org`,
        adminPassword: pass,
        adminPhone: '9820112233',
      }),
    });
    const hospRegData = await hospRegRes.json();
    assert.strictEqual(hospRegRes.status, 201);
    hospAdminToken = hospRegData.data.token;
    hospitalId = hospRegData.data.hospital.id;

    // Create doctor
    const docRes = await fetch(`${baseUrl}/api/v1/hospital/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hospAdminToken}`,
      },
      body: JSON.stringify({
        hospitalId,
        departmentId: hospRegData.data.starterDepartments[0].id,
        name: 'Dr. Vivek Sengupta',
        qualification: 'MBBS, MD',
        specialization: 'Physician',
        roomNumber: 'Cabin 101',
        consultationFee: 500,
        availability: 'Mon-Sat',
      }),
    });
    const docData = await docRes.json();
    assert.strictEqual(docRes.status, 201);
    doctorId = docData.data.doctor.id;

    // ----------------------------------------------------------------------------------
    // Setup 2: Government Kendra, Counter & Service
    // ----------------------------------------------------------------------------------
    const govtRegRes = await fetch(`${baseUrl}/api/v1/government/register-centre`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        centreName: `Realtime Citizen Kendra ${ts}`,
        centreCode: `MSK-RT-${ts}`,
        centreType: 'Maha E-Seva Kendra',
        phone: '9820223344',
        email: `kendra_${ts}@shewwina.org`,
        address: '200 Civic Center',
        city: 'Mumbai',
        district: 'Mumbai City',
        state: 'Maharashtra',
        pincode: '400028',
        supportedCategories: ['Aadhaar', 'Passport'],
        adminName: 'Kendra Officer',
        adminEmail: `admin_kendra_${ts}@shewwina.org`,
        adminPassword: pass,
        adminPhone: '9820223344',
      }),
    });
    const govtRegData = await govtRegRes.json();
    assert.strictEqual(govtRegRes.status, 201);
    govtAdminToken = govtRegData.data.token;
    centreId = govtRegData.data.centre.id;

    // Get a government service ID
    const svcListRes = await fetch(`${baseUrl}/api/v1/government/services`);
    const svcListData = await svcListRes.json();
    serviceId = svcListData.data.services[0].id;

    // Create Counter
    const cntRes = await fetch(`${baseUrl}/api/v1/government/counters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${govtAdminToken}`,
      },
      body: JSON.stringify({
        counterNumber: 'Desk 1',
        counterName: 'Aadhaar Desk',
        supportedCategories: ['Aadhaar'],
      }),
    });
    const cntData = await cntRes.json();
    assert.strictEqual(cntRes.status, 201);
    counterId = cntData.data.counter.id;

    // ----------------------------------------------------------------------------------
    // Test 1: Hospital OPD Lifecycle Events (Join, Call, Complete, Skip, Cancel, Toggle)
    // ----------------------------------------------------------------------------------
    await t.test('1. Hospital OPD Lifecycle: Emits all 6 events with zero PII and correct top-level tokenId', async () => {
      const captured = [];
      const original = realtimeService.broadcastQueueEvent;
      realtimeService.broadcastQueueEvent = (opt) => {
        captured.push(opt);
        return original.call(realtimeService, opt);
      };

      try {
        // Register customer for patient 3 (to test authenticated cancellation)
        const hospCusRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Anand Patel',
            email: `patient3_${ts}@shewwina.org`,
            phone: '9988334455',
            password: pass,
          }),
        });
        const hospCusData = await hospCusRes.json();
        assert.strictEqual(hospCusRes.status, 201);
        const hospCusToken = hospCusData.data.token;

        // A. HOSPITAL_PATIENT_JOINED
        const join1Res = await fetch(`${baseUrl}/api/v1/hospital/token/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hospitalId,
            doctorId,
            patientName: 'Kavita Verma',
            patientPhone: '9988112233',
            patientAge: 32,
            patientGender: 'Female',
          }),
        });
        const join1Data = await join1Res.json();
        assert.strictEqual(join1Res.status, 201);
        const token1Id = join1Data.data.token.id;

        // B. HOSPITAL_PATIENT_CALLED
        const callRes = await fetch(`${baseUrl}/api/v1/hospital/queue/next`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${hospAdminToken}`,
          },
          body: JSON.stringify({ doctorId }),
        });
        assert.strictEqual(callRes.status, 200);

        // C. HOSPITAL_CONSULTATION_COMPLETED
        const compRes = await fetch(`${baseUrl}/api/v1/hospital/queue/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${hospAdminToken}`,
          },
          body: JSON.stringify({ doctorId }),
        });
        assert.strictEqual(compRes.status, 200);

        // Patient 2 for SKIP
        const join2Res = await fetch(`${baseUrl}/api/v1/hospital/token/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hospitalId,
            doctorId,
            patientName: 'Rohan Sharma',
            patientPhone: '9988223344',
          }),
        });
        const token2Id = (await join2Res.json()).data.token.id;

        // D. HOSPITAL_PATIENT_SKIPPED
        const skipRes = await fetch(`${baseUrl}/api/v1/hospital/queue/skip`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${hospAdminToken}`,
          },
          body: JSON.stringify({ doctorId, tokenId: token2Id }),
        });
        assert.strictEqual(skipRes.status, 200);

        // Patient 3 for CANCEL
        const join3Res = await fetch(`${baseUrl}/api/v1/hospital/token/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${hospCusToken}`,
          },
          body: JSON.stringify({
            hospitalId,
            doctorId,
            patientName: 'Anand Patel',
            patientPhone: '9988334455',
          }),
        });
        const token3Id = (await join3Res.json()).data.token.id;

        // E. HOSPITAL_TOKEN_CANCELLED via universal queue cancel (with customer auth)
        const cancelRes = await fetch(`${baseUrl}/api/v1/queue/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${hospCusToken}`,
          },
          body: JSON.stringify({ tokenId: token3Id }),
        });
        assert.strictEqual(cancelRes.status, 200);

        // F. HOSPITAL_QUEUE_UPDATED
        const toggleRes = await fetch(`${baseUrl}/api/v1/hospital/queue/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${hospAdminToken}`,
          },
          body: JSON.stringify({ doctorId, isOpen: false }),
        });
        assert.strictEqual(toggleRes.status, 200);

        // Verify all 6 events were emitted
        const types = captured.map((c) => c.type);
        assert.ok(types.includes('HOSPITAL_PATIENT_JOINED'));
        assert.ok(types.includes('HOSPITAL_PATIENT_CALLED'));
        assert.ok(types.includes('HOSPITAL_CONSULTATION_COMPLETED'));
        assert.ok(types.includes('HOSPITAL_PATIENT_SKIPPED'));
        assert.ok(types.includes('HOSPITAL_TOKEN_CANCELLED'));
        assert.ok(types.includes('HOSPITAL_QUEUE_UPDATED'));

        // Verify top-level tokenId
        const joinEvt = captured.find((c) => c.type === 'HOSPITAL_PATIENT_JOINED');
        assert.strictEqual(joinEvt.tokenId, token1Id);
        assert.strictEqual(joinEvt.module, 'hospital');

        const callEvt = captured.find((c) => c.type === 'HOSPITAL_PATIENT_CALLED');
        assert.strictEqual(callEvt.tokenId, token1Id);
        assert.strictEqual(callEvt.module, 'hospital');

        const skipEvt = captured.find((c) => c.type === 'HOSPITAL_PATIENT_SKIPPED');
        assert.strictEqual(skipEvt.tokenId, token2Id);
        assert.strictEqual(skipEvt.module, 'hospital');

        const cancelEvt = captured.find((c) => c.type === 'HOSPITAL_TOKEN_CANCELLED');
        assert.strictEqual(cancelEvt.tokenId, token3Id);
        assert.strictEqual(cancelEvt.module, 'hospital');

        // Zero-PII check
        for (const item of captured) {
          const s = JSON.stringify(item);
          assert.ok(!s.includes('Kavita Verma'), 'PII Leak: Patient name in broadcast');
          assert.ok(!s.includes('9988112233'), 'PII Leak: Patient phone in broadcast');
          assert.ok(!s.includes('Rohan Sharma'), 'PII Leak: Patient name in broadcast');
          assert.ok(!s.includes('Anand Patel'), 'PII Leak: Patient name in broadcast');
        }
      } finally {
        realtimeService.broadcastQueueEvent = original;
      }
    });

    // ----------------------------------------------------------------------------------
    // Test 2: Government Services Lifecycle Events (Join, Call, Complete, Skip, Cancel, Toggle)
    // ----------------------------------------------------------------------------------
    await t.test('2. Government Kendra Lifecycle: Emits all 6 events with zero PII and correct top-level tokenId', async () => {
      const captured = [];
      const original = realtimeService.broadcastQueueEvent;
      realtimeService.broadcastQueueEvent = (opt) => {
        captured.push(opt);
        return original.call(realtimeService, opt);
      };

      try {
        // Register customer for citizen 3 (to test authenticated cancellation)
        const govtCusRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Vikram Mehta',
            email: `citizen3_${ts}@shewwina.org`,
            phone: '9977334455',
            password: pass,
          }),
        });
        const govtCusData = await govtCusRes.json();
        assert.strictEqual(govtCusRes.status, 201);
        const govtCusToken = govtCusData.data.token;

        // A. GOVERNMENT_CITIZEN_JOINED
        const join1Res = await fetch(`${baseUrl}/api/v1/government/token/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            centreId,
            serviceId,
            citizenName: 'Deepak Joshi',
            citizenPhone: '9977112233',
          }),
        });
        const join1Data = await join1Res.json();
        assert.strictEqual(join1Res.status, 201);
        const gToken1Id = join1Data.data.token.id;
        const activeCounterId = join1Data.data.token.counter_id || counterId;

        // B. GOVERNMENT_CITIZEN_CALLED
        const callRes = await fetch(`${baseUrl}/api/v1/government/queue/next`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${govtAdminToken}`,
          },
          body: JSON.stringify({ counterId: activeCounterId }),
        });
        assert.strictEqual(callRes.status, 200);

        // C. GOVERNMENT_SERVICE_COMPLETED
        const compRes = await fetch(`${baseUrl}/api/v1/government/queue/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${govtAdminToken}`,
          },
          body: JSON.stringify({ tokenId: gToken1Id }),
        });
        assert.strictEqual(compRes.status, 200);

        // Citizen 2 for SKIP
        const join2Res = await fetch(`${baseUrl}/api/v1/government/token/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            centreId,
            serviceId,
            citizenName: 'Sneha Deshmukh',
            citizenPhone: '9977223344',
          }),
        });
        const gToken2Id = (await join2Res.json()).data.token.id;

        // D. GOVERNMENT_CITIZEN_SKIPPED
        const skipRes = await fetch(`${baseUrl}/api/v1/government/queue/skip`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${govtAdminToken}`,
          },
          body: JSON.stringify({ tokenId: gToken2Id }),
        });
        assert.strictEqual(skipRes.status, 200);

        // Citizen 3 for CANCEL
        const join3Res = await fetch(`${baseUrl}/api/v1/government/token/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            centreId,
            serviceId,
            citizenName: 'Vikram Mehta',
            citizenPhone: '9977334455',
          }),
        });
        const gToken3Id = (await join3Res.json()).data.token.id;

        // E. GOVERNMENT_TOKEN_CANCELLED via universal queue cancel (with customer auth)
        const cancelRes = await fetch(`${baseUrl}/api/v1/queue/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${govtCusToken}`,
          },
          body: JSON.stringify({ tokenId: gToken3Id }),
        });
        assert.strictEqual(cancelRes.status, 200);

        // F. GOVERNMENT_QUEUE_UPDATED
        const toggleRes = await fetch(`${baseUrl}/api/v1/government/counters/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${govtAdminToken}`,
          },
          body: JSON.stringify({ counterId: activeCounterId, isOpen: false }),
        });
        assert.strictEqual(toggleRes.status, 200);

        // Verify all 6 events were emitted
        const types = captured.map((c) => c.type);
        assert.ok(types.includes('GOVERNMENT_CITIZEN_JOINED'));
        assert.ok(types.includes('GOVERNMENT_CITIZEN_CALLED'));
        assert.ok(types.includes('GOVERNMENT_SERVICE_COMPLETED'));
        assert.ok(types.includes('GOVERNMENT_CITIZEN_SKIPPED'));
        assert.ok(types.includes('GOVERNMENT_TOKEN_CANCELLED'));
        assert.ok(types.includes('GOVERNMENT_QUEUE_UPDATED'));

        // Verify top-level tokenId
        const joinEvt = captured.find((c) => c.type === 'GOVERNMENT_CITIZEN_JOINED');
        assert.strictEqual(joinEvt.tokenId, gToken1Id);
        assert.strictEqual(joinEvt.module, 'government');

        const callEvt = captured.find((c) => c.type === 'GOVERNMENT_CITIZEN_CALLED');
        assert.strictEqual(callEvt.tokenId, gToken1Id);
        assert.strictEqual(callEvt.module, 'government');

        const skipEvt = captured.find((c) => c.type === 'GOVERNMENT_CITIZEN_SKIPPED');
        assert.strictEqual(skipEvt.tokenId, gToken2Id);
        assert.strictEqual(skipEvt.module, 'government');

        const cancelEvt = captured.find((c) => c.type === 'GOVERNMENT_TOKEN_CANCELLED');
        assert.strictEqual(cancelEvt.tokenId, gToken3Id);
        assert.strictEqual(cancelEvt.module, 'government');

        // Zero-PII check
        for (const item of captured) {
          const s = JSON.stringify(item);
          assert.ok(!s.includes('Deepak Joshi'), 'PII Leak: Citizen name in broadcast');
          assert.ok(!s.includes('9977112233'), 'PII Leak: Citizen phone in broadcast');
          assert.ok(!s.includes('Sneha Deshmukh'), 'PII Leak: Citizen name in broadcast');
          assert.ok(!s.includes('Vikram Mehta'), 'PII Leak: Citizen name in broadcast');
        }
      } finally {
        realtimeService.broadcastQueueEvent = original;
      }
    });

    // ----------------------------------------------------------------------------------
    // Test 3: Customer-Specific Event Delivery & Module Isolation
    // ----------------------------------------------------------------------------------
    await t.test('3. Real-Time Delivery: Customer A receives only their event; Hospital never receives Government', async () => {
      // Connect customer A (Hospital operator)
      const ticketRes = await fetch(`${baseUrl}/api/v1/queue/stream-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${hospAdminToken}`, // operator can issue tickets
        },
        body: JSON.stringify({ businessId: hospitalId }),
      });
      const ticketData = await ticketRes.json();
      assert.strictEqual(ticketRes.status, 200);
      const hospOpTicket = ticketData.data.ticket;

      // Connect Kendra operator ticket
      const kTicketRes = await fetch(`${baseUrl}/api/v1/queue/stream-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${govtAdminToken}`,
        },
        body: JSON.stringify({ businessId: centreId }),
      });
      const kTicketData = await kTicketRes.json();
      assert.strictEqual(kTicketRes.status, 200);
      const govtOpTicket = kTicketData.data.ticket;

      const hospClient = connectSSEClient({ ticket: hospOpTicket });
      const govtClient = connectSSEClient({ ticket: govtOpTicket });

      await Promise.all([hospClient.ready, govtClient.ready]);

      // Broadcast a Hospital OPD event
      realtimeService.broadcastQueueEvent({
        businessId: hospitalId,
        type: 'HOSPITAL_PATIENT_CALLED',
        module: 'hospital',
        data: { tokenNumber: 'OPD-999' },
      });

      // Broadcast a Government Kendra event
      realtimeService.broadcastQueueEvent({
        businessId: centreId,
        type: 'GOVERNMENT_CITIZEN_CALLED',
        module: 'government',
        data: { tokenNumber: 'GOV-999' },
      });

      // Wait 100ms for SSE delivery
      await new Promise((r) => setTimeout(r, 100));

      hospClient.close();
      govtClient.close();

      const hospEvents = hospClient.events.map((e) => e.data.type);
      const govtEvents = govtClient.events.map((e) => e.data.type);

      // Verify Hospital operator received HOSPITAL_PATIENT_CALLED and NOT GOVERNMENT_CITIZEN_CALLED
      assert.ok(hospEvents.includes('HOSPITAL_PATIENT_CALLED'), 'Hospital operator should receive hospital event');
      assert.ok(!hospEvents.includes('GOVERNMENT_CITIZEN_CALLED'), 'Hospital operator must NOT receive govt event');

      // Verify Government operator received GOVERNMENT_CITIZEN_CALLED and NOT HOSPITAL_PATIENT_CALLED
      assert.ok(govtEvents.includes('GOVERNMENT_CITIZEN_CALLED'), 'Kendra operator should receive govt event');
      assert.ok(!govtEvents.includes('HOSPITAL_PATIENT_CALLED'), 'Kendra operator must NOT receive hospital event');
    });

  } finally {
    server.close();
  }
});
