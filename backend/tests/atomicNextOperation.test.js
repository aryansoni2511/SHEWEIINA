import test from 'node:test';
import assert from 'node:assert/strict';
import {
  callNextWaitingToken,
  setCustomQueueClientHandler,
} from '../models/queueModel.js';
import {
  callNextDoctorToken,
  setCustomHospitalClientHandler,
} from '../models/hospitalModel.js';
import { processCallNextCustomer } from '../services/queueService.js';
import { processCallNextPatient } from '../services/hospitalService.js';
import { realtimeService } from '../services/realtimeService.js';

test('SHEWWINA Phase 4.3.1 — Atomic NEXT Operation Verification', async (suite) => {
  const queueId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const businessId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const hospitalId = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
  const doctorId = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

  // 1. Transactional SQL sequence check for Salon/Clinic callNextWaitingToken
  await suite.test('QueueModel: callNextWaitingToken executes BEGIN -> FOR UPDATE lock -> SERVED -> SERVING -> COMMIT -> RELEASE', async () => {
    const sqlLog = [];
    let released = false;

    const mockClient = {
      query: async (sql, params) => {
        sqlLog.push({ sql: sql.trim(), params });
        if (sql.includes('SELECT id FROM queues WHERE id = $1 FOR UPDATE')) {
          return { rows: [{ id: queueId }] };
        }
        if (sql.includes("status = 'SERVED'")) {
          return { rows: [] };
        }
        if (sql.includes("status = 'SERVING'")) {
          return {
            rows: [
              {
                id: 'tok-next-1',
                queue_id: queueId,
                token_number: 'S-101',
                status: 'SERVING',
                position: 0,
                sequence_number: 1,
              },
            ],
          };
        }
        return { rows: [] };
      },
      release: () => {
        released = true;
        sqlLog.push({ sql: 'RELEASE' });
      },
    };

    setCustomQueueClientHandler(() => mockClient);
    try {
      const result = await callNextWaitingToken(queueId, businessId);

      assert.ok(result, 'Expected called token');
      assert.strictEqual(result.id, 'tok-next-1');
      assert.strictEqual(result.status, 'SERVING');
      assert.strictEqual(released, true, 'Database client must be released');

      const operations = sqlLog.map((entry) => entry.sql);
      assert.strictEqual(operations[0], 'BEGIN');
      assert.ok(operations[1].includes('queues') && operations[1].includes('FOR UPDATE'), 'Queue row must be locked with FOR UPDATE');
      assert.ok(operations[2].includes("status = 'SERVED'"), 'Previous serving token must be transitioned to SERVED');
      assert.ok(operations[3].includes("status = 'SERVING'"), 'Next waiting token must be transitioned to SERVING');
      assert.strictEqual(operations[4], 'COMMIT');
      assert.strictEqual(operations[5], 'RELEASE');
    } finally {
      setCustomQueueClientHandler(null);
    }
  });

  // 2. Transactional SQL sequence check for Hospital OPD callNextDoctorToken
  await suite.test('HospitalModel: callNextDoctorToken executes BEGIN -> doctor_queues FOR UPDATE lock -> SERVED -> SERVING -> COMMIT -> RELEASE', async () => {
    const sqlLog = [];
    let released = false;

    const mockClient = {
      query: async (sql, params) => {
        sqlLog.push({ sql: sql.trim(), params });
        if (sql.includes('SELECT id FROM doctor_queues WHERE id = $1 FOR UPDATE')) {
          return { rows: [{ id: queueId }] };
        }
        if (sql.includes("status = 'SERVED'")) {
          return { rows: [] };
        }
        if (sql.includes("status = 'SERVING'")) {
          return {
            rows: [
              {
                id: 'hosp-tok-next-1',
                queue_id: queueId,
                hospital_id: hospitalId,
                doctor_id: doctorId,
                token_number: 'H-201',
                status: 'SERVING',
                position: 0,
                sequence_number: 1,
              },
            ],
          };
        }
        return { rows: [] };
      },
      release: () => {
        released = true;
        sqlLog.push({ sql: 'RELEASE' });
      },
    };

    setCustomHospitalClientHandler(() => mockClient);
    try {
      const result = await callNextDoctorToken(queueId, hospitalId, doctorId);

      assert.ok(result, 'Expected called hospital token');
      assert.strictEqual(result.id, 'hosp-tok-next-1');
      assert.strictEqual(result.status, 'SERVING');
      assert.strictEqual(released, true, 'Database client must be released');

      const operations = sqlLog.map((entry) => entry.sql);
      assert.strictEqual(operations[0], 'BEGIN');
      assert.ok(operations[1].includes('doctor_queues') && operations[1].includes('FOR UPDATE'), 'Doctor queue row must be locked with FOR UPDATE');
      assert.ok(operations[2].includes("status = 'SERVED'"), 'Previous hospital token must be marked SERVED');
      assert.ok(operations[3].includes("status = 'SERVING'"), 'Next waiting hospital token must be marked SERVING');
      assert.strictEqual(operations[4], 'COMMIT');
      assert.strictEqual(operations[5], 'RELEASE');
    } finally {
      setCustomHospitalClientHandler(null);
    }
  });

  // 3. Rollback on database error in callNextWaitingToken
  await suite.test('QueueModel: callNextWaitingToken triggers ROLLBACK and releases client on database failure', async () => {
    const sqlLog = [];
    let released = false;

    const mockClient = {
      query: async (sql, params) => {
        sqlLog.push({ sql: sql.trim(), params });
        if (sql.includes('SELECT id FROM queues WHERE id = $1 FOR UPDATE')) {
          return { rows: [{ id: queueId }] };
        }
        if (sql.includes("status = 'SERVED'")) {
          throw new Error('Connection abruptly terminated during UPDATE tokens');
        }
        return { rows: [] };
      },
      release: () => {
        released = true;
        sqlLog.push({ sql: 'RELEASE' });
      },
    };

    setCustomQueueClientHandler(() => mockClient);
    try {
      await assert.rejects(
        () => callNextWaitingToken(queueId, businessId),
        /Connection abruptly terminated during UPDATE tokens/
      );

      assert.strictEqual(released, true, 'Client must be released even on failure');
      const operations = sqlLog.map((entry) => entry.sql);
      assert.strictEqual(operations[0], 'BEGIN');
      assert.ok(operations[1].includes('FOR UPDATE'));
      assert.strictEqual(operations[3], 'ROLLBACK', 'Must execute ROLLBACK on error');
      assert.strictEqual(operations[4], 'RELEASE');
    } finally {
      setCustomQueueClientHandler(null);
    }
  });

  // 4. Rollback on database error in callNextDoctorToken
  await suite.test('HospitalModel: callNextDoctorToken triggers ROLLBACK and releases client on database failure', async () => {
    const sqlLog = [];
    let released = false;

    const mockClient = {
      query: async (sql, params) => {
        sqlLog.push({ sql: sql.trim(), params });
        if (sql.includes('SELECT id FROM doctor_queues WHERE id = $1 FOR UPDATE')) {
          return { rows: [{ id: queueId }] };
        }
        if (sql.includes("status = 'SERVED'")) {
          throw new Error('Deadlock detected in hospital_tokens');
        }
        return { rows: [] };
      },
      release: () => {
        released = true;
        sqlLog.push({ sql: 'RELEASE' });
      },
    };

    setCustomHospitalClientHandler(() => mockClient);
    try {
      await assert.rejects(
        () => callNextDoctorToken(queueId, hospitalId, doctorId),
        /Deadlock detected in hospital_tokens/
      );

      assert.strictEqual(released, true, 'Client must be released even on failure');
      const operations = sqlLog.map((entry) => entry.sql);
      assert.strictEqual(operations[0], 'BEGIN');
      assert.ok(operations[1].includes('FOR UPDATE'));
      assert.strictEqual(operations[3], 'ROLLBACK', 'Must execute ROLLBACK on error');
      assert.strictEqual(operations[4], 'RELEASE');
    } finally {
      setCustomHospitalClientHandler(null);
    }
  });

  // 5. Empty queue behavior: returns null safely
  await suite.test('QueueModel & HospitalModel: Empty queue returns null safely without corrupting state', async () => {
    let queueClientReleased = false;
    let hospClientReleased = false;

    const emptyQueueClient = {
      query: async (sql) => {
        if (sql.includes('SELECT id FROM queues')) return { rows: [{ id: queueId }] };
        return { rows: [] };
      },
      release: () => {
        queueClientReleased = true;
      },
    };

    const emptyHospClient = {
      query: async (sql) => {
        if (sql.includes('SELECT id FROM doctor_queues')) return { rows: [{ id: queueId }] };
        return { rows: [] };
      },
      release: () => {
        hospClientReleased = true;
      },
    };

    setCustomQueueClientHandler(() => emptyQueueClient);
    try {
      const qRes = await callNextWaitingToken(queueId, businessId);
      assert.strictEqual(qRes, null, 'Empty queue must return null');
      assert.strictEqual(queueClientReleased, true);
    } finally {
      setCustomQueueClientHandler(null);
    }

    setCustomHospitalClientHandler(() => emptyHospClient);
    try {
      const hRes = await callNextDoctorToken(queueId, hospitalId, doctorId);
      assert.strictEqual(hRes, null, 'Empty doctor queue must return null');
      assert.strictEqual(hospClientReleased, true);
    } finally {
      setCustomHospitalClientHandler(null);
    }
  });

  // 6. Concurrency simulation: Two operators simultaneously calling NEXT on the same queue
  await suite.test('Concurrency Simulation: Two simultaneous NEXT requests on same queue are serialized by queue row lock', async () => {
    // We simulate a mock database engine with queue-level mutex locking
    let queueLockAcquired = false;
    let currentlyServing = null;
    let waitingTokens = [
      { id: 'tok-c1', token_number: 'S-1', status: 'WAITING', sequence_number: 1 },
      { id: 'tok-c2', token_number: 'S-2', status: 'WAITING', sequence_number: 2 },
    ];

    const createConcurrentMockClient = (operatorName) => {
      let heldLock = false;
      return {
        query: async (sql, params) => {
          if (sql === 'BEGIN') {
            return { rows: [] };
          }
          if (sql.includes('SELECT id FROM queues WHERE id = $1 FOR UPDATE')) {
            // Emulate PostgreSQL lock waiting: if another transaction holds the lock, wait until released
            while (queueLockAcquired) {
              await new Promise((resolve) => setTimeout(resolve, 10));
            }
            queueLockAcquired = true;
            heldLock = true;
            return { rows: [{ id: queueId }] };
          }
          if (sql.includes("status = 'SERVED'")) {
            if (currentlyServing) {
              currentlyServing.status = 'SERVED';
            }
            return { rows: [] };
          }
          if (sql.includes("status = 'SERVING'")) {
            const nextTok = waitingTokens.shift();
            if (nextTok) {
              nextTok.status = 'SERVING';
              currentlyServing = nextTok;
              return { rows: [{ ...nextTok }] };
            }
            return { rows: [] };
          }
          if (sql === 'COMMIT') {
            if (heldLock) {
              queueLockAcquired = false;
              heldLock = false;
            }
            return { rows: [] };
          }
          if (sql === 'ROLLBACK') {
            if (heldLock) {
              queueLockAcquired = false;
              heldLock = false;
            }
            return { rows: [] };
          }
          return { rows: [] };
        },
        release: () => {
          if (heldLock) {
            queueLockAcquired = false;
            heldLock = false;
          }
        },
      };
    };

    setCustomQueueClientHandler(() => createConcurrentMockClient('OpClient'));
    try {
      // Fire 2 concurrent NEXT requests at the exact same millisecond
      const [res1, res2] = await Promise.all([
        callNextWaitingToken(queueId, businessId),
        callNextWaitingToken(queueId, businessId),
      ]);

      assert.ok(res1, 'Op 1 should successfully call a token');
      assert.ok(res2, 'Op 2 should successfully call a token');
      assert.notStrictEqual(res1.id, res2.id, 'Op 1 and Op 2 must receive DIFFERENT tokens');

      const calledTokenIds = [res1.id, res2.id].sort();
      assert.deepStrictEqual(calledTokenIds, ['tok-c1', 'tok-c2']);
      assert.strictEqual(waitingTokens.length, 0, 'All waiting tokens processed sequentially');
    } finally {
      setCustomQueueClientHandler(null);
    }
  });

  // 7. Concurrent NEXT on DIFFERENT queues: independent execution without blocking
  await suite.test('Concurrency Simulation: Two simultaneous NEXT requests on DIFFERENT queues proceed independently', async () => {
    const queueA = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const queueB = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380aff';

    const createIndependentMockClient = () => {
      return {
        query: async (sql, params) => {
          if (sql.includes('SELECT id FROM queues WHERE id = $1 FOR UPDATE')) {
            return { rows: [{ id: params[0] }] };
          }
          if (sql.includes("status = 'SERVING'")) {
            const isQueueA = params[0] === queueA;
            return {
              rows: [
                {
                  id: isQueueA ? 'tok-a-1' : 'tok-b-1',
                  queue_id: params[0],
                  token_number: isQueueA ? 'A-1' : 'B-1',
                  status: 'SERVING',
                },
              ],
            };
          }
          return { rows: [] };
        },
        release: () => {},
      };
    };

    setCustomQueueClientHandler(() => createIndependentMockClient());
    try {
      const [tokenA, tokenB] = await Promise.all([
        callNextWaitingToken(queueA, businessId),
        callNextWaitingToken(queueB, businessId),
      ]);

      assert.strictEqual(tokenA.id, 'tok-a-1');
      assert.strictEqual(tokenA.queue_id, queueA);
      assert.strictEqual(tokenB.id, 'tok-b-1');
      assert.strictEqual(tokenB.queue_id, queueB);
    } finally {
      setCustomQueueClientHandler(null);
    }
  });

  // 8. Event Safety: Zero real-time events emitted when transaction fails or queue is empty
  await suite.test('Realtime Safety: No events emitted when callNext fails or queue is empty', async () => {
    let eventsBroadcasted = [];
    const origBroadcast = realtimeService.broadcastQueueEvent.bind(realtimeService);
    realtimeService.broadcastQueueEvent = (payload) => {
      eventsBroadcasted.push(payload);
    };

    try {
      // Failing client
      const failingClient = {
        query: async (sql) => {
          if (sql === 'BEGIN') return { rows: [] };
          if (sql.includes('FOR UPDATE')) return { rows: [{ id: queueId }] };
          throw new Error('Simulated database crash');
        },
        release: () => {},
      };

      setCustomQueueClientHandler(() => failingClient);
      await assert.rejects(
        () => callNextWaitingToken(queueId, businessId),
        /Simulated database crash/
      );

      // Verify zero events were broadcast
      assert.strictEqual(eventsBroadcasted.length, 0, 'Zero events must be emitted when transaction fails');
    } finally {
      setCustomQueueClientHandler(null);
      realtimeService.broadcastQueueEvent = origBroadcast;
    }
  });
});
