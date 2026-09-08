/**
 * Shewwina — Validation Unit Tests (Phase: Auth Security)
 *
 * Tests the shared validateName and validatePhone utility functions
 * directly — no database, no HTTP server, no mocks needed.
 *
 * Also covers:
 * - Registration with invalid data (HTTP-level)
 * - Queue join with invalid data (HTTP-level)
 * - Password hashing behaviour
 * - Login success / failure / generic error message
 * - Confirm password mismatch
 * - API response must not expose password_hash
 */

import test from 'node:test';
import assert from 'node:assert';
import { validateName, validateBusinessName, validatePhone } from '../utils/validation.js';
import app from '../app.js';
import bcrypt from 'bcryptjs';
import { clearAllRateLimitStores } from '../middleware/rateLimiter.js';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: validateName — pure unit tests (no network)
// ─────────────────────────────────────────────────────────────────────────────

test('validateName — valid names', (t) => {
  const cases = [
    { input: 'Aryan',          expectedNorm: 'Aryan' },
    { input: 'Aryan Soni',     expectedNorm: 'Aryan Soni' },
    { input: 'Rahul Kumar',    expectedNorm: 'Rahul Kumar' },
    { input: '  Priya  ',      expectedNorm: 'Priya' },
    { input: 'Aarav  Mehta',   expectedNorm: 'Aarav Mehta' }, // double space normalised
    { input: 'AB',             expectedNorm: 'AB' },           // exactly 2 chars
  ];

  for (const { input, expectedNorm } of cases) {
    const result = validateName(input);
    assert.strictEqual(result.valid, true, `Expected valid for: "${input}" — got: ${result.message}`);
    assert.strictEqual(result.normalized, expectedNorm, `Normalized mismatch for: "${input}"`);
  }
});

test('validateName — empty / whitespace rejected', () => {
  assert.strictEqual(validateName('').valid, false);
  assert.strictEqual(validateName('  ').valid, false);
  assert.strictEqual(validateName(null).valid, false);
  assert.strictEqual(validateName(undefined).valid, false);
});

test('validateName — names with digits are rejected', () => {
  const cases = ['Aryan123', '12345', 'A1rya', '9278207624'];
  for (const name of cases) {
    const result = validateName(name);
    assert.strictEqual(result.valid, false, `"${name}" should be invalid`);
    assert.ok(result.message.length > 0);
  }
});

test('validateName — names with special characters are rejected', () => {
  const cases = ['Aryan@Soni', 'Rahul!', 'A.B', 'Ram-Sita', "O'Brien", 'Priya#1'];
  for (const name of cases) {
    const result = validateName(name);
    assert.strictEqual(result.valid, false, `"${name}" should be invalid`);
  }
});

test('validateName — single character name rejected (min 2)', () => {
  const result = validateName('A');
  assert.strictEqual(result.valid, false);
  assert.ok(result.message.includes('2'));
});

test('validateName — name over 100 chars rejected', () => {
  const longName = 'A'.repeat(101);
  const result = validateName(longName);
  assert.strictEqual(result.valid, false);
  assert.ok(result.message.includes('100'));
});

