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

  console.log('--- 3. Seeding Test Customer & Multi-Module Providers ---');
  const ts = Date.now();

  // Register Customer Rohan Mehta
  const custRes = await fetch('http://localhost:5000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rohan Mehta',
      email: `rohan_explore_${ts}@gmail.com`,
      phone: '9820055111',
      password: 'Password123!',
    }),
  });
  const custData = await custRes.json();
  const customerToken = custData.data?.token;

  // Register Salon Business
  await fetch('http://localhost:5000/api/v1/auth/register-business', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Aarav Sharma',
      email: `aarav_explore_${ts}@shewwina.com`,
      phone: '9820099881',
      password: 'Password123!',
      businessName: 'Luxe Salon & Wellness Spa',
      category: 'salon',
      city: 'Mumbai',
    }),
  });

  console.log('✓ Seeding complete: Customer Token acquired');

  console.log('--- 4. Launching Chrome Headless Browser ---');
  const tempProfile = path.join(process.env.TEMP || 'C:\\Temp', `chrome_dbg_phase3_${Date.now()}`);
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

  async function capture({ name, url, width, height, mobile = true, token = null }) {
    clearAllRateLimitStores();
    console.log(`Capturing ${name} (${width}x${height}) at ${url}...`);

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile,
    });

    if (token) {
      await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
      await sleep(500);
      await cdp.send('Runtime.evaluate', {
        expression: `localStorage.setItem('shewwina_token', '${token}');`,
      });
    }

    await cdp.send('Page.navigate', { url });
    await sleep(2500);

    // Wait until providers and map render
    for (let i = 0; i < 15; i++) {
      const evalRes = await cdp.send('Runtime.evaluate', {
        expression: `document.querySelectorAll('article').length`,
      });
      if (evalRes?.result?.value > 0) break;
      await sleep(300);
    }
    await sleep(1200);

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

  console.log('\n--- 5. Capturing Explore Screen Evidence ---');

  // 1. Mobile 390px — Map & Nearby Cards Together with Greeting
  await capture({
    name: 'mobile_390_explore_map_and_cards',
    url: 'http://localhost:5173/explore',
    width: 390,
    height: 844,
    token: customerToken,
  });

  // 2. Desktop 1440px — Map & Nearby Cards Together
  await capture({
    name: 'desktop_1440_explore_map_and_cards',
    url: 'http://localhost:5173/explore',
    width: 1440,
    height: 900,
    mobile: false,
    token: customerToken,
  });

  console.log('\n--- 6. Responsive Breakpoint Validation (360px, 375px, 430px) ---');
  await capture({
    name: 'mobile_360_explore_responsive',
    url: 'http://localhost:5173/explore',
    width: 360,
    height: 800,
    token: customerToken,
  });
  await capture({
    name: 'mobile_375_explore_responsive',
    url: 'http://localhost:5173/explore',
    width: 375,
    height: 812,
    token: customerToken,
  });
  await capture({
    name: 'mobile_430_explore_responsive',
    url: 'http://localhost:5173/explore',
    width: 430,
    height: 932,
    token: customerToken,
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
