/**
 * Shewwina — Complete Analytics & Graph System Test Suite (Phase 5B)
 *
 * Tests the analytics data model, service layer, formulas, revenue calculations,
 * and API endpoint security (authentication, role enforcement, tenant isolation).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import {
  setCustomQueryHandler,
  getBusinessAnalytics,
} from '../models/queueModel.js';
import { processGetBusinessAnalytics } from '../services/queueService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const VALID_BIZ_A = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const VALID_BIZ_B = 'b9eebc99-9c0b-4ef8-bb6d-6bb9bd380bff';

function clearHandler() {
  setCustomQueryHandler(null);
}

// Mint test JWT tokens directly for hermetic API testing
function createBusinessToken(businessId = VALID_BIZ_A) {
  return jwt.sign(
    { userId: 'u1eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', role: 'BUSINESS', businessId },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function createCustomerToken() {
  return jwt.sign(
    { userId: 'u2eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', role: 'CUSTOMER' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Model Unit Tests (getBusinessAnalytics)
// ─────────────────────────────────────────────────────────────────────────────

test('getBusinessAnalytics — Unit Tests & Formulas', async (t) => {
  t.afterEach(() => clearHandler());

  await t.test('1. Rejects invalid periods with 400 Bad Request', async () => {
    await assert.rejects(
      async () => getBusinessAnalytics(VALID_BIZ_A, '1year'),
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.match(err.message, /Invalid analytics period/);
        return true;
      }
    );
  });

  await t.test('2. Returns zeroed structure safely when businessId is missing or invalid', async () => {
    const resNull = await getBusinessAnalytics(null, 'today');
    assert.strictEqual(resNull.hasData, false);
    assert.strictEqual(resNull.summary.totalTokens, 0);
    assert.strictEqual(resNull.summary.totalRevenue, 0);

    const resInvalid = await getBusinessAnalytics('non-uuid', 'today');
    assert.strictEqual(resInvalid.hasData, false);
    assert.strictEqual(resInvalid.summary.totalTokens, 0);
  });

  await t.test('3. MockStore fallback returns correct summary metrics for today', async () => {
    clearHandler();
    const result = await getBusinessAnalytics(VALID_BIZ_A, 'today');
    assert.strictEqual(result.period, 'today');
    assert.ok(typeof result.summary.totalTokens === 'number');
    assert.ok(typeof result.summary.totalRevenue === 'number');
    assert.ok(typeof result.summary.completionRate === 'number');
    assert.ok(Array.isArray(result.flow));
    assert.ok(Array.isArray(result.services));
    assert.ok('queueLoad' in result);
    assert.ok('waitTime' in result);
    assert.ok('serviceDuration' in result);
  });

  await t.test('4. SQL summary calculation maps core KPIs correctly', async () => {
    setCustomQueryHandler(async (sql) => {
      if (sql.includes('COUNT(*)::int AS total_tokens')) {
        return {
          rows: [
            {
              total_tokens: 50,
              waiting_count: 10,
              serving_count: 2,
              served_count: 35,
              cancelled_count: 2,
              skipped_count: 1,
              total_revenue: 17500.0,
              avg_wait_minutes: 14.5,
              min_wait_minutes: 2.0,
              max_wait_minutes: 32.0,
              avg_service_minutes: 21.0,
              min_service_minutes: 10.0,
              max_service_minutes: 40.0,
            },
          ],
        };
      }
      return { rows: [] };
    });

    const result = await getBusinessAnalytics(VALID_BIZ_A, 'today');
    assert.strictEqual(result.summary.totalTokens, 50);
    assert.strictEqual(result.summary.waitingCount, 10);
    assert.strictEqual(result.summary.servingCount, 2);
    assert.strictEqual(result.summary.servedCount, 35);
    assert.strictEqual(result.summary.cancelledCount, 2);
    assert.strictEqual(result.summary.skippedCount, 1);
    assert.strictEqual(result.summary.totalRevenue, 17500);
    assert.strictEqual(result.summary.avgTicketValue, 500); // 17500 / 35
    assert.strictEqual(result.summary.completionRate, 70.0); // 35 / 50 * 100
    assert.strictEqual(result.summary.cancellationRate, 4.0); // 2 / 50 * 100
    assert.strictEqual(result.summary.skipRate, 2.0); // 1 / 50 * 100
    assert.strictEqual(result.summary.queueLoadLevel, 'HIGH'); // waiting >= 8
    assert.strictEqual(result.waitTime.avgWaitMinutes, 14.5);
    assert.strictEqual(result.serviceDuration.avgDurationMinutes, 21.0);
    assert.strictEqual(result.serviceDuration.isMeasurable, true);
  });

  await t.test('5. Revenue strictly counts SERVED tokens and excludes WAITING/CANCELLED/SKIPPED', async () => {
    const capturedQueries = [];
    setCustomQueryHandler(async (sql) => {
      capturedQueries.push(sql);
      return {
        rows: [
          {
            total_tokens: 10,
            waiting_count: 3,
            serving_count: 1,
            served_count: 4,
            cancelled_count: 1,
            skipped_count: 1,
            total_revenue: 2000.0, // only the 4 SERVED tokens
          },
        ],
      };
    });

    const result = await getBusinessAnalytics(VALID_BIZ_A, 'today');
    assert.ok(
      capturedQueries.some((sql) =>
        sql.includes("CASE WHEN t.status = 'SERVED' THEN COALESCE(t.service_price_at_join, s.price, 0) ELSE 0 END")
      ),
      'SQL query must strictly sum revenue only for SERVED status using service_price_at_join'
    );
    assert.strictEqual(result.summary.totalRevenue, 2000);
    assert.strictEqual(result.summary.servedCount, 4);
  });

  await t.test('6. 7-Day & 30-Day returns correct daily flow structure', async () => {
    setCustomQueryHandler(async (sql) => {
      if (sql.includes('to_char(t.created_at AT TIME ZONE')) {
        return {
          rows: [
            {
              date: '2026-09-21',
              tokens_created: 20,
              served: 18,
              cancelled: 1,
              skipped: 1,
              revenue: 9000,
            },
          ],
        };
      }
      return { rows: [{ total_tokens: 20, served_count: 18, total_revenue: 9000 }] };
    });

    const res7d = await getBusinessAnalytics(VALID_BIZ_A, '7d');
    assert.strictEqual(res7d.period, '7d');
    assert.strictEqual(res7d.flow.length, 7, '7d must have 7 daily buckets');
    assert.ok(res7d.flow.every((f) => 'date' in f && 'dayLabel' in f && 'revenue' in f));

    const res30d = await getBusinessAnalytics(VALID_BIZ_A, '30d');
    assert.strictEqual(res30d.period, '30d');
    assert.strictEqual(res30d.flow.length, 30, '30d must have 30 daily buckets');
  });

  await t.test('7. Tenant isolation: queries strictly pass businessId parameter', async () => {
    let capturedParams = [];
    setCustomQueryHandler(async (_sql, params) => {
      capturedParams = params;
      return { rows: [{ total_tokens: 0 }] };
    });

    await getBusinessAnalytics(VALID_BIZ_B, 'today');
    assert.strictEqual(capturedParams[0], VALID_BIZ_B, 'Query must parameterize the target businessId');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Service Layer Tests (processGetBusinessAnalytics)
// ─────────────────────────────────────────────────────────────────────────────

test('processGetBusinessAnalytics — Service Layer', async (t) => {
  t.afterEach(() => clearHandler());

  await t.test('1. Throws ValidationError if businessId is missing', async () => {
    await assert.rejects(
      async () => processGetBusinessAnalytics(null, 'today'),
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  await t.test('2. Throws NotFoundError if business does not exist', async () => {
    setCustomQueryHandler(async (sql) => {
      if (sql.includes('FROM businesses')) return { rows: [] };
      return { rows: [] };
    });

    await assert.rejects(
      async () => processGetBusinessAnalytics('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'today'),
      (err) => {
        assert.strictEqual(err.statusCode, 404);
        return true;
      }
    );
  });

  await t.test('3. Returns enriched business info with analytics payload', async () => {
    setCustomQueryHandler(async (sql) => {
      if (sql.includes('FROM businesses')) {
        return {
          rows: [
            {
              id: VALID_BIZ_A,
              name: 'Shewwina Salon & Spa',
              category: 'salon',
            },
          ],
        };
      }
      return { rows: [{ total_tokens: 5, served_count: 5, total_revenue: 2500 }] };
    });

    const result = await processGetBusinessAnalytics(VALID_BIZ_A, 'today');
    assert.strictEqual(result.business.id, VALID_BIZ_A);
    assert.strictEqual(result.business.name, 'Shewwina Salon & Spa');
    assert.strictEqual(result.business.category, 'salon');
    assert.strictEqual(result.period, 'today');
    assert.ok('summary' in result);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. API Route & Security Integration Tests
// ─────────────────────────────────────────────────────────────────────────────

test('GET /api/v1/business/analytics — Security & HTTP Integration', async (t) => {
  t.afterEach(() => clearHandler());

  let server;
  let baseUrl;

  t.before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  await t.test('1. Returns 401 Unauthorized when no JWT token is provided', async () => {
    const res = await fetch(`${baseUrl}/api/v1/business/analytics?period=today`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /token missing/i);
  });

  await t.test('2. Returns 403 Forbidden when authenticated as CUSTOMER role', async () => {
    const customerToken = createCustomerToken();
    const res = await fetch(`${baseUrl}/api/v1/business/analytics?period=today`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /Requires role: BUSINESS/i);
  });

  await t.test('3. Returns 403 Forbidden when merchant attempts to query another businessId', async () => {
    const bizAToken = createBusinessToken(VALID_BIZ_A);
    const res = await fetch(`${baseUrl}/api/v1/business/analytics?period=today&businessId=${VALID_BIZ_B}`, {
      headers: { Authorization: `Bearer ${bizAToken}` },
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /cannot view or modify another business/i);
  });

  await t.test('4. Returns 400 Bad Request for invalid period parameter', async () => {
    setCustomQueryHandler(async (sql) => {
      if (sql.includes('FROM businesses')) {
        return {
          rows: [{ id: VALID_BIZ_A, name: 'Shewwina Salon & Spa', category: 'salon' }],
        };
      }
      return { rows: [] };
    });

    const bizAToken = createBusinessToken(VALID_BIZ_A);
    const res = await fetch(`${baseUrl}/api/v1/business/analytics?period=invalid_period`, {
      headers: { Authorization: `Bearer ${bizAToken}` },
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.match(body.message, /Invalid analytics period/i);
  });

  await t.test('5. Returns 200 OK with valid today analytics data for authorized merchant', async () => {
    setCustomQueryHandler(async (sql) => {
      if (sql.includes('FROM businesses')) {
        return {
          rows: [{ id: VALID_BIZ_A, name: 'Shewwina Salon & Spa', category: 'salon' }],
        };
      }
      return {
        rows: [
          {
            total_tokens: 12,
            waiting_count: 2,
            serving_count: 1,
            served_count: 8,
            cancelled_count: 1,
            skipped_count: 0,
            total_revenue: 4000.0,
          },
        ],
      };
    });

    const bizAToken = createBusinessToken(VALID_BIZ_A);
    const res = await fetch(`${baseUrl}/api/v1/business/analytics?period=today`, {
      headers: { Authorization: `Bearer ${bizAToken}` },
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.period, 'today');
    assert.strictEqual(body.data.summary.totalTokens, 12);
    assert.strictEqual(body.data.summary.totalRevenue, 4000);
    assert.ok(Array.isArray(body.data.flow));
    assert.ok('revenue' in body.data);
    assert.ok('services' in body.data);
    assert.ok('queueLoad' in body.data);
    assert.ok('waitTime' in body.data);
  });

  await t.test('6. Returns 200 OK with 7d and 30d periods', async () => {
    setCustomQueryHandler(async (sql) => {
      if (sql.includes('FROM businesses')) {
        return {
          rows: [{ id: VALID_BIZ_A, name: 'Shewwina Salon & Spa', category: 'salon' }],
        };
      }
      return { rows: [{ total_tokens: 100, served_count: 90, total_revenue: 45000 }] };
    });

    const bizAToken = createBusinessToken(VALID_BIZ_A);

    const res7d = await fetch(`${baseUrl}/api/v1/business/analytics?period=7d`, {
      headers: { Authorization: `Bearer ${bizAToken}` },
    });
    assert.strictEqual(res7d.status, 200);
    const body7d = await res7d.json();
    assert.strictEqual(body7d.data.period, '7d');
    assert.strictEqual(body7d.data.flow.length, 7);

    const res30d = await fetch(`${baseUrl}/api/v1/business/analytics?period=30d`, {
      headers: { Authorization: `Bearer ${bizAToken}` },
    });
    assert.strictEqual(res30d.status, 200);
    const body30d = await res30d.json();
    assert.strictEqual(body30d.data.period, '30d');
    assert.strictEqual(body30d.data.flow.length, 30);
  });
});