test('validateName — exactly 100 chars is valid', () => {
  // 100 letter name (no spaces — all letters)
  const name100 = 'A'.repeat(100);
  const result = validateName(name100);
  assert.strictEqual(result.valid, true);
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1b: validateBusinessName — pure unit tests (no network)
//
// Business names are MORE permissive than customer names:
// letters, digits, spaces, and: & - . ' ( )
// ─────────────────────────────────────────────────────────────────────────────

test('validateBusinessName — valid business names', (t) => {
  const cases = [
    // Required test cases from the spec
    { input: 'A1 Salon',          expectedNorm: 'A1 Salon' },
    { input: '5-Star Cuts',       expectedNorm: '5-Star Cuts' },
    { input: 'Quick & Clean',     expectedNorm: 'Quick & Clean' },
    // Additional realistic cases
    { input: 'Royal Unisex Salon',           expectedNorm: 'Royal Unisex Salon' },
    { input: "Raj's Hair Studio",            expectedNorm: "Raj's Hair Studio" },
    { input: 'Sharma & Sons',               expectedNorm: 'Sharma & Sons' },
    { input: 'Clinic (Andheri)',            expectedNorm: 'Clinic (Andheri)' },
    { input: 'Dr. Mehta Health Care',       expectedNorm: 'Dr. Mehta Health Care' },
    { input: '  Leading Spaces  ',          expectedNorm: 'Leading Spaces' },    // trim
    { input: 'Double  Space',               expectedNorm: 'Double Space' },       // collapse
    { input: 'AB',                          expectedNorm: 'AB' },                 // exactly 2 chars
  ];

  for (const { input, expectedNorm } of cases) {
    const result = validateBusinessName(input);
    assert.strictEqual(result.valid, true, `Expected valid for: "${input}" — got: ${result.message}`);
    assert.strictEqual(result.normalized, expectedNorm, `Normalized mismatch for: "${input}"`);
  }
});

test('validateBusinessName — empty business name rejected', () => {
  assert.strictEqual(validateBusinessName('').valid, false);
  assert.strictEqual(validateBusinessName('   ').valid, false);
  assert.strictEqual(validateBusinessName(null).valid, false);
  assert.strictEqual(validateBusinessName(undefined).valid, false);
  // Confirm the error message says "required"
  assert.ok(validateBusinessName('').message.toLowerCase().includes('required'));
});

test('validateBusinessName — excessively long business name rejected', () => {
  const tooLong = 'A'.repeat(101);
  const result = validateBusinessName(tooLong);
  assert.strictEqual(result.valid, false);
  assert.ok(result.message.includes('100'), `Error should mention 100-char limit. Got: ${result.message}`);
});

test('validateBusinessName — single character name rejected (min 2)', () => {
  const result = validateBusinessName('X');
  assert.strictEqual(result.valid, false);
  assert.ok(result.message.includes('2'), `Error should mention minimum 2 chars. Got: ${result.message}`);
});

test('validateBusinessName — exactly 100 chars is valid', () => {
  const name100 = 'A'.repeat(100);
  assert.strictEqual(validateBusinessName(name100).valid, true);
});

test('validateBusinessName — disallowed special characters rejected', () => {
  const invalid = [
    'Salon@City',     // @ not allowed
    'Hair#Studio',    // # not allowed
    'Cut$Corner',     // $ not allowed
    'Quick!Dry',      // ! not allowed
    'Biz*World',      // * not allowed
  ];
  for (const name of invalid) {
    const result = validateBusinessName(name);
    assert.strictEqual(result.valid, false, `"${name}" should be invalid for business name`);
  }
});

test('validateBusinessName — customer validateName still rejects business-style names', () => {
  // Confirm the two validators are independent:
  // validateName (customer) must stay strict
  const businessStyleNames = ['A1 Salon', '5-Star Cuts', 'Quick & Clean', 'Raj\'s Cuts'];
  for (const name of businessStyleNames) {
    const customerResult = validateName(name);
    assert.strictEqual(
      customerResult.valid,
      false,
      `Customer validateName must reject "${name}" — it must stay letters-and-spaces only`
    );
    const bizResult = validateBusinessName(name);
    assert.strictEqual(
      bizResult.valid,
      true,
      `validateBusinessName must accept "${name}" — got: ${bizResult.message}`
    );
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: validatePhone — pure unit tests (no network)
// ─────────────────────────────────────────────────────────────────────────────

test('validatePhone — valid 10-digit numbers starting with 7/8/9', () => {
  const cases = ['9278207624', '9876543210', '8123456789', '7000000001'];
  for (const phone of cases) {
    const result = validatePhone(phone);
    assert.strictEqual(result.valid, true, `"${phone}" should be valid — got: ${result.message}`);
  }
});

test('validatePhone — number starting with 6 is rejected', () => {
  const result = validatePhone('6278207624');
  assert.strictEqual(result.valid, false);
  assert.ok(result.message.length > 0);
});

test('validatePhone — fewer than 10 digits rejected', () => {
  const cases = ['927820762', '98765', '1'];
  for (const phone of cases) {
    assert.strictEqual(validatePhone(phone).valid, false, `"${phone}" should be invalid`);
  }
});

test('validatePhone — more than 10 digits rejected', () => {
  const cases = ['92782076245', '98765432109', '12345678901'];
  for (const phone of cases) {
    assert.strictEqual(validatePhone(phone).valid, false, `"${phone}" should be invalid`);
  }
});

test('validatePhone — +91 prefix rejected', () => {
  assert.strictEqual(validatePhone('+919278207624').valid, false);
  assert.strictEqual(validatePhone('+917000000001').valid, false);
});

test('validatePhone — spaces in number rejected', () => {
  assert.strictEqual(validatePhone('92782 07624').valid, false);
  assert.strictEqual(validatePhone('9278 207624').valid, false);
});

test('validatePhone — hyphens in number rejected', () => {
  assert.strictEqual(validatePhone('92782-07624').valid, false);
  assert.strictEqual(validatePhone('927-820-7624').valid, false);
});

test('validatePhone — letters rejected', () => {
  assert.strictEqual(validatePhone('abcdefghij').valid, false);
  assert.strictEqual(validatePhone('9abc567890').valid, false);
});

test('validatePhone — empty / null / undefined rejected', () => {
  assert.strictEqual(validatePhone('').valid, false);
  assert.strictEqual(validatePhone(null).valid, false);
  assert.strictEqual(validatePhone(undefined).valid, false);
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: Password hashing — bcrypt correctness
// ─────────────────────────────────────────────────────────────────────────────

test('bcrypt — password is never stored in plain text', async () => {
  const password = 'SecurePass99';
  const hash = await bcrypt.hash(password, 10);
  assert.notStrictEqual(hash, password, 'Hash must differ from plain-text password');
  assert.ok(hash.startsWith('$2'), 'bcrypt hash must start with $2 prefix');
});

test('bcrypt — correct password verifies against its hash', async () => {
  const password = 'MySecret2024!';
  const hash = await bcrypt.hash(password, 10);
  const match = await bcrypt.compare(password, hash);
  assert.strictEqual(match, true);
});

test('bcrypt — wrong password does not verify against hash', async () => {
  const password = 'CorrectHorse99';
  const hash = await bcrypt.hash(password, 10);
  const match = await bcrypt.compare('wrongpassword', hash);
  assert.strictEqual(match, false);
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: HTTP-level validation tests (registration & queue join)
// ─────────────────────────────────────────────────────────────────────────────

test('HTTP validation — registration and queue join input rules', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://localhost:${port}`;

  try {
    // Reset rate-limit store so this test group starts with a clean slate
    clearAllRateLimitStores();

    // ── Name with digits → 400 ──────────────────────────────────────────────
    await t.test('POST /register rejects name with digits (400)', async () => {
      const res = await fetch(`${base}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Aryan123',
          email: `val_test_digit_${Date.now()}@example.com`,
          phone: '9876543210',
          password: 'Password123!',
        }),
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.ok(body.message.toLowerCase().includes('letter'), `Got: ${body.message}`);
    });

    // ── Name with special chars → 400 ───────────────────────────────────────
    await t.test('POST /register rejects name with special characters (400)', async () => {
      const res = await fetch(`${base}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Aryan@Soni',
          email: `val_test_special_${Date.now()}@example.com`,
          phone: '9876543210',
          password: 'Password123!',
        }),
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });

    // ── Empty name → 400 ────────────────────────────────────────────────────
    await t.test('POST /register rejects empty name (400)', async () => {
      const res = await fetch(`${base}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          email: `val_test_empty_${Date.now()}@example.com`,
          phone: '9876543210',
          password: 'Password123!',
        }),
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });

    // ── Single-char name → 400 ──────────────────────────────────────────────
    await t.test('POST /register rejects single-character name (400)', async () => {
      const res = await fetch(`${base}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'A',
          email: `val_test_short_${Date.now()}@example.com`,
          phone: '9876543210',
          password: 'Password123!',
        }),
      });
      assert.strictEqual(res.status, 400);
    });

    // ── Password shorter than 8 chars → 400 (test #5 — still within 10/min limit) ─
    await t.test('POST /register rejects password shorter than 8 characters (400)', async () => {
      const res = await fetch(`${base}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Valid Name',
          email: `val_test_shortpwd_${Date.now()}@example.com`,
          phone: '9876543210',
          password: 'short',
        }),
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.ok(body.message.toLowerCase().includes('8'), `Got: ${body.message}`);
    });

    // ── Confirm password mismatch → 400 (test #6 — still within 10/min limit) ──
    await t.test('POST /register rejects mismatched confirmPassword (400)', async () => {
      const res = await fetch(`${base}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Valid Name',
          email: `val_test_confirmpwd_${Date.now()}@example.com`,
          phone: '9876543210',
          password: 'Password123!',
          confirmPassword: 'DifferentPass1!',
        }),
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.ok(body.message.toLowerCase().includes('match'), `Got: ${body.message}`);
    });

    // ── Phone starting with 6 → 400 ─────────────────────────────────────────
    await t.test('POST /register rejects phone starting with 6 (400)', async () => {
      const res = await fetch(`${base}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Valid Name',
          email: `val_test_phone6_${Date.now()}@example.com`,
          phone: '6278207624',
          password: 'Password123!',
        }),
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });

    // ── Phone with +91 → 400 ────────────────────────────────────────────────
    await t.test('POST /register rejects phone with +91 prefix (400)', async () => {
      const res = await fetch(`${base}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Valid Name',
          email: `val_test_phone91_${Date.now()}@example.com`,
          phone: '+919278207624',
          password: 'Password123!',
        }),
      });
      assert.strictEqual(res.status, 400);
    });

    // ── Phone too short → 400 ───────────────────────────────────────────────
    await t.test('POST /register rejects phone shorter than 10 digits (400)', async () => {
      const res = await fetch(`${base}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Valid Name',
          email: `val_test_shortphone_${Date.now()}@example.com`,
          phone: '927820762',
          password: 'Password123!',
        }),
      });
      assert.strictEqual(res.status, 400);
    });

    // ── Phone too long → 400 ────────────────────────────────────────────────
    await t.test('POST /register rejects phone longer than 10 digits (400)', async () => {
      const res = await fetch(`${base}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Valid Name',
          email: `val_test_longphone_${Date.now()}@example.com`,
          phone: '92782076245',
          password: 'Password123!',
        }),
      });
      assert.strictEqual(res.status, 400);
    });

    // ── Queue join with invalid name → 400 (uses /queue/join — different rate limiter) ──
    await t.test('POST /queue/join rejects name with digits (400)', async () => {
      const res = await fetch(`${base}/api/v1/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          queueId: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
          serviceId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
          customerName: 'Aryan123',
          customerPhone: '9278207624',
        }),
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });

    // ── Queue join with invalid phone (starting with 6) → 400 ───────────────
    await t.test('POST /queue/join rejects phone starting with 6 (400)', async () => {
      const res = await fetch(`${base}/api/v1/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          queueId: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
          serviceId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
          customerName: 'Rahul Sharma',
          customerPhone: '6278207624',
        }),
      });
      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    });

    // ── Queue join with +91 phone → 400 ─────────────────────────────────────
    await t.test('POST /queue/join rejects phone with +91 prefix (400)', async () => {
      const res = await fetch(`${base}/api/v1/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          queueId: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
          serviceId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
          customerName: 'Rahul Sharma',
          customerPhone: '+919278207624',
        }),
      });
      assert.strictEqual(res.status, 400);
    });

  } finally {
    server.close();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4b: Login generic error — isolated test group with fresh rate-limit state
// ─────────────────────────────────────────────────────────────────────────────

test('Login error message does not reveal email existence', async (t) => {
  // Fresh server + fresh rate-limit state — not affected by previous auth requests
  clearAllRateLimitStores();
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://localhost:${port}`;

  try {
    await t.test('POST /login returns generic 401 for wrong password — does not reveal email', async () => {
      const res = await fetch(`${base}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'some.unknown.user@example.com',
          password: 'wrongpassword',
        }),
      });
      // DB is not connected locally — will return 500 (DB error) or 401 (mock store).
      // Either way, the response must NOT contain "password_hash" and must NOT say "email not found".
      const body = await res.json();
      assert.strictEqual(body.success, false);
      const msg = JSON.stringify(body).toLowerCase();
      assert.ok(!msg.includes('password_hash'), 'Response must not expose password_hash');
      assert.ok(!msg.includes('email not found'), 'Response must not reveal email existence');
      assert.ok(!msg.includes('user not found'), 'Response must not reveal email existence');
      // If DB is connected, expect exactly 401 with "invalid email or password"
      if (res.status === 401) {
        assert.ok(
          body.message.toLowerCase().includes('invalid email or password'),
          `Generic login error must say "Invalid email or password". Got: "${body.message}"`
        );
      }
    });
  } finally {
    server.close();
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: password_hash must never appear in API responses
// Tests with mock store (no DB needed) — checks the response shape
// ─────────────────────────────────────────────────────────────────────────────

test('API responses — password_hash never present in any response shape', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://localhost:${port}`;

  const testEmail = `hash_check_${Date.now()}@example.com`;

  try {
    clearAllRateLimitStores();

    // Registration response must not contain password_hash
    await t.test('POST /register response does not contain password_hash', async () => {
      const res = await fetch(`${base}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Aryan Soni',
          email: testEmail,
          phone: '9278207624',
          password: 'SecurePass99!',
        }),
      });

      const body = await res.json();

      // Either 201 (DB connected) or 500 (DB creds wrong locally) — check response shape
      const responseText = JSON.stringify(body);
      assert.ok(
        !responseText.includes('password_hash'),
        `Response must not expose password_hash. Got: ${responseText.substring(0, 200)}`
      );
      assert.ok(
        !responseText.includes('"password"'),
        `Response must not expose raw password field. Got: ${responseText.substring(0, 200)}`
      );
    });

    // Login response must not contain password_hash
    await t.test('POST /login response does not contain password_hash', async () => {
      const res = await fetch(`${base}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'SecurePass99!',
        }),
      });

      const body = await res.json();
      const responseText = JSON.stringify(body);
      assert.ok(
        !responseText.includes('password_hash'),
        `Login response must not expose password_hash. Got: ${responseText.substring(0, 200)}`
      );
    });

  } finally {
    server.close();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: Rate limiting on auth endpoint
// ─────────────────────────────────────────────────────────────────────────────

test('Rate limiting — auth endpoint returns 429 after exceeding limit', async (t) => {
  clearAllRateLimitStores();
  const server = app.listen(0);
  const port = server.address().port;
  const base = `http://localhost:${port}`;

  try {
    await t.test('POST /login rate limiter returns 429 after 10 requests per minute', async () => {
      const MAX = 12; // Exceeds the 10/min limit
      let gotRateLimited = false;

      for (let i = 0; i < MAX; i++) {
        // Send fast-failing request (empty email) so it doesn't wait on DB connection
        const res = await fetch(`${base}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: '', password: '' }),
        });

        if (res.status === 429) {
          gotRateLimited = true;
          const body = await res.json();
          assert.strictEqual(body.success, false);
          assert.ok(body.message.toLowerCase().includes('too many'), `Rate limit message: ${body.message}`);
          assert.ok(res.headers.get('retry-after'), 'Retry-After header must be present');
          break;
        }
      }

      assert.ok(gotRateLimited, 'Expected a 429 response after exceeding auth rate limit');
    });
  } finally {
    server.close();
  }
});
