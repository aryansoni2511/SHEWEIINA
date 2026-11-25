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
const { createNotification } = await import('../backend/models/notificationModel.js');
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

  console.log('--- 3. Seeding Mobile Multi-Module Test Data ---');
  const ts = Date.now();

  // 1. Register Customer (Rohan Mehta)
  const custRes = await fetch('http://localhost:5000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rohan Mehta',
      email: `rohan_${ts}@gmail.com`,
      phone: '9820055111',
      password: 'Password123!',
    }),
  });
  const custData = await custRes.json();
  const customerToken = custData.data.token;
  const customerId = custData.data.user.id;

  // 2. Register Business (Salon & Spa)
  const bizRes = await fetch('http://localhost:5000/api/v1/auth/register-business', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Aarav Sharma',
      email: `aarav_biz_${ts}@shewwina.com`,
      phone: '9820099881',
      password: 'Password123!',
      businessName: 'Luxe Salon & Wellness Spa',
      category: 'salon',
      city: 'Mumbai',
    }),
  });
  const bizData = await bizRes.json();
  const bizToken = bizData.data.token;
  const bizId = bizData.data.business.id;
  const bizQueueId = bizData.data.queue.id;

  // Fetch Business services
  const bizSvcRes = await fetch(`http://localhost:5000/api/v1/business/services?businessId=${bizId}`);
  const bizSvcData = await bizSvcRes.json();
  const bizServiceId = bizSvcData.data?.services?.[0]?.id || 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  // Join Customer 1 (Rohan Mehta) to Business Queue
  const joinRes = await fetch('http://localhost:5000/api/v1/queue/join', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      businessId: bizId,
      queueId: bizQueueId,
      serviceId: bizServiceId,
      customerName: 'Rohan Mehta',
      customerPhone: '9820055111',
    }),
  });
  const joinData = await joinRes.json();
  const tokenId = joinData.data?.tokenId || 'tok-mob-default';

  // Join Customer 2 (Priya Sen) to have multiple cards in waiting list
  await fetch('http://localhost:5000/api/v1/queue/join', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      businessId: bizId,
      queueId: bizQueueId,
      serviceId: bizServiceId,
      customerName: 'Priya Sen',
      customerPhone: '9819922334',
    }),
  });

  // Seed Notifications for Rohan
  await createNotification({
    userId: customerId,
    type: 'CUSTOMER_JOINED_QUEUE',
    title: 'Digital Token Confirmed',
    message: 'Your token S-101 has been confirmed at Luxe Salon & Wellness Spa. Position #1 in line.',
  });
  await createNotification({
    userId: customerId,
    type: 'YOUR_TURN_APPROACHING',
    title: 'Almost Your Turn',
    message: 'You are next in line. Please proceed towards Chair 1.',
  });

  // 3. Register Hospital (Apollo Care Medical Center)
  const hospRes = await fetch('http://localhost:5000/api/v1/hospital/register-hospital', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hospitalName: `Apollo Care Multi-Specialty ${ts}`,
      registrationNumber: `REG-HOSP-${ts}`,
      hospitalType: 'Multi-Specialty',
      phone: '9820123456',
      email: `admin_${ts}@apollocare.org`,
      address: '77 Health Boulevard, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      latitude: 19.0596,
      longitude: 72.8295,
      facilities: ['Emergency 24x7', 'ICU', 'Pharmacy', 'Radiology'],
      adminName: 'Dr. Vikram Malhotra',
      adminEmail: `vikram_${ts}@apollocare.org`,
      adminPassword: 'Password123!',
      adminPhone: '9820123456',
    }),
  });
  const hospData = await hospRes.json();
  const hospToken = hospData.data?.token;
  const hospitalId = hospData.data?.hospital?.id;

  // Seed Hospital Token
  const hospitalTokenId = `htok-mob-${ts}`;
  mockHospitalStore.tokens.push({
    id: hospitalTokenId,
    queue_id: 'q-doc-101',
    hospital_id: hospitalId || 'hosp-101',
    doctor_id: 'doc-101',
    department_id: 'dept-101',
    patient_id: 'pat-101',
    patient_code: 'P-9021',
    patient_name: 'Rohan Mehta',
    patient_phone: '9820055111',
    token_number: 'OPD-102',
    sequence_number: 2,
    status: 'WAITING',
    position: 1,
    estimated_wait_minutes: 10,
    called_at: null,
    served_at: null,
    created_at: new Date().toISOString(),
  });

  // 4. Register Government Centre (Dadar Citizen Facilitation Kendra)
  const govtRes = await fetch('http://localhost:5000/api/v1/government/register-centre', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      centreName: `Dadar Citizen Facilitation Kendra ${ts}`,
      centreCode: `DDR-${ts.toString().slice(-4)}`,
      centreType: 'Citizen Facilitation Kendra',
      phone: '9820123456',
      email: `kendra_${ts}@shewwina.gov.in`,
      address: 'Civic Centre, Shivaji Park, Dadar West',
      city: 'Mumbai',
      district: 'Mumbai City',
      state: 'Maharashtra',
      pincode: '400028',
      latitude: 19.0280,
      longitude: 72.8390,
      supportedCategories: ['Aadhaar', 'Passport', 'RTO', 'Municipal'],
      adminName: 'Rajesh Kadam',
      adminEmail: `rajesh_${ts}@shewwina.org`,
      adminPassword: 'Password123!',
      adminPhone: '9820123456',
    }),
  });
  const govtData = await govtRes.json();
  const govtToken = govtData.data?.token;

  // Seed Government Token
  const gCentres = await searchGovernmentCentres();
  const gServices = await getAllGovernmentServices();
  const govtTokenCreated = await createGovernmentToken({
    centreId: gCentres[0]?.id,
    serviceId: gServices[0]?.id,
    citizenName: 'Rohan Mehta',
    citizenPhone: '9820055111',
  });
  const govtTokenId = govtTokenCreated?.id;

  console.log('✓ Seeding complete:');
  console.log(`  - Customer Token: ${tokenId} (User: Rohan Mehta)`);
  console.log(`  - Business ID: ${bizId} (Token: ${bizToken ? 'Valid' : 'None'})`);
  console.log(`  - Hospital Token: ${hospitalTokenId} (Token: ${hospToken ? 'Valid' : 'None'})`);
  console.log(`  - Govt Token: ${govtTokenId} (Token: ${govtToken ? 'Valid' : 'None'})`);

  console.log('--- 4. Launching Chrome Headless Browser ---');
  const tempProfile = path.join(process.env.TEMP || 'C:\\Temp', `chrome_dbg_mob_${Date.now()}`);
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

  async function capture({ name, url, width, height, token = null, clickSelector = null }) {
    clearAllRateLimitStores();
    console.log(`Capturing ${name} (${width}x${height}) at ${url}...`);

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: true,
    });

    if (token) {
      await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
      await sleep(600);
      await cdp.send('Runtime.evaluate', {
        expression: `localStorage.setItem('shewwina_token', '${token}');`,
      });
    } else {
      await cdp.send('Page.navigate', { url: 'http://localhost:5173/' });
      await sleep(400);
      await cdp.send('Runtime.evaluate', {
        expression: `localStorage.removeItem('shewwina_token');`,
      });
    }

    await cdp.send('Page.navigate', { url });
    await sleep(2200);

    if (clickSelector) {
      await cdp.send('Runtime.evaluate', {
        expression: `
          const el = document.querySelector('${clickSelector}');
          if (el) el.click();
        `,
      });
      await sleep(1500);
    }

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

    // Wait until content renders
    for (let i = 0; i < 20; i++) {
      const evalRes = await cdp.send('Runtime.evaluate', {
        expression: `document.body ? document.body.innerText.length : 0`,
      });
      if (evalRes?.result?.value > 150) break;
      await sleep(300);
    }
    await sleep(1200);

    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
    fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
    const stats = fs.statSync(filePath);
    console.log(`  ✓ Saved ${name}.png (${(stats.size / 1024).toFixed(1)} KB) | Overflow: ${ovData?.hasOverflow ? 'FAIL' : 'PASS (0px)'}`);
  }

  console.log('\n--- 5. Capturing 8 Primary Mobile 390px Redesign Views ---');

  // 1. Explore page with map and nearby service cards
  await capture({
    name: 'mobile_390_explore_map',
    url: 'http://localhost:5173/explore',
    width: 390,
    height: 844,
    clickSelector: 'button[aria-label="Map View"]',
  });

  // 2. Customer Dashboard
  await capture({
    name: 'mobile_390_customer_dashboard',
    url: 'http://localhost:5173/customer/dashboard',
    width: 390,
    height: 844,
    token: customerToken,
  });

  // 3. Digital Token / Live Queue Pass
  await capture({
    name: 'mobile_390_digital_token_pass',
    url: `http://localhost:5173/token/${tokenId}`,
    width: 390,
    height: 844,
  });

  // 4. Hospital Discovery
  await capture({
    name: 'mobile_390_hospital_discovery',
    url: 'http://localhost:5173/hospitals',
    width: 390,
    height: 844,
  });

  // 5. Government Discovery
  await capture({
    name: 'mobile_390_government_services',
    url: 'http://localhost:5173/government-services',
    width: 390,
    height: 844,
  });

  // 6. Business Dashboard (with mobile waiting customer cards)
  await capture({
    name: 'mobile_390_business_dashboard',
    url: 'http://localhost:5173/dashboard',
    width: 390,
    height: 844,
    token: bizToken,
  });

  // 7. Hospital Dashboard
  await capture({
    name: 'mobile_390_hospital_dashboard',
    url: 'http://localhost:5173/hospital/dashboard',
    width: 390,
    height: 844,
    token: hospToken,
  });

  // 8. Government Dashboard
  await capture({
    name: 'mobile_390_government_dashboard',
    url: 'http://localhost:5173/government/dashboard',
    width: 390,
    height: 844,
    token: govtToken,
  });

  console.log('\n--- 6. Capturing Responsive Breakpoint Validation (360px & 430px) ---');

  // 9. Narrow Breakpoint: 360px Digital Token Pass
  await capture({
    name: 'mobile_360_token_pass',
    url: `http://localhost:5173/token/${tokenId}`,
    width: 360,
    height: 800,
  });

  // 10. Narrow Breakpoint: 360px Explore Map
  await capture({
    name: 'mobile_360_explore_list',
    url: 'http://localhost:5173/explore',
    width: 360,
    height: 800,
  });

  // 11. Large Breakpoint: 430px Digital Token Pass
  await capture({
    name: 'mobile_430_token_pass',
    url: `http://localhost:5173/token/${tokenId}`,
    width: 430,
    height: 932,
  });

  console.log('\n--- 7. Horizontal Overflow Audit Summary ---');
  let allZeroOverflow = true;
  for (const r of overflowResults) {
    const status = r.hasOverflow ? `FAIL (doc: ${r.docW}px > win: ${r.winW}px)` : 'PASS (0px overflow)';
    if (r.hasOverflow) allZeroOverflow = false;
    console.log(`  - [${r.screen} @ ${r.width}px]: win=${r.winW}px, doc=${r.docW}px -> ${status}`);
  }
  console.log(`\nOverall Horizontal Overflow Verdict: ${allZeroOverflow ? '100% PERFECT (No overflow anywhere)' : 'NEEDS ATTENTION'}`);

  console.log('\n--- 8. Cleaning Up Processes ---');
  cdp.close();
  chromeProc.kill();
  viteProc.kill();
  await new Promise((resolve) => backendServer.close(resolve));
  console.log('✓ Capture script finished.');
}

run().catch((err) => {
  console.error('Fatal error during Mobile Redesign capture:', err);
  process.exit(1);
});
