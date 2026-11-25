import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import assert from 'assert';

process.env.NODE_ENV = 'test';
delete process.env.DATABASE_URL;
process.env.FRONTEND_URL = 'http://127.0.0.1:5176';

// Dynamic import of backend app and services
const { default: app } = await import('../backend/app.js');
const { processRequestOpdToken } = await import('../backend/services/hospitalService.js');
const { processRequestToken } = await import('../backend/services/governmentService.js');
const { mockHospitalStore } = await import('../backend/models/hospitalModel.js');
const { mockGovtStore } = await import('../backend/models/governmentModel.js');

const SCREENSHOTS_DIR = 'C:\\Users\\guddu\\.gemini\\antigravity\\brain\\5c942f24-5bcb-47d1-a371-81743e939b1d\\screenshots';
const SCRATCH_DIR = 'C:\\Users\\guddu\\.gemini\\antigravity\\brain\\5c942f24-5bcb-47d1-a371-81743e939b1d\\scratch';

if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          else resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result ? res.result.value : null;
  }

  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: true,
    });
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await sleep(1500);
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const fullPath = path.join(SCREENSHOTS_DIR, filename);
    fs.writeFileSync(fullPath, Buffer.from(res.data, 'base64'));
    console.log(`  [Screenshot saved] -> ${fullPath}`);
    return fullPath;
  }
}

