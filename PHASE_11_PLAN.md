# Phase 11 Implementation Plan
## Real-World Customer Alerting & Gateway Integration (SMS & WhatsApp Engine)

---

## 1. Executive Summary & Objective

### Objective
Enable salons and clinics to keep walk-in customers informed via real SMS and WhatsApp messages without requiring them to remain inside the waiting lobby or keep their mobile screens unlocked. The system will support a zero-cost local **MOCK** mode, cost-effective Indian domestic SMS (**Fast2SMS**), international SMS/WhatsApp (**Twilio**), and official **WhatsApp Cloud API**, while maintaining strict failure isolation so queue transactions never fail due to third-party communication gateway errors.

---

## 2. The Real-World Problem Being Solved

### The Salon / Clinic Waiting Reality in India
In Phase 10, Shewwina introduced QR-based customer entry. A customer scans the front desk QR code, picks a service, enters their phone number, and receives a digital token.

However, in real-world Indian salons and clinics:
1. **Wait times are 20 to 60+ minutes**: Customers do not want to sit in a crowded waiting area. They prefer to wait at a nearby tea stall, juice corner, shopping market, or car.
2. **Mobile screens go to sleep**: The web browser tab drops SSE connections when minimized or when the phone screen locks.
3. **Missed turns cause disputes**: If a customer wanders outside and does not hear the receptionist call their number, they miss their slot, delaying everyone and causing frustration.
4. **Current limitation**: Currently, `messagingService.js` is pure `console.log` mock. If a customer locks their phone, they receive **zero external communication**.

### How Phase 11 Solves This
Shewwina becomes a true "Out-of-Lobby Mobility" system:
- **Instant Confirmation**: Customer gets an SMS/WhatsApp upon joining with their token number and tracking link.
- **Approaching Alert**: When 2 people are ahead (configurable), an alert wakes up their phone: *"Your turn is approaching! 2 customers ahead."*
- **Called Alert**: When called by the stylist or doctor: *"It's your turn! Please proceed to Chair 2."*
- **Fail-Safe & Non-Intrusive**: No spam; clear transactional updates; failure isolation ensures queue never blocks.

---

## 3. Current Architecture vs. Proposed Architecture

### Current State (Baseline)
```
Queue Event (join, call, complete, skip, cancel)
       │
       ▼
notificationService.js
       │
       ├─► notificationModel.js (In-app DB record — only if userId != null)
       │
       └─► messagingService.js
                 │
                 ▼
          [SMS][MOCK] console.log
          [WHATSAPP][MOCK] console.log
          (No real HTTP calls; empty provider stubs)
```

### Proposed Phase 11 Architecture
```
Queue Event (join, call, complete, skip, cancel)
       │
       ▼
notificationService.js
       │  (Checks business queue alert settings: sms_enabled, whatsapp_enabled, threshold)
       ▼
messagingService.js
       │  (Validates phone, applies per-phone rate limit & template formatter)
       ▼
  Provider Router (Environment / Config Driven)
       │
       ├─► [MOCK] ────────────► Console log + in-memory store (Test / Dev default)
       ├─► [Fast2SMS] ────────► Fast2SMS Quick/DLT SMS API (Indian domestic)
       ├─► [Twilio] ──────────► Twilio Programmable Messaging (Global SMS / WA)
       └─► [WhatsApp Cloud] ──► Meta Graph API (Official WhatsApp Templates)
       │
       ▼
  (Failure Isolation: All dispatches are wrapped in non-blocking try/catch)
```

---

## 4. Exact Files to Create and Modify

### New Files to Create
1. `backend/services/messaging/fast2smsProvider.js`
   - Handles HTTP POST to Fast2SMS API (`https://www.fast2sms.com/dev/bulkV2`).
   - Supports both Quick SMS route (for testing without DLT) and DLT template route.
2. `backend/services/messaging/twilioProvider.js`
   - Handles standard HTTP REST call to Twilio Messages endpoint for SMS and WhatsApp.
3. `backend/services/messaging/whatsappCloudProvider.js`
   - Meta Cloud API adapter for WhatsApp business notifications.
4. `backend/services/messaging/messageTemplates.js`
   - Centralized template strings for: `CUSTOMER_JOINED`, `TURN_APPROACHING`, `CUSTOMER_CALLED`, `SERVICE_COMPLETED`, and `QUEUE_CANCELLED`.
