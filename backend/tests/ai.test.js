import test from 'node:test';
import assert from 'node:assert';
import app from '../app.js';
import aiService, {
  sanitizePrediction,
  enhanceWaitPrediction,
  analyzeQueueInsights,
  setCustomMockHandler,
  clearCooldownCache,
} from '../services/aiService.js';
import { predictWithGrok } from '../services/ai/grokProvider.js';

test('Phase 9 AI Queue Prediction & Optimization Test Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const ts = Date.now();
  const pass = 'Password123!';
  let bizToken = '';
  let bizId = '';
  let queueId = '';
  let serviceId = '';

  try {
    // Setup Business for queue integration testing
    const bizRes = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'AI Test Salon',
        email: `ai_salon_${ts}@example.com`,
        phone: '+919877701111',
        password: pass,
        businessName: 'AI Intelligence Salon',
        category: 'salon',
        city: 'Mumbai',
      }),
    });
    const bizData = await bizRes.json();
    assert.strictEqual(bizRes.status, 201);
    bizToken = bizData.data.token;
    bizId = bizData.data.business.id;
    queueId = bizData.data.queue.id;

    const svcRes = await fetch(`${baseUrl}/api/v1/business/services?businessId=${bizId}`);
    const svcData = await svcRes.json();
    serviceId = svcData.data.services[0].id;

    // Reset AI state before tests
    clearCooldownCache();
    setCustomMockHandler(null);

    // --- Test 1: MOCK AI prediction works ---
    await t.test('1. MOCK AI prediction generates realistic wait-time forecast', async () => {
      clearCooldownCache();
      const res = await enhanceWaitPrediction({
        tokenId: `tok-mock-${Date.now()}`,
        peopleAhead: 3,
        deterministicEstimate: 45,
        avgServiceDurationMinutes: 15,
        queueSize: 3,
      });

      assert.strictEqual(typeof res.aiEstimatedWaitMinutes, 'number');
      assert.ok(res.aiEstimatedWaitMinutes > 0, 'Wait minutes should be greater than 0 for 3 people');
      assert.strictEqual(res.cached, false);
    });

    // --- Test 2: Missing API key safely falls back ---
    await t.test('2. Missing Grok API key safely throws in adapter and gracefully falls back in service', async () => {
      const origXai = process.env.XAI_API_KEY;
      const origGrok = process.env.GROK_API_KEY;
      delete process.env.XAI_API_KEY;
      delete process.env.GROK_API_KEY;

      try {
        // Direct call to grokProvider without key should throw cleanly
        await assert.rejects(
          async () => {
            await predictWithGrok({ peopleAhead: 2 });
          },
          /not configured/i
        );

        // But aiService enhanceWaitPrediction should NEVER throw - it safely falls back
        clearCooldownCache();
        const res = await enhanceWaitPrediction({
          tokenId: `tok-nokey-${Date.now()}`,
          peopleAhead: 2,
          deterministicEstimate: 30,
        });

        // In MOCK default, it still produces a safe estimate without crashing
        assert.ok(res.aiEstimatedWaitMinutes !== undefined);
      } finally {
        if (origXai) process.env.XAI_API_KEY = origXai;
        if (origGrok) process.env.GROK_API_KEY = origGrok;
      }
    });

    // --- Test 3: Invalid AI response falls back ---
    await t.test('3. Invalid or malformed AI response falls back to null / safe value without throwing', async () => {
      clearCooldownCache();
      // Set custom mock returning corrupt non-numeric data
      setCustomMockHandler(() => 'not-a-number');

      const res = await enhanceWaitPrediction({
        tokenId: `tok-corrupt-${Date.now()}`,
        peopleAhead: 2,
        deterministicEstimate: 30,
      });

      assert.strictEqual(res.aiEstimatedWaitMinutes, null);
      assert.strictEqual(res.source, 'fallback_deterministic');

      setCustomMockHandler(null);
    });

    // --- Test 4: AI timeout falls back ---
    await t.test('4. AI timeout falls back gracefully without throwing', async () => {
      clearCooldownCache();
      // Simulate handler taking longer than acceptable timeout
      setCustomMockHandler(async () => {
        const err = new Error('AbortError: The operation was aborted');
        err.name = 'AbortError';
        throw err;
      });

      const res = await enhanceWaitPrediction({
        tokenId: `tok-timeout-${Date.now()}`,
        peopleAhead: 3,
        deterministicEstimate: 45,
      });

      assert.strictEqual(res.aiEstimatedWaitMinutes, null);
      assert.strictEqual(res.source, 'fallback_deterministic');

      setCustomMockHandler(null);
    });

    // --- Test 5: AI prediction is numeric ---
    await t.test('5. Sanitizer ensures prediction output is strictly a finite integer or null', () => {
      assert.strictEqual(sanitizePrediction('22'), 22);
      assert.strictEqual(sanitizePrediction(18.7), 19);
      assert.strictEqual(sanitizePrediction('invalid'), null);
      assert.strictEqual(sanitizePrediction(null), null);
      assert.strictEqual(sanitizePrediction(undefined), null);
      assert.strictEqual(sanitizePrediction(Infinity), null);
    });

    // --- Test 6: AI prediction cannot be negative ---
    await t.test('6. AI prediction rejects negative numbers and limits excessive values', () => {
      assert.strictEqual(sanitizePrediction(-5), null);
      assert.strictEqual(sanitizePrediction(-0.5), null);
      assert.strictEqual(sanitizePrediction(0), 0);
      // Values exceeding 480 min (8 hrs) get capped
      assert.strictEqual(sanitizePrediction(1000, 60), 60);
    });

    // --- Test 7: Existing deterministic estimate remains available ---
    await t.test('7. Deterministic estimate is preserved and returned alongside AI estimate', async () => {
      clearCooldownCache();
      const joinRes = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bizId,
          queueId,
          serviceId,
          customerName: 'Aarav Patel',
          customerPhone: '+919877702222',
        }),
      });
      const joinData = await joinRes.json();
      assert.strictEqual(joinRes.status, 201);
      const tokenId = joinData.data.tokenId;

      const statusRes = await fetch(`${baseUrl}/api/v1/queue/status/${tokenId}`);
      const statusData = await statusRes.json();

      assert.strictEqual(statusRes.status, 200);
      assert.ok('estimatedWaitMinutes' in statusData.data, 'Deterministic estimatedWaitMinutes must exist');
      assert.ok('aiEstimatedWaitMinutes' in statusData.data, 'aiEstimatedWaitMinutes must exist');
      assert.strictEqual(typeof statusData.data.estimatedWaitMinutes, 'number');
    });

    // --- Test 8: 30-second cooldown prevents repeated external calls ---
    await t.test('8. 30-second cooldown cache serves cached predictions on rapid repeated calls', async () => {
      clearCooldownCache();
      const testTokenId = `tok-cooldown-test-${Date.now()}`;

      let calls = 0;
      setCustomMockHandler(() => {
        calls++;
        return { estimatedWaitMinutes: 20 };
      });

      // Call 1: should invoke handler
      const res1 = await enhanceWaitPrediction({
        tokenId: testTokenId,
        peopleAhead: 2,
        deterministicEstimate: 30,
      });
      assert.strictEqual(res1.cached, false);
      assert.strictEqual(calls, 1);

      // Call 2: immediate subsequent call within 30s cooldown should hit cache
      const res2 = await enhanceWaitPrediction({
        tokenId: testTokenId,
        peopleAhead: 2,
        deterministicEstimate: 30,
      });
      assert.strictEqual(res2.cached, true);
      assert.strictEqual(res2.aiEstimatedWaitMinutes, 20);
      assert.strictEqual(calls, 1, 'Handler must not be invoked again during cooldown');

      setCustomMockHandler(null);
    });

    // --- Test 9: Customer endpoint returns AI prediction when available ---
    await t.test('9. GET /api/v1/queue/status/:tokenId returns aiEstimatedWaitMinutes', async () => {
      clearCooldownCache();
      // Join customer
      const joinRes = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bizId,
          queueId,
          serviceId,
          customerName: 'Kavita Roy',
          customerPhone: '+919877703333',
        }),
      });
      const joinData = await joinRes.json();
      const tokenId = joinData.data.tokenId;

      const res = await fetch(`${baseUrl}/api/v1/queue/status/${tokenId}`);
      const data = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.ok('aiEstimatedWaitMinutes' in data.data);
      if (data.data.peopleAhead > 0) {
        assert.strictEqual(typeof data.data.aiEstimatedWaitMinutes, 'number');
      }
    });

    // --- Test 10: Business endpoint returns AI queue insights ---
    await t.test('10. GET /api/v1/business/queue returns queueInsights with forecast & load level', async () => {
      const res = await fetch(`${baseUrl}/api/v1/business/queue?businessId=${bizId}`, {
        headers: { Authorization: `Bearer ${bizToken}` },
      });
      const data = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.ok(data.data.queueInsights, 'queueInsights must be present on business queue');
      assert.strictEqual(typeof data.data.queueInsights.estimatedClearTimeMinutes, 'number');
      assert.strictEqual(typeof data.data.queueInsights.aiAdjustedClearTimeMinutes, 'number');
      assert.ok(['LOW', 'MODERATE', 'HIGH'].includes(data.data.queueInsights.loadLevel));
      assert.strictEqual(typeof data.data.queueInsights.peakWarning, 'boolean');
    });

    // --- Test 11: Queue operation succeeds when AI service fails ---
    await t.test('11. Queue join, status check, and calling next still succeed even if AI service throws', async () => {
      clearCooldownCache();
      // Force mock handler to simulate fatal crash
      setCustomMockHandler(() => {
        throw new Error('Fatal AI connection fault');
      });

      // 1. Join queue should succeed
      const joinRes = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: bizId,
          queueId,
          serviceId,
          customerName: 'Robustness Test Customer',
          customerPhone: '+919877704444',
        }),
      });
      assert.strictEqual(joinRes.status, 201);
      const data = await joinRes.json();
      const tokenId = data.data.tokenId;

      // 2. Token status should succeed (with fallback null AI estimate)
      const statusRes = await fetch(`${baseUrl}/api/v1/queue/status/${tokenId}`);
      assert.strictEqual(statusRes.status, 200);
      const statusData = await statusRes.json();
      assert.strictEqual(statusData.data.aiEstimatedWaitMinutes, null);
      assert.ok(statusData.data.estimatedWaitMinutes >= 0);

      // 3. Business call next should succeed
      const nextRes = await fetch(`${baseUrl}/api/v1/business/queue/next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bizToken}`,
        },
        body: JSON.stringify({ businessId: bizId, queueId }),
      });
      assert.strictEqual(nextRes.status, 200);

      setCustomMockHandler(null);
    });

    // --- Test 12: API key is never exposed in responses ---
    await t.test('12. Sensitive AI credentials are never leaked in customer or business API responses', async () => {
      const secretCanary = 'xai-canary-secret-do-not-leak-998877';
      process.env.XAI_API_KEY = secretCanary;

      const [statusRes, queueRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/queue/status/dummy-id`),
        fetch(`${baseUrl}/api/v1/business/queue?businessId=${bizId}`, {
          headers: { Authorization: `Bearer ${bizToken}` },
        }),
      ]);

      const statusText = await statusRes.text();
      const queueText = await queueRes.text();

      assert.ok(!statusText.includes(secretCanary), 'Status response must not leak XAI_API_KEY');
      assert.ok(!queueText.includes(secretCanary), 'Queue response must not leak XAI_API_KEY');

      delete process.env.XAI_API_KEY;
    });

  } finally {
    clearCooldownCache();
    setCustomMockHandler(null);
    server.close();
  }
});
