import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';
import app from '../backend/app.js';
import { mockHospitalStore } from '../backend/models/hospitalModel.js';
import {
  searchGovernmentCentres,
  getAllGovernmentServices,
  createGovernmentToken,
} from '../backend/models/governmentModel.js';
import { createNotification } from '../backend/models/notificationModel.js';
import { clearAllRateLimitStores } from '../backend/middleware/rateLimiter.js';

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

  console.log('--- 1. Starting Backend API Server on Port 5000 ---');
  const backendServer = http.createServer(app);
  await new Promise((resolve) => backendServer.listen(5000, resolve));
  console.log('✓ Backend API server listening on http://localhost:5000');

  console.log('--- 2. Starting Vite Dev Server on Port 5173 ---');
  const viteProc = spawn('cmd.exe', ['/c', 'npx', 'vite', '--port', '5173', '--strictPort'], {
    stdio: 'ignore',
  });

  // Wait for Vite to be ready
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
  console.log('✓ Vite dev server ready on http://localhost:5173');

  console.log('--- 3. Seeding Realistic Multi-Module Phase 3 Data ---');
  const ts = Date.now();

  // 1. Register Clinic Business
  const bizRes = await fetch('http://localhost:5000/api/v1/auth/register-business', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Sunita Rao',
      email: `director_${ts}@apexclinic.com`,
      phone: '9820011888',
      password: 'Password123!',
      businessName: 'Apex Health & Wellness Clinic',
      category: 'clinic',
      city: 'Mumbai',
    }),
  });
  const bizData = await bizRes.json();
  const businessId = bizData.data.business.id;
  const queueId = bizData.data.queue.id;

  const svcRes = await fetch(`http://localhost:5000/api/v1/business/services?businessId=${businessId}`);
  const svcData = await svcRes.json();
  const serviceId = svcData.data.services[0].id;

  // 2. Register Customer Ananya
  const custRes = await fetch('http://localhost:5000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ananya Sharma',
      email: `ananya_${ts}@gmail.com`,
      phone: '9820044111',
      password: 'Password123!',
    }),
  });
  const custData = await custRes.json();
  const customerToken = custData.data.token;
  const customerId = custData.data.user.id;

  // 3. Customer Joins Queue -> Token S-101
  const joinRes = await fetch('http://localhost:5000/api/v1/queue/join', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      businessId,
      queueId,
      serviceId,
      customerName: 'Ananya Sharma',
      customerPhone: '9820044111',
    }),
  });
  const joinData = await joinRes.json();
  const clinicTokenId = joinData.data.tokenId;

  // 4. Seed In-App Notifications for Customer
  await createNotification({
    userId: customerId,
    type: 'CUSTOMER_JOINED_QUEUE',
    title: 'Digital Token Confirmed',
    message: 'Your token S-101 has been confirmed at Apex Health & Wellness Clinic. Position #1 in line.',
  });
  await createNotification({
    userId: customerId,
    type: 'YOUR_TURN_APPROACHING',
    title: 'Consultation Room Preparing',
    message: 'Dr. Sunita Rao is finishing previous consultation. Please proceed towards Waiting Bay B.',
  });

  // 5. Seed Hospital OPD Token
  const hospitalTokenId = `htok-p3-${ts}`;
  mockHospitalStore.tokens.push({
    id: hospitalTokenId,
    queue_id: 'q-doc-101',
    hospital_id: 'hosp-101',
    doctor_id: 'doc-101',
    department_id: 'dept-101',
    patient_id: 'pat-101',
    patient_code: 'P-4029',
    patient_name: 'Ananya Sharma',
    patient_phone: '9820044111',
    token_number: 'OPD-104',
    sequence_number: 4,
    status: 'WAITING',
    position: 2,
    estimated_wait_minutes: 15,
    called_at: null,
    served_at: null,
    created_at: new Date().toISOString(),
  });

  // 6. Seed Government Kendra Token via model to ensure DB consistency
  const gCentres = await searchGovernmentCentres();
  const gServices = await getAllGovernmentServices();
  const citizenPhone = '9820' + Math.floor(100000 + Math.random() * 900000);
  const govtToken = await createGovernmentToken({
    centreId: gCentres[0].id,
    serviceId: gServices[0].id,
    citizenName: 'Vikram Joshi',
    citizenPhone,
  });
  const govtTokenId = govtToken.id;

  console.log('✓ Seeding complete:');
  console.log(`  - Clinic Token: ${clinicTokenId}`);
  console.log(`  - Hospital Token: ${hospitalTokenId}`);
  console.log(`  - Govt Token: ${govtTokenId} (${govtToken.token_number})`);

  console.log('--- 4. Launching Chrome Headless Browser ---');
  const tempProfile = path.join(process.env.TEMP || 'C:\\Temp', `chrome_dbg_p3_${Date.now()}`);
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

  let connected = false;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const v = await fetch('http://127.0.0.1:9222/json/version');
      if (v.ok) {
        connected = true;
        break;
      }
    } catch (e) {}
  }
  if (!connected) {
    chromeProc.kill();
    throw new Error('Failed to connect to Chrome remote debugging port 9222');
  }

  // Create dedicated page target
  const targetRes = await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' });
  const target = await targetRes.json();
  const cdp = new CDPClient(target.webSocketDebuggerUrl);
  await cdp.connect();
  console.log('✓ Connected to Chrome DevTools Protocol via WebSocket page target');

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');

  // Helper to capture a page at given viewport
  async function capture({ name, url, width, height, setupStorage = null }) {
    clearAllRateLimitStores();
    console.log(`Capturing ${name} (${width}x${height}) at ${url}...`);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: width < 600,
    });

    await cdp.send('Page.navigate', { url });
    await sleep(2000);

    if (setupStorage) {
      await cdp.send('Runtime.evaluate', {
        expression: `(${setupStorage.toString()})();`,
      });
      await cdp.send('Page.navigate', { url });
      await sleep(2200);
    }

    // Wait until loading finishes and content is rendered
    for (let i = 0; i < 20; i++) {
      const evalRes = await cdp.send('Runtime.evaluate', {
        expression: `document.body ? document.body.innerText.length : 0`,
      });
      if (evalRes?.result?.value > 150) break;
      await sleep(400);
    }
    await sleep(1500);

    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
    fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
    const stats = fs.statSync(filePath);
    console.log(`  ✓ Saved ${name}.png (${(stats.size / 1024).toFixed(1)} KB)`);
  }

  const storageAuthSetup = `() => {
    localStorage.setItem('shewwina_token', '${customerToken}');
  }`;

  console.log('--- 5. Capturing Desktop 1440px Screenshots ---');
  // 1. Digital Token Pass (Core/Clinic)
  await capture({
    name: 'phase3_desktop_1440_token_pass',
    url: `http://localhost:5173/token/${clinicTokenId}`,
    width: 1440,
    height: 900,
  });

  // 2. Live Queue Tracking / Join
  await capture({
    name: 'phase3_desktop_1440_live_queue_tracking',
    url: `http://localhost:5173/join/${businessId}`,
    width: 1440,
    height: 900,
  });

  // 3. Customer Dashboard
  await capture({
    name: 'phase3_desktop_1440_customer_dashboard',
    url: `http://localhost:5173/customer/dashboard`,
    width: 1440,
    height: 900,
    setupStorage: storageAuthSetup,
  });

  // 4. Hospital OPD Token
  await capture({
    name: 'phase3_desktop_1440_hospital_token',
    url: `http://localhost:5173/hospital/token/${hospitalTokenId}`,
    width: 1440,
    height: 900,
  });

  // 5. Government Kendra Token
  await capture({
    name: 'phase3_desktop_1440_government_token',
    url: `http://localhost:5173/government/token/${govtTokenId}`,
    width: 1440,
    height: 900,
  });

  console.log('--- 6. Capturing Mobile 390px Screenshots ---');
  // 1. Digital Token Pass (Mobile)
  await capture({
    name: 'phase3_mobile_390_token_pass',
    url: `http://localhost:5173/token/${clinicTokenId}`,
    width: 390,
    height: 844,
  });

  // 2. Live Queue Tracking / Join (Mobile)
  await capture({
    name: 'phase3_mobile_390_live_queue_tracking',
    url: `http://localhost:5173/join/${businessId}`,
    width: 390,
    height: 844,
  });

  // 3. Customer Dashboard (Mobile)
  await capture({
    name: 'phase3_mobile_390_customer_dashboard',
    url: `http://localhost:5173/customer/dashboard`,
    width: 390,
    height: 844,
    setupStorage: storageAuthSetup,
  });

  // 4. Hospital OPD Token (Mobile)
  await capture({
    name: 'phase3_mobile_390_hospital_token',
    url: `http://localhost:5173/hospital/token/${hospitalTokenId}`,
    width: 390,
    height: 844,
  });

  // 5. Government Kendra Token (Mobile)
  await capture({
    name: 'phase3_mobile_390_government_token',
    url: `http://localhost:5173/government/token/${govtTokenId}`,
    width: 390,
    height: 844,
  });

  console.log('--- 7. Cleaning Up Processes ---');
  cdp.close();
  chromeProc.kill();
  viteProc.kill();
  await new Promise((resolve) => backendServer.close(resolve));
  console.log('✓ All 10 screenshots captured successfully.');
}

run().catch((err) => {
  console.error('Fatal error during Phase 3 evidence capture:', err);
  process.exit(1);
});