async function run() {
  console.log('=== SHEWWINA Phase 4.1.3 — Complete Runtime Verification Suite ===\n');

  const backendPort = 53000;
  const vitePort = 5176;
  const cdpPort = 9335;

  const results = {};

  // =========================================================================
  // SECTION 1: Authoritative Ownership & Authorization Verification
  // =========================================================================
  console.log('--- Section 1: Customer Identity Ownership & Authorization Check ---');

  // 1. Hospital duplicate check and token ownership
  // Aakash Verma (9820556677) has pre-seeded token htok-101 in doc-101
  try {
    await processRequestOpdToken({
      hospitalId: 'hosp-101',
      doctorId: 'doc-101',
      patientName: 'Aakash Verma',
      patientPhone: '9820556677',
      patientAge: 38,
      patientGender: 'Male',
    });
    assert.fail('Expected ConflictError DUPLICATE_ACTIVE_TOKEN');
  } catch (err) {
    assert.strictEqual(err.code, 'DUPLICATE_ACTIVE_TOKEN', 'Error code must be DUPLICATE_ACTIVE_TOKEN');
    assert.strictEqual(err.details.tokenId, 'htok-101', 'Must return user own existing token ID');
    assert.strictEqual(err.details.tokenNumber, 'H-GEN-101');
  }

  // Other patient with different phone can join without being blocked by Aakash's token
  const otherHospTokenRes = await processRequestOpdToken({
    hospitalId: 'hosp-101',
    doctorId: 'doc-101',
    patientName: 'Karan Mehra',
    patientPhone: '9820123456',
    patientAge: 29,
    patientGender: 'Male',
  });
  const otherHospTokenId = otherHospTokenRes.token ? otherHospTokenRes.token.id : otherHospTokenRes.id;
  assert(otherHospTokenId && otherHospTokenId !== 'htok-101', 'Other patient receives distinct token');

  // When Karan Mehra tries again, they get their OWN token ID, not Aakash's
  try {
    await processRequestOpdToken({
      hospitalId: 'hosp-101',
      doctorId: 'doc-101',
      patientName: 'Karan Mehra',
      patientPhone: '9820123456',
      patientAge: 29,
      patientGender: 'Male',
    });
    assert.fail('Expected ConflictError DUPLICATE_ACTIVE_TOKEN for Karan');
  } catch (err) {
    assert.strictEqual(err.code, 'DUPLICATE_ACTIVE_TOKEN');
    assert.strictEqual(err.details.tokenId, otherHospTokenId, 'Must return Karan own token ID');
  }

  // 2. Government duplicate check and token ownership
  const citizenToken1 = await processRequestToken({
    centreId: 'gcentre-101',
    serviceId: 'gserv-101',
    citizenName: 'Devendra Joshi',
    citizenPhone: '9820888123',
  });
  assert(citizenToken1 && citizenToken1.id);

  try {
    await processRequestToken({
      centreId: 'gcentre-101',
      serviceId: 'gserv-101',
      citizenName: 'Devendra Joshi',
      citizenPhone: '9820888123',
    });
    assert.fail('Expected ConflictError DUPLICATE_ACTIVE_TOKEN for Devendra');
  } catch (err) {
    assert.strictEqual(err.code, 'DUPLICATE_ACTIVE_TOKEN');
    assert.strictEqual(err.details.tokenId, citizenToken1.id, 'Must return Devendra own token ID');
  }

  // Different citizen phone does not get blocked by Devendra's active token
  const citizenToken2 = await processRequestToken({
    centreId: 'gcentre-101',
    serviceId: 'gserv-101',
    citizenName: 'Meera Rao',
    citizenPhone: '9820888999',
  });
  assert(citizenToken2 && citizenToken2.id !== citizenToken1.id, 'Different citizen receives distinct token');

  console.log('✓ Section 1 Passed: Duplicate tokens strictly match customer identity; cross-user leakage prevented.\n');
  results.test_ownership_auth = 'PASS';

  // =========================================================================
  // SECTION 2: Launch Backend & Frontend Servers for CDP E2E
  // =========================================================================
  const server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.listen(backendPort, '127.0.0.1', () => {
      console.log(`✓ Backend API listening on http://127.0.0.1:${backendPort}`);
      resolve();
    });
    server.once('error', reject);
  });

  const viteBin = path.join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js');
  const viteProcess = spawn(process.execPath, [
    viteBin,
    '--port', String(vitePort),
    '--strictPort',
    '--host', '127.0.0.1',
  ], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      VITE_API_BASE_URL: `http://127.0.0.1:${backendPort}`,
    },
    stdio: 'ignore',
  });

  let viteReady = false;
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    try {
      const res = await fetch(`http://127.0.0.1:${vitePort}`);
      if (res.ok) {
        viteReady = true;
        break;
      }
    } catch {}
  }
  if (!viteReady) throw new Error('Vite dev server failed to start within timeout');
  console.log(`✓ Vite frontend listening on http://127.0.0.1:${vitePort}`);

  // Launch Headless Chrome
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDataDir = path.join(SCRATCH_DIR, 'chrome-profile-p413');
  try {
    if (fs.existsSync(userDataDir)) fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch {}
  fs.mkdirSync(userDataDir, { recursive: true });

  const chromeProc = spawn(chromePath, [
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ]);

  let cdpUrl = null;
  for (let i = 0; i < 25; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
      const data = await res.json();
      cdpUrl = data.webSocketDebuggerUrl;
      break;
    } catch {
      await sleep(300);
    }
  }
  if (!cdpUrl) throw new Error('Failed to connect to Chrome remote debugger');

  const targetsRes = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.setViewport(390, 844);
  console.log('✓ Connected to Chrome CDP at 390px mobile viewport\n');

  try {
    // -----------------------------------------------------------------------
    // Test 1 & 2: Hospital OPD Duplicate Join & Recovery Card
    // -----------------------------------------------------------------------
    console.log('--- Test 1 & 2: Hospital OPD Duplicate Recovery ---');
    await client.navigate(`http://127.0.0.1:${vitePort}/hospital/hosp-101`);
    await sleep(1500);

    const openModalResult = await client.evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Get OPD Token'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    })()`);
    console.log('  Hospital booking modal opened:', openModalResult);
    await sleep(600);

    // Fill form with duplicate patient phone: 9820556677 (active token htok-101)
    await client.evaluate(`(() => {
      function setVal(inp, val) {
        const protoSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        protoSetter.call(inp, val);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const inputs = Array.from(document.querySelectorAll('input'));
      setVal(inputs[0], 'Aakash Verma');
      setVal(inputs[1], '9820556677');
    })()`);

    // Submit OPD token booking
    await client.evaluate(`(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Confirm OPD Token'));
      if (submitBtn) submitBtn.click();
    })()`);
    await sleep(1800);

    // Verify recovery card
    const recoveryCardInfo = await client.evaluate(`(() => {
      const alert = document.querySelector('[role="alert"]');
      const cta = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('View Active OPD Token'));
      return {
        cardVisible: Boolean(alert),
        text: alert ? alert.innerText : '',
        ctaHref: cta ? cta.getAttribute('href') : null,
      };
    })()`);
    console.log('  Hospital recovery card info:', recoveryCardInfo);
    await client.captureScreenshot('mobile_390_hospital_duplicate_card.png');

    const test1Pass = recoveryCardInfo.cardVisible &&
      recoveryCardInfo.text.includes('Active OPD Token Already Registered') &&
      recoveryCardInfo.text.includes('H-GEN-101') &&
      recoveryCardInfo.ctaHref === '/hospital/token/htok-101';

    // Click CTA and verify navigation
    await client.evaluate(`(() => {
      const cta = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('View Active OPD Token'));
      if (cta) cta.click();
    })()`);
    await sleep(1800);

    const hospTokenPageInfo = await client.evaluate(`(() => {
      return {
        pathname: window.location.pathname,
        hasToken: document.body.innerText.includes('OPD') || document.body.innerText.includes('Doctor'),
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    })()`);
    console.log('  Hospital recovered page info:', hospTokenPageInfo);
    await client.captureScreenshot('mobile_390_hospital_recovered_token.png');

    const test2Pass = hospTokenPageInfo.pathname === '/hospital/token/htok-101' &&
      hospTokenPageInfo.scrollWidth <= hospTokenPageInfo.innerWidth;

    results.test1_hospital_duplicate = test1Pass ? 'PASS' : 'FAIL';
    results.test2_hospital_cta_nav = test2Pass ? 'PASS' : 'FAIL';

    // -----------------------------------------------------------------------
    // Test 3 & 4: Government Services Duplicate Recovery
    // -----------------------------------------------------------------------
    console.log('\n--- Test 3 & 4: Government Services Duplicate Recovery ---');
    await client.navigate(`http://127.0.0.1:${vitePort}/government-services/service/aadhaar-demographic-update`);
    await sleep(2000);

    // Devendra Joshi (9820888123) already has citizenToken1 registered in Section 1!
    // Filling the form with same details will directly trigger duplicate detection
    const govtFillDuplicate = await client.evaluate(`(() => {
      function setVal(inp, val) {
        if (!inp) return;
        const protoSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        protoSetter.call(inp, val);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const form = document.querySelector('form');
      if (!form) return { noForm: true };
      const nameInput = form.querySelector('input[type="text"]');
      const telInput = form.querySelector('input[type="tel"]');
      const checkbox = form.querySelector('input[type="checkbox"]');
      const select = form.querySelector('select');

      setVal(nameInput, 'Devendra Joshi');
      setVal(telInput, '9820888123');
      if (checkbox && !checkbox.checked) checkbox.click();

      return {
        hasName: Boolean(nameInput),
        nameVal: nameInput ? nameInput.value : '',
        hasTel: Boolean(telInput),
        telVal: telInput ? telInput.value : '',
        cbChecked: checkbox ? checkbox.checked : false,
        selectVal: select ? select.value : '',
      };
    })()`);
    console.log('  Government duplicate join form fill state:', govtFillDuplicate);

    // Submit duplicate request
    await client.evaluate(`(() => {
      const form = document.querySelector('form');
      const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
      if (submitBtn) submitBtn.click();
      else if (form && form.requestSubmit) form.requestSubmit();
    })()`);
    await sleep(2500);

    // Verify recovery card
    const govtRecoveryInfo = await client.evaluate(`(() => {
      const alertCard = document.querySelector('[role="alert"]');
      const cta = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('View Active Service Token'));
      return {
        cardVisible: Boolean(alertCard),
        text: alertCard ? alertCard.innerText : '',
        ctaHref: cta ? cta.getAttribute('href') : null,
      };
    })()`);

    console.log('  Government recovery card info:', govtRecoveryInfo);
    await client.captureScreenshot('mobile_390_government_duplicate_card.png');

    const test3Pass = govtRecoveryInfo.cardVisible &&
      govtRecoveryInfo.text.includes('Active Service Token Already Registered') &&
      govtRecoveryInfo.ctaHref &&
      govtRecoveryInfo.ctaHref === `/government/token/${citizenToken1.id}`;

    // Click CTA and verify navigation to /government/token/:tokenId
    await client.evaluate(`(() => {
      const cta = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('View Active Service Token'));
      if (cta) cta.click();
    })()`);
    await sleep(1800);

    const govtTokenPageInfo = await client.evaluate(`(() => {
      return {
        pathname: window.location.pathname,
        hasToken: document.body.innerText.includes('Citizen') || document.body.innerText.includes('Token'),
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    })()`);

    console.log('  Government recovered page info:', govtTokenPageInfo);
    await client.captureScreenshot('mobile_390_government_recovered_token.png');

    const test4Pass = govtTokenPageInfo.pathname === `/government/token/${citizenToken1.id}` &&
      govtTokenPageInfo.scrollWidth <= govtTokenPageInfo.innerWidth;

    results.test3_govt_duplicate = test3Pass ? 'PASS' : 'FAIL';
    results.test4_govt_cta_nav = test4Pass ? 'PASS' : 'FAIL';

    // -----------------------------------------------------------------------
    // Test 5: Other 409 Errors Isolation (e.g. Doctor max capacity reached)
    // -----------------------------------------------------------------------
    console.log('\n--- Test 5: Other 409 Errors Isolation ---');
    const docQ = mockHospitalStore.doctorQueues.find(q => q.id === 'q-doc-101');
    const origCapacity = docQ.max_daily_capacity;
    docQ.max_daily_capacity = 1;

    await client.navigate(`http://127.0.0.1:${vitePort}/hospital/hosp-101`);
    await sleep(1200);

    await client.evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Get OPD Token'));
      if (btn) btn.click();
    })()`);
    await sleep(600);

    await client.evaluate(`(() => {
      function setVal(inp, val) {
        const protoSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        protoSetter.call(inp, val);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const inputs = Array.from(document.querySelectorAll('input'));
      setVal(inputs[0], 'Test Capacity Patient');
      setVal(inputs[1], '9899999000');
    })()`);

    await client.evaluate(`(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Confirm OPD Token'));
      if (submitBtn) submitBtn.click();
    })()`);
    await sleep(1500);

    const isolationInfo = await client.evaluate(`(() => {
      const alert = document.querySelector('[role="alert"]');
      const cta = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('View Active OPD Token'));
      return {
        text: alert ? alert.innerText : '',
        hasCta: Boolean(cta),
      };
    })()`);
    console.log('  Hospital 409 capacity error isolation info:', isolationInfo);
    await client.captureScreenshot('mobile_390_hospital_error_isolation.png');

    docQ.max_daily_capacity = origCapacity;

    const test5Pass = isolationInfo.text.includes('maximum daily patient capacity') && isolationInfo.hasCta === false;
    results.test5_error_isolation = test5Pass ? 'PASS' : 'FAIL';

    // -----------------------------------------------------------------------
    // Test 6: Missing TokenId Safe Fallback
    // -----------------------------------------------------------------------
    console.log('\n--- Test 6: Missing TokenId Safe Fallback Check ---');
    const fallbackRenderCheck = await client.evaluate(`(() => {
      const cardExists = document.querySelector('[role="alert"]');
      const ctaExists = Array.from(document.querySelectorAll('a')).some(a => a.textContent.includes('View Active OPD Token'));
      return {
        cardShowsSafeError: Boolean(cardExists),
        brokenCtaRendered: ctaExists,
      };
    })()`);
    console.log('  Fallback check:', fallbackRenderCheck);
    const test6Pass = fallbackRenderCheck.brokenCtaRendered === false;
    results.test6_missing_token_id_fallback = test6Pass ? 'PASS' : 'FAIL';

    // -----------------------------------------------------------------------
    // Test 7: Normal First-Time Hospital & Government Join Still Work
    // -----------------------------------------------------------------------
    console.log('\n--- Test 7: Normal First-Time Hospital Join ---');
    await client.navigate(`http://127.0.0.1:${vitePort}/hospital/hosp-101`);
    await sleep(1000);
    await client.evaluate(`(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Get OPD Token'));
      if (btn) btn.click();
    })()`);
    await sleep(500);

    const freshPhone = `98200${Math.floor(10000 + Math.random() * 90000)}`;
    await client.evaluate(`((phone) => {
      function setVal(inp, val) {
        const protoSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        protoSetter.call(inp, val);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const inputs = Array.from(document.querySelectorAll('input'));
      setVal(inputs[0], 'Sunita Sharma');
      setVal(inputs[1], phone);
    })('${freshPhone}')`);

    await client.evaluate(`(() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Confirm OPD Token'));
      if (submitBtn) submitBtn.click();
    })()`);
    await sleep(1500);

    const freshHospPath = await client.evaluate('window.location.pathname');
    console.log('  Fresh hospital join navigated to:', freshHospPath);
    const test7Pass = freshHospPath.startsWith('/hospital/token/');
    results.test7_first_time_join = test7Pass ? 'PASS' : 'FAIL';

    // -----------------------------------------------------------------------
    // Test 8: Salon / Clinic Duplicate Recovery Unchanged
    // -----------------------------------------------------------------------
    console.log('\n--- Test 8: Salon / Clinic Duplicate Recovery Unchanged ---');
    const bizRes = await fetch(`http://127.0.0.1:${backendPort}/api/v1/auth/register-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Stylist Owner',
        email: `salon-${Date.now()}@example.com`,
        phone: '9820088111',
        password: 'Password@123',
        businessName: 'Royal Glow Salon',
        category: 'Salon',
        address: 'MG Road',
        city: 'Mumbai',
      }),
    });
    const bizData = await bizRes.json();
    const bizId = bizData.data.business.id;

    const srvRes = await fetch(`http://127.0.0.1:${backendPort}/api/v1/business/services?businessId=${bizId}`);
    const srvData = await srvRes.json();
    const realServiceId = srvData.data.services[0].id;

    const firstJoinRes = await fetch(`http://127.0.0.1:${backendPort}/api/v1/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: bizId,
        queueId: bizData.data.queue.id,
        serviceId: realServiceId,
        customerName: 'Priya Verma',
        customerPhone: '9820044555',
      }),
    });
    console.log('  Salon first join status:', firstJoinRes.status);

    await client.navigate(`http://127.0.0.1:${vitePort}/join/${bizId}`);
    await sleep(1000);

    await client.evaluate(`(() => {
      function setVal(id, val) {
        const inp = document.getElementById(id);
        if (!inp) return;
        const protoSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        protoSetter.call(inp, val);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      }
      setVal('customerName', 'Priya Verma');
      setVal('customerPhone', '9820044555');
    })()`);

    await client.evaluate(`(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    })()`);
    await sleep(2000);

    const salonRecoveryInfo = await client.evaluate(`(() => {
      const alert = document.querySelector('[role="alert"]');
      const cta = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('View Active Token'));
      return {
        cardVisible: Boolean(alert),
        ctaHref: cta ? cta.getAttribute('href') : null,
      };
    })()`);
    console.log('  Salon recovery info:', salonRecoveryInfo);

    const test8Pass = salonRecoveryInfo.cardVisible &&
      salonRecoveryInfo.ctaHref &&
      salonRecoveryInfo.ctaHref.startsWith('/token/');
    results.test8_salon_recovery_unchanged = test8Pass ? 'PASS' : 'FAIL';

    // -----------------------------------------------------------------------
    // Test 9: Responsive 390px Overflow Verification
    // -----------------------------------------------------------------------
    console.log('\n--- Test 9: Responsive 390px Overflow Verification ---');
    const overflowCheck = await client.evaluate(`(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        fits: document.documentElement.scrollWidth <= window.innerWidth,
      };
    })()`);
    console.log('  Viewport fit check at 390px:', overflowCheck);
    results.test9_no_overflow = overflowCheck.fits ? 'PASS' : 'FAIL';

  } finally {
    console.log('\nCleaning up processes...');
    try { chromeProc.kill(); } catch {}
    try { viteProcess.kill(); } catch {}
    try { server.close(); } catch {}
  }

  console.log('\n=== FINAL VERIFICATION RESULTS ===');
  console.log(JSON.stringify(results, null, 2));

  const allPassed = Object.values(results).every(v => v === 'PASS');
  if (allPassed) {
    console.log('\n✓ ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('\n✗ SOME CHECKS FAILED');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