5. `backend/tests/messagingGateway.test.js`
   - Comprehensive unit and integration test suite for messaging adapters, templates, failure isolation, and settings toggles.
6. `database/migrations/006_notification_settings.sql`
   - Schema addition for queue-level notification preferences.

### Existing Files to Modify
1. `backend/services/messagingService.js`
   - Connect the real provider adapters to `sendSMS` and `sendWhatsApp`.
   - Add per-phone dispatch rate-limiting (prevents duplicate spam within 30 seconds).
2. `backend/services/notificationService.js`
   - Respect business queue preferences (`smsNotificationsEnabled`, `whatsappNotificationsEnabled`, `turnAlertThreshold`).
3. `backend/models/queueModel.js`
   - Update `updateQueueConfig` and `findQueueById` to include notification configuration columns with `mockStore` fallbacks.
4. `backend/services/queueService.js`
   - Update `processGetQueueSettings` and `processUpdateQueueSettings` to expose notification controls.
5. `frontend/pages/BusinessDashboardPage.jsx`
   - In "Queue Config" modal: Add checkboxes for SMS Notifications, WhatsApp Notifications, and Alert Threshold slider (1-3 customers ahead).
6. `frontend/services/api.js`
   - Pass new notification settings fields in `updateQueueSettingsApi`.

---

## 5. Existing Functions to Reuse

- `normalizePhoneNumber(phone)` in `backend/utils/phone.js`: Standardizes Indian numbers (`+91...`).
- `isValidPhoneNumber(phone)` in `backend/utils/phone.js`: Validates 10-12 digit numbers.
- `dispatchCustomerAlert(...)` in `backend/services/messagingService.js`: Unified non-blocking dispatcher.
- `notifyCustomerJoinedQueue`, `notifyTurnApproaching`, `notifyCustomerCalled`, etc. in `notificationService.js`: Existing trigger points.
- `updateQueueSettingsApi` & `getQueueSettingsApi` in `frontend/services/api.js`: Existing queue configuration endpoints.
- `mockStore` pattern in `backend/models/queueModel.js`: Offline development without database connection.

---

## 6. API Changes

### `GET /api/v1/business/queue/settings` (Modified Response)
```json
{
  "success": true,
  "data": {
    "name": "Main Queue",
    "isOpen": true,
    "tokenPrefix": "S",
    "maxDailyCapacity": 200,
    "avgServiceDuration": 15,
    "smsNotificationsEnabled": true,
    "whatsappNotificationsEnabled": false,
    "turnAlertThreshold": 2
  }
}
```

### `PUT /api/v1/business/queue/settings` (Modified Request Body)
```json
{
  "name": "Main Queue",
  "isOpen": true,
  "tokenPrefix": "S",
  "maxDailyCapacity": 200,
  "avgServiceDuration": 15,
  "smsNotificationsEnabled": true,
  "whatsappNotificationsEnabled": true,
  "turnAlertThreshold": 2
}
```

### `POST /api/v1/business/messaging/test` (New Protected Endpoint)
Allows a business owner to test their configured gateway credentials by sending a sample alert to their own phone number.
```json
{
  "channel": "SMS",
  "testPhone": "9876543210"
}
```

---

## 7. Database Changes (Migration 006)

```sql
-- Migration 006: Add Notification & Messaging Settings to Queues Table
BEGIN;

ALTER TABLE queues
  ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS turn_alert_threshold INTEGER NOT NULL DEFAULT 2
    CHECK (turn_alert_threshold >= 1 AND turn_alert_threshold <= 5);

COMMIT;
```

*(Includes corresponding in-memory `mockStore` defaults in `queueModel.js` so zero-db offline development works immediately).*

---

## 8. UI Changes in Frontend

### Business Dashboard — "Queue Config" Modal
Add a clean "Customer Communication Preferences" section:
- **Enable SMS Alerts**: Toggle switch with brief description (*"Send automatic SMS alerts when customer token is confirmed, approaching, and called"*).
- **Enable WhatsApp Alerts**: Toggle switch (*"Send WhatsApp alerts via official WhatsApp API"*).
- **Approaching Alert Threshold**: Dropdown selector:
  - `1 customer ahead (approx. 10-15 mins)`
  - `2 customers ahead (approx. 20-30 mins - Recommended)`
  - `3 customers ahead (approx. 30-45 mins)`
