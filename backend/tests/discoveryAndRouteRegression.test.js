import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import app from '../app.js';

describe('Phase 2 — Discovery APIs & Route Contract Verification', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // 1. Business Directory (Clinics & Salons)
  test('GET /api/v1/business/directory — returns active business list for discovery', async () => {
    const res = await fetch(`${baseUrl}/api/v1/business/directory`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.businesses));
  });

  test('GET /api/v1/business/directory?category=clinic — filters by clinic category', async () => {
    const res = await fetch(`${baseUrl}/api/v1/business/directory?category=clinic`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.businesses));
    for (const b of body.data.businesses) {
      assert.equal(b.category?.toLowerCase(), 'clinic');
    }
  });

  test('GET /api/v1/business/directory?category=salon — filters by salon category', async () => {
    const res = await fetch(`${baseUrl}/api/v1/business/directory?category=salon`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.businesses));
    for (const b of body.data.businesses) {
      assert.equal(b.category?.toLowerCase(), 'salon');
    }
  });

  test('GET /api/v1/business/directory?city=Mumbai — filters by city', async () => {
    const res = await fetch(`${baseUrl}/api/v1/business/directory?city=Mumbai`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.businesses));
    for (const b of body.data.businesses) {
      assert.ok(b.city?.toLowerCase().includes('mumbai'));
    }
  });

  // 2. Hospital Search & Discovery
  test('GET /api/v1/hospital/search — returns hospital list with departments', async () => {
    const res = await fetch(`${baseUrl}/api/v1/hospital/search`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.hospitals));
  });

  test('GET /api/v1/hospital/search?search=Hospital — filters hospitals by name keyword', async () => {
    const res = await fetch(`${baseUrl}/api/v1/hospital/search?search=Hospital`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.hospitals));
  });

  // 3. Government Facilitation Centres & Services Discovery
  test('GET /api/v1/government/centres — returns facilitation centres list', async () => {
    const res = await fetch(`${baseUrl}/api/v1/government/centres`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.centres));
  });

  test('GET /api/v1/government/services — returns citizen service catalog', async () => {
    const res = await fetch(`${baseUrl}/api/v1/government/services`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.services));
    assert.ok(body.data.services.length > 0);
  });

  test('GET /api/v1/government/services?category=Aadhaar — filters services by category', async () => {
    const res = await fetch(`${baseUrl}/api/v1/government/services?category=Aadhaar`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.services));
    for (const s of body.data.services) {
      assert.equal(s.category, 'Aadhaar');
    }
  });

  // 4. Existing Provider Detail & Queue Navigation Contracts
  test('GET /api/v1/government/services/:slug — returns document checklist and source reference', async () => {
    const res = await fetch(`${baseUrl}/api/v1/government/services/aadhaar-demographic-update`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.service);
    assert.equal(body.data.service.slug, 'aadhaar-demographic-update');
    assert.ok(Array.isArray(body.data.service.required_documents));
  });

  test('GET /api/v1/business/services requires businessId and preserves security validation', async () => {
    const res = await fetch(`${baseUrl}/api/v1/business/services`);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('GET /api/v1/queue/status/:tokenId returns 404 for unknown token', async () => {
    const res = await fetch(`${baseUrl}/api/v1/queue/status/unknown-token-xyz`);
    assert.equal(res.status, 404);
  });
});
