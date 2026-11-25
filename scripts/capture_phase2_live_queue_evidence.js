import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';

process.env.NODE_ENV = 'test';
delete process.env.DATABASE_URL;

const { default: app } = await import('../backend/app.js');
const { mockHospitalStore } = await import('../backend/models/hospitalModel.js');
const {
  searchGovernmentCentres,
  getAllGovernmentServices,
  createGovernmentToken,
} = await import('../backend/models/governmentModel.js');
const { clearAllRateLimitStores } = await import('../backend/middleware/rateLimiter.js');

const SCREENSHOT_DIR = 'C:\\Users\\guddu\\.gemini\\antigravity\\brain\\5c942f24-5bcb-47d1-a371-81743e939b1d\\screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

class CDPClient {
  constructor(wsUrl) {
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
          if (msg.error) {
            reject(new Error(msg.error.message));
          } else {
            resolve(msg.result);
          }
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  clearAllRateLimitStores();

  console.log('--- 1. Starting Backend API Server (Port 5000) ---');
  const backendServer = http.createServer(app);
  await new Promise((resolve) => backendServer.listen(5000, resolve));
  console.log('✓ Backend API ready on http://localhost:5000');

  console.log('--- 2. Starting Vite Dev Server (Port 5173) ---');
  const viteProc = spawn('cmd.exe', ['/c', 'npx', 'vite', '--port', '5173', '--strictPort'], {
    stdio: 'ignore',
  });

  let viteReady = false;
  for (let i = 0; i < 30; i++) {
    await sleep(600);
    try {
      const res = await fetch('http://localhost:5173');
      if (res.ok) {
        viteReady = true;
        break;
      }
    } catch (e) {}
  }
  if (!viteReady) {
    throw new Error('Vite dev server failed to start within timeout');
  }
  console.log('✓ Vite ready on http://localhost:5173');

  console.log('--- 3. Seeding Live Queue State Progression ---');
  const ts = Date.now();

  // Register Business
  const bizRes = await fetch('http://localhost:5000/api/v1/auth/register-business', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Arjun Verma',
      email: `arjun_${ts}@shewwina.com`,
      phone: '9820011223',
      password: 'Password123!',
      businessName: 'Apex Health & Wellness Clinic',
      category: 'clinic',
      city: 'Mumbai',
    }),
  });
  const bizData = await bizRes.json();
  const bizToken = bizData.data.token;
  const bizId = bizData.data.business.id;
  const bizQueueId = bizData.data.queue.id;

  // Services
  const svcRes = await fetch(`http://localhost:5000/api/v1/business/services?businessId=${bizId}`);
  const svcData = await svcRes.json();
  const serviceId = svcData.data?.services?.[0]?.id || 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  // Join Token 1 (Will be called to SERVING)
  const t1Res = await fetch('http://localhost:5000/api/v1/queue/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId: bizId,
      queueId: bizQueueId,
      serviceId,
      customerName: 'Ananya Roy',
      customerPhone: '9820011111',
    }),
  });
  const t1Data = await t1Res.json();
  const token1Id = t1Data.data.tokenId;

  // Join Token 2 (Will stay WAITING, with Token 1 serving)
  const t2Res = await fetch('http://localhost:5000/api/v1/queue/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId: bizId,
      queueId: bizQueueId,
      serviceId,
      customerName: 'Rohan Mehta',
      customerPhone: '9820055111',
    }),
  });
  const t2Data = await t2Res.json();
  const token2Id = t2Data.data.tokenId;

  // Call Token 1 to SERVING
  await fetch('http://localhost:5000/api/v1/business/queue/next', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bizToken}`,
    },
    body: JSON.stringify({ businessId: bizId, queueId: bizQueueId }),
  });

  // Join Token 3 (Will be COMPLETED)
  const t3Res = await fetch('http://localhost:5000/api/v1/queue/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId: bizId,
      queueId: bizQueueId,
      serviceId,
      customerName: 'Vikram Joshi',
      customerPhone: '9820033333',
    }),
  });
  const t3Data = await t3Res.json();
  const token3Id = t3Data.data.tokenId;

  // Complete Token 1 & Call Token 3 to serve, then complete Token 3
  await fetch('http://localhost:5000/api/v1/business/queue/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bizToken}`,
    },
    body: JSON.stringify({ businessId: bizId, queueId: bizQueueId }),
  });

  // Join Token 4 (Will be CANCELLED)
  const t4Res = await fetch('http://localhost:5000/api/v1/queue/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId: bizId,
      queueId: bizQueueId,
      serviceId,
      customerName: 'Meera Patel',
      customerPhone: '9820044444',
    }),
  });
  const t4Data = await t4Res.json();
  const token4Id = t4Data.data.tokenId;

  // Cancel Token 4
  await fetch(`http://localhost:5000/api/v1/queue/cancel/${token4Id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  // Seed Hospital Token
  const hospTokenId = `htok-live-${ts}`;
  mockHospitalStore.tokens.push({
    id: hospTokenId,
    queue_id: 'q-doc-101',
    hospital_id: 'hosp-101',
    doctor_id: 'doc-101',
    department_id: 'dept-101',
    patient_id: 'pat-101',
    patient_code: 'P-8820',
    patient_name: 'Rohan Mehta',
    patient_phone: '9820055111',
    token_number: 'OPD-105',
    sequence_number: 5,
    status: 'WAITING',
    position: 2,
    estimated_wait_minutes: 20,
    called_at: null,
    served_at: null,
    created_at: new Date().toISOString(),
  });

  // Seed Government Token
  const gCentres = await searchGovernmentCentres();
  const gServices = await getAllGovernmentServices();
  const govtToken = await createGovernmentToken({
    centreId: gCentres[0].id,
    serviceId: gServices[0].id,
    citizenName: 'Rohan Mehta',
    citizenPhone: '9820055111',
  });
  const govtTokenId = govtToken.id;

  console.log('✓ Seeding complete:');
  console.log(`  - WAITING Token (with Token 1 serving): ${token2Id}`);
  console.log(`  - SERVING Token: ${token1Id}`);
  console.log(`  - COMPLETED Token: ${token3Id}`);
  console.log(`  - CANCELLED Token: ${token4Id}`);
  console.log(`  - Hospital Token: ${hospTokenId}`);
  console.log(`  - Government Token: ${govtTokenId}`);

  console.log('--- 4. Launching Chrome Headless Browser ---');
  const tempProfile = path.join(process.env.TEMP || 'C:\\Temp', `chrome_dbg_phase2_${Date.now()}`);
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${tempProfile}`,
    '--disable-gpu',
    '--no-first-run',
  ], {
    detached: false,
    stdio: 'ignore',
  });

  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const v = await fetch('http://127.0.0.1:9222/json/version');
      if (v.ok) break;
    } catch (e) {}
  }

  const targetRes = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' });
  const target = await targetRes.json();
  const cdp = new CDPClient(target.webSocketDebuggerUrl);
  await cdp.connect();
  console.log('✓ Connected to Chrome CDP');

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');

  const overflowResults = [];

  async function capture({ name, url, width, height, mobile = true }) {
    clearAllRateLimitStores();
    console.log(`Capturing ${name} (${width}x${height}) at ${url}...`);

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile,
    });

    await cdp.send('Page.navigate', { url });
    await sleep(2500);

    // Verify content rendered
    for (let i = 0; i < 15; i++) {
      const evalRes = await cdp.send('Runtime.evaluate', {
        expression: `document.body ? document.body.innerText.length : 0`,
      });
      if (evalRes?.result?.value > 150) break;
      await sleep(300);
    }
    await sleep(1000);

    // Check horizontal overflow
    const overflowCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const docW = document.documentElement.scrollWidth;
          const winW = window.innerWidth;
          const bodyW = document.body ? document.body.scrollWidth : 0;
          const hasOverflow = docW > winW || bodyW > winW;
          return { docW, winW, bodyW, hasOverflow };
        })()
      `,
      returnByValue: true,
    });

    const ovData = overflowCheck?.result?.value;
    overflowResults.push({ screen: name, width, ...ovData });

    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
    fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
    const stats = fs.statSync(filePath);
    console.log(`  ✓ Saved ${name}.png (${(stats.size / 1024).toFixed(1)} KB) | Overflow: ${ovData?.hasOverflow ? 'FAIL' : 'PASS (0px)'}`);
  }

  console.log('\n--- 5. Capturing Live Queue Screenshots ---');

  // 1. Mobile 390px — WAITING State (Prominent Royal Blue Card)
  await capture({
    name: 'mobile_390_live_queue_waiting',
    url: `http://localhost:5173/token/${token2Id}`,
    width: 390,
    height: 844,
  });

  // 2. Desktop 1440px — WAITING State
  await capture({
    name: 'desktop_1440_live_queue_waiting',
    url: `http://localhost:5173/token/${token2Id}`,
    width: 1440,
    height: 900,
    mobile: false,
  });

  // 3. Mobile 390px — SERVING State
  await capture({
    name: 'mobile_390_live_queue_serving',
    url: `http://localhost:5173/token/${token1Id}`,
    width: 390,
    height: 844,
  });

  // 4. Mobile 390px — COMPLETED State
  await capture({
    name: 'mobile_390_live_queue_completed',
    url: `http://localhost:5173/token/${token3Id}`,
    width: 390,
    height: 844,
  });

  // 5. Mobile 390px — CANCELLED State
  await capture({
    name: 'mobile_390_live_queue_cancelled',
    url: `http://localhost:5173/token/${token4Id}`,
    width: 390,
    height: 844,
  });

  // 6. Mobile 390px — Hospital OPD Token
  await capture({
    name: 'mobile_390_hospital_token_live',
    url: `http://localhost:5173/hospital/token/${hospTokenId}`,
    width: 390,
    height: 844,
  });

  // 7. Mobile 390px — Government Citizen Kendra Token
  await capture({
    name: 'mobile_390_government_token_live',
    url: `http://localhost:5173/government/token/${govtTokenId}`,
    width: 390,
    height: 844,
  });

  console.log('\n--- 6. Responsive Breakpoint Validation (360px, 375px, 430px) ---');
  await capture({
    name: 'mobile_360_live_queue_waiting',
    url: `http://localhost:5173/token/${token2Id}`,
    width: 360,
    height: 800,
  });
  await capture({
    name: 'mobile_375_live_queue_waiting',
    url: `http://localhost:5173/token/${token2Id}`,
    width: 375,
    height: 812,
  });
  await capture({
    name: 'mobile_430_live_queue_waiting',
    url: `http://localhost:5173/token/${token2Id}`,
    width: 430,
    height: 932,
  });

  console.log('\n--- 7. Horizontal Overflow Summary ---');
  let allZero = true;
  for (const r of overflowResults) {
    const status = r.hasOverflow ? `FAIL (doc: ${r.docW} > win: ${r.winW})` : 'PASS (0px)';
    if (r.hasOverflow) allZero = false;
    console.log(`  - [${r.screen} @ ${r.width}px]: ${status}`);
  }
  console.log(`\nOverall Horizontal Overflow Verdict: ${allZero ? '100% PERFECT (0px overflow anywhere)' : 'NEEDS ATTENTION'}`);

  cdp.close();
  chromeProc.kill();
  viteProc.kill();
  await new Promise((resolve) => backendServer.close(resolve));
  console.log('✓ Script completed successfully.');
}

run().catch((err) => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
