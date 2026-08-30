import test from 'node:test';
import assert from 'node:assert';
import app from '../app.js';
import {
  notifyCustomerJoinedQueue,
  notifyTurnApproaching,
  notifyCustomerCalled,
  notifyServiceCompleted,
  notifyQueueCancelled,
  processGetCustomerNotifications,
} from '../services/notificationService.js';

test('Phase 6A Customer Notifications API & Lifecycle Suite', async (t) => {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const ts = Date.now();
  const customerAEmail = `custA_notif_${ts}@example.com`;
  const customerBEmail = `custB_notif_${ts}@example.com`;
  const businessEmail = `bizowner_notif_${ts}@example.com`;
  const pass = 'Password123!';

  let customerAToken = '';
  let customerBToken = '';
  let customerAId = '';
  let customerBId = '';
  let businessToken = '';
  let businessId = '';
  let queueId = '';
  let serviceId = '';

  try {
    // 0. Setup: Register Business, Customer A, Customer B
    const bizRes = await fetch(`${baseUrl}/api/v1/auth/register-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Notification Test Business',
        email: businessEmail,
        phone: '+919900998877',
        password: pass,
        businessName: 'Apex Health Clinic',
        category: 'clinic',
        city: 'Bengaluru',
      }),
    });
    const bizData = await bizRes.json();
    businessToken = bizData.data.token;
    businessId = bizData.data.business.id;
    queueId = bizData.data.queue.id;

    const svcRes = await fetch(`${baseUrl}/api/v1/business/services?businessId=${businessId}`);
    const svcData = await svcRes.json();
    serviceId = svcData.data.services[0].id;

    // Register Customer A
    const regARes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Customer Alice',
        email: customerAEmail,
        phone: '+919911223344',
        password: pass,
      }),
    });
    const regAData = await regARes.json();
    customerAToken = regAData.data.token;
    customerAId = regAData.data.user.id;

    // Register Customer B
    const regBRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Customer Bob',
        email: customerBEmail,
        phone: '+919955667788',
        password: pass,
      }),
    });
    const regBData = await regBRes.json();
    customerBToken = regBData.data.token;
    customerBId = regBData.data.user.id;

    // 1. Unauthenticated request returns 401
    await t.test('Unauthenticated request to /api/v1/customer/notifications returns 401', async () => {
      const res = await fetch(`${baseUrl}/api/v1/customer/notifications`);
      assert.strictEqual(res.status, 401);
    });

    // 2. Business user accessing customer notifications returns 403
    await t.test('Business user accessing /api/v1/customer/notifications returns 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/v1/customer/notifications`, {
        headers: { Authorization: `Bearer ${businessToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    // 3. Queue event creates CUSTOMER_JOINED_QUEUE notification for Customer A
    let tokenANumber = '';
    let tokenAId = '';
    await t.test('Customer A joins queue and receives CUSTOMER_JOINED_QUEUE notification', async () => {
      const joinRes = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerAToken}`,
        },
        body: JSON.stringify({
          businessId,
          queueId,
          serviceId,
          customerName: 'Customer Alice',
          customerPhone: '+919911223344',
        }),
      });

      assert.strictEqual(joinRes.status, 201);
      const joinData = await joinRes.json();
      tokenANumber = joinData.data.tokenNumber;
      tokenAId = joinData.data.tokenId;

      // Check notifications endpoint for Customer A
      const notifRes = await fetch(`${baseUrl}/api/v1/customer/notifications`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      assert.strictEqual(notifRes.status, 200);
      const notifData = await notifRes.json();
      assert.strictEqual(notifData.success, true);
      assert.ok(notifData.data.notifications.length >= 1);
      const joinNotif = notifData.data.notifications.find((n) => n.type === 'CUSTOMER_JOINED_QUEUE');
      assert.ok(joinNotif);
      assert.strictEqual(joinNotif.isRead, false);
      assert.ok(joinNotif.message.includes(tokenANumber));
    });

    // 4. Customer Data Isolation: Customer B cannot see Customer A's notifications
    await t.test('Customer B cannot see Customer A notifications (Isolation)', async () => {
      const notifBRes = await fetch(`${baseUrl}/api/v1/customer/notifications`, {
        headers: { Authorization: `Bearer ${customerBToken}` },
      });
      assert.strictEqual(notifBRes.status, 200);
      const notifBData = await notifBRes.json();
      assert.strictEqual(notifBData.data.notifications.length, 0);
      assert.strictEqual(notifBData.data.unreadCount, 0);
    });

    // 5. Customer B joins queue and Customer A is called -> triggers notifications
    let tokenBNumber = '';
    await t.test('Queue progression triggers CUSTOMER_CALLED and YOUR_TURN_APPROACHING notifications', async () => {
      // Customer B joins
      const joinB = await fetch(`${baseUrl}/api/v1/queue/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerBToken}`,
        },
        body: JSON.stringify({
          businessId,
          queueId,
          serviceId,
          customerName: 'Customer Bob',
          customerPhone: '+919955667788',
        }),
      });
      const joinBData = await joinB.json();
      tokenBNumber = joinBData.data.tokenNumber;

      // Business calls next token (Alice is called)
      const callRes = await fetch(`${baseUrl}/api/v1/business/queue/next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${businessToken}`,
        },
        body: JSON.stringify({ businessId, queueId }),
      });
      assert.strictEqual(callRes.status, 200);

      // Verify Alice received CUSTOMER_CALLED
      const notifAlice = await fetch(`${baseUrl}/api/v1/customer/notifications`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      const dataAlice = await notifAlice.json();
      const calledNotif = dataAlice.data.notifications.find((n) => n.type === 'CUSTOMER_CALLED');
      assert.ok(calledNotif, 'CUSTOMER_CALLED notification should exist for Alice');

      // Verify Bob received YOUR_TURN_APPROACHING
      const notifBob = await fetch(`${baseUrl}/api/v1/customer/notifications`, {
        headers: { Authorization: `Bearer ${customerBToken}` },
      });
      const dataBob = await notifBob.json();
      const approachingNotif = dataBob.data.notifications.find((n) => n.type === 'YOUR_TURN_APPROACHING');
      assert.ok(approachingNotif, 'YOUR_TURN_APPROACHING notification should exist for Bob');
    });

    // 6. Service completion triggers SERVICE_COMPLETED notification
    await t.test('Business completing service triggers SERVICE_COMPLETED notification for Alice', async () => {
      const compRes = await fetch(`${baseUrl}/api/v1/business/queue/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${businessToken}`,
        },
        body: JSON.stringify({ businessId, queueId }),
      });
      assert.strictEqual(compRes.status, 200);

      const notifAlice = await fetch(`${baseUrl}/api/v1/customer/notifications`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      const dataAlice = await notifAlice.json();
      const compNotif = dataAlice.data.notifications.find((n) => n.type === 'SERVICE_COMPLETED');
      assert.ok(compNotif, 'SERVICE_COMPLETED notification should exist for Alice');
    });

    // 7. Mark single notification as read
    let aliceNotifId = '';
    await t.test('Customer A can mark own notification as read', async () => {
      const notifAlice = await fetch(`${baseUrl}/api/v1/customer/notifications`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      const dataAlice = await notifAlice.json();
      aliceNotifId = dataAlice.data.notifications[0].id;

      const readRes = await fetch(`${baseUrl}/api/v1/customer/notifications/${aliceNotifId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      assert.strictEqual(readRes.status, 200);
      const readData = await readRes.json();
      assert.strictEqual(readData.data.isRead, true);

      // Verify unread count decreases
      const afterRes = await fetch(`${baseUrl}/api/v1/customer/notifications`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      const afterData = await afterRes.json();
      const updatedNotif = afterData.data.notifications.find((n) => n.id === aliceNotifId);
      assert.strictEqual(updatedNotif.isRead, true);
    });

    // 8. Customer B cannot mark Customer A's notification as read (403 / Isolation)
    await t.test('Customer B cannot mark Customer A notification as read (403 Forbidden)', async () => {
      const crossReadRes = await fetch(`${baseUrl}/api/v1/customer/notifications/${aliceNotifId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${customerBToken}` },
      });
      assert.strictEqual(crossReadRes.status, 403);
    });

    // 9. Mark all notifications as read
    await t.test('Customer A can mark all remaining notifications as read', async () => {
      const markAllRes = await fetch(`${baseUrl}/api/v1/customer/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      assert.strictEqual(markAllRes.status, 200);

      const checkRes = await fetch(`${baseUrl}/api/v1/customer/notifications`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      const checkData = await checkRes.json();
      assert.strictEqual(checkData.data.unreadCount, 0);
      assert.ok(checkData.data.notifications.every((n) => n.isRead === true));
    });

    // 10. Duplicate notification prevention test
    await t.test('Duplicate notification triggers are prevented for the same milestone and token', async () => {
      const beforeRes = await fetch(`${baseUrl}/api/v1/customer/notifications`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      const beforeData = await beforeRes.json();
      const initialCount = beforeData.data.total;

      // Attempt to trigger duplicate joined notification for the same token
      await notifyCustomerJoinedQueue({
        userId: customerAId,
        tokenNumber: tokenANumber,
        position: 1,
        estimatedWaitMinutes: 0,
        businessName: 'Apex Health Clinic',
      });

      const afterRes = await fetch(`${baseUrl}/api/v1/customer/notifications`, {
        headers: { Authorization: `Bearer ${customerAToken}` },
      });
      const afterData = await afterRes.json();
      assert.strictEqual(afterData.data.total, initialCount, 'Duplicate notification should not increase total count');
    });

    // 11. Customer token cancellation creates QUEUE_CANCELLED notification
    await t.test('Customer B cancelling token creates QUEUE_CANCELLED notification', async () => {
      // Find Bob's active token
      const activeBRes = await fetch(`${baseUrl}/api/v1/customer/active-token`, {
        headers: { Authorization: `Bearer ${customerBToken}` },
      });
      const activeBData = await activeBRes.json();
      const bobTokenId = activeBData.data.tokenId;

      const cancelRes = await fetch(`${baseUrl}/api/v1/queue/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerBToken}`,
        },
        body: JSON.stringify({ tokenId: bobTokenId }),
      });
      assert.strictEqual(cancelRes.status, 200);

      const notifBob = await fetch(`${baseUrl}/api/v1/customer/notifications`, {
        headers: { Authorization: `Bearer ${customerBToken}` },
      });
      const dataBob = await notifBob.json();
      const cancelNotif = dataBob.data.notifications.find((n) => n.type === 'QUEUE_CANCELLED');
      assert.ok(cancelNotif, 'QUEUE_CANCELLED notification should exist for Bob');
    });

  } finally {
    server.close();
  }
});