- **Test Alert Button**: Quick test to verify their gateway connectivity.

---

## 9. Environment Variables Specification

| Variable | Required in Dev? | Default | Purpose |
|---|---|---|---|
| `SMS_PROVIDER` | No | `mock` | `mock`, `fast2sms`, `twilio` |
| `FAST2SMS_API_KEY` | No (only if fast2sms) | (empty) | API key from Fast2SMS dashboard |
| `FAST2SMS_ROUTE` | No | `q` | `q` (Quick SMS) or `dlt` (Registered DLT) |
| `TWILIO_ACCOUNT_SID` | No (only if twilio) | (empty) | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | No (only if twilio) | (empty) | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER`| No (only if twilio) | (empty) | Twilio SMS sender number |
| `WHATSAPP_PROVIDER` | No | `mock` | `mock`, `whatsapp_cloud`, `twilio` |
| `WHATSAPP_CLOUD_ACCESS_TOKEN` | No | (empty) | Meta Cloud API Bearer Token |
| `WHATSAPP_PHONE_NUMBER_ID` | No | (empty) | Meta Cloud Phone ID |
| `MESSAGING_COOLDOWN_SECONDS` | No | `30` | Per-phone anti-spam throttling |

---

## 10. Security & Anti-Abuse Protections

1. **Anti-Spam / Rate Limiting per Phone Number**:
   - Customers or bad actors cannot spam a target phone number by joining repeatedly.
   - An in-memory sliding cooldown (`MESSAGING_COOLDOWN_SECONDS = 30`) rejects repeated alerts to the same phone within a short window.
2. **Tenant Isolation**:
   - Business owners can only trigger and configure messaging for their own queue.
3. **No PII or Sensitive Data in External Alerts**:
   - Messages only contain business name, token number, position, and tracking URL. No payment info, customer full names, or auth tokens.
4. **Credential Isolation**:
   - API keys exist strictly on the backend. No provider secrets are ever leaked to the frontend client.

---

## 11. Failure & Fallback Behavior

- **Non-Blocking Promise Execution**: External messaging is dispatched via `Promise.allSettled` / `.catch(() => {})`. If Fast2SMS or Twilio returns 500 or network timeout, the main queue operation (`callNext`, `complete`, `join`) **always completes with HTTP 200/201**.
- **Graceful MOCK Fallback**: If an API key is invalid or unset, the service automatically falls back to `MOCK` mode and logs a warning rather than throwing an uncaught exception.

---

## 12. Testing Strategy

1. **Mock Mode Unit Tests**:
   - Test that calling `sendSMS` and `sendWhatsApp` in `mock` mode records messages in `sentMessages`.
2. **Provider Adapter Tests**:
   - Mock HTTP responses (success 200, gateway 401, gateway 500, network timeout) to verify adapter error handling without real credits.
3. **Template Formatting Tests**:
   - Validate that each of the 5 queue events generates the exact expected text with proper token number and business name.
4. **Business Preferences Tests**:
   - Verify that when `sms_notifications_enabled = false`, no SMS is dispatched when next customer is called.
5. **Anti-Spam Tests**:
   - Rapidly dispatching 3 alerts to the same phone within 5 seconds only sends 1 message.
6. **Regression Guard**:
   - Ensure all **152 existing tests** continue to pass without changes.

---

## 13. Definition of Done (DoD)

- [ ] `backend/services/messaging/fast2smsProvider.js` created and verified.
- [ ] `backend/services/messaging/twilioProvider.js` created and verified.
- [ ] `backend/services/messaging/messageTemplates.js` created and verified.
- [ ] `messagingService.js` updated with multi-provider router and cooldown cache.
- [ ] `notificationService.js` respects queue-level communication preferences.
- [ ] Queue settings endpoint updated with notification toggles.
- [ ] Frontend Business Dashboard displays communication toggles and threshold controls.
- [ ] `database/migrations/006_notification_settings.sql` written with `mockStore` support.
- [ ] All 152 existing regression tests pass.
- [ ] New messaging gateway tests pass (target: ~165+ tests total).
- [ ] Production Vite build completes with 0 errors.

---
*(End of Plan)*
