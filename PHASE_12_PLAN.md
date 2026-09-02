# Phase 12 Implementation Plan
## Public Live Waiting Room Display & TV Counter Signage (Smart TV / Reception Kiosk Mode)

---

## 1. Executive Summary & Objective

### Phase 12 Title
**"Public Live Waiting Room Display & TV Counter Signage (Smart TV / Reception Kiosk Mode)"**

### Objective
Provide physical salons, clinics, and customer-service venues with a dedicated, full-screen, real-time public waiting room display (`/display/:businessId` or `/live/:businessId`) designed to run on wall-mounted smart TVs, monitors, and reception tablets. The display delivers an unmistakable, high-contrast visual and audio callout system ("NOW SERVING #S-104"), an "UP NEXT" waiting list with estimated wait times, an on-screen QR code for direct walk-in check-in, and strict customer PII protection (masked names, zero exposed phone numbers), powered by the existing Server-Sent Events (SSE) realtime infrastructure.

---

## 2. Problem Statement: The Physical Waiting Room Disconnect

### The Real-World Gap in Phase 11
With Phase 10 (QR entry) and Phase 11 (SMS/WhatsApp alerts) complete, Shewwina works well on mobile devices. However, a glaring physical limitation exists inside the venue:
1. **Lobby Crowding & Disorientation**: Customers sitting in the salon waiting lounge or clinic reception cannot see who is currently being served or where they stand in line without continuously checking their phones.
2. **Receptionist Fatigue**: Front-desk staff must repeatedly yell customer names across loud hair-dryers or crowded waiting areas.
3. **No Safe Screen Mode**: Currently, if a merchant wants to display the queue on a wall-mounted TV, they have only two choices:
   - Show `/dashboard`: Exposes confidential customer phone numbers, full names, service revenue, and admin action buttons ("Call Next", "Complete", "Settings") to everyone in the room. This is a severe security and privacy violation.
   - Show `/token/:tokenId`: Shows only a single customer's token, not the whole room's queue.
4. **Walk-in Discovery**: Customers entering the venue often overlook a small paper poster on the desk. A glowing, 55-inch smart TV displaying live queue numbers and a dynamic "Scan to Join" QR code commands immediate attention.

---

## 3. Why This Phase Must Come Next

In the physical service industry (salons, barber shops, diagnostic centers, dental clinics, bank branches), **the digital display board IS the queue management system**.
- **Phase 10** solved Queue Entry (How customers get in).
- **Phase 11** solved Queue Mobility (How customers leave the waiting room and receive alerts).
- **Phase 12** solves In-Lobby Experience (How customers inside the venue see and hear their turn called).

Together, Phases 10, 11, and 12 complete the **entire physical-to-digital customer lifecycle**, making Shewwina a complete product ready for a real commercial trial.

---

## 4. User Stories

### A) The Customer in the Waiting Lounge
> *"As a walk-in salon client waiting on the sofa, I want to glance up at the wall TV to see which token is currently inside and see my token in the 'Up Next' list with an accurate wait time, accompanied by an audible chime when my number is called, so that I don't have to keep staring at my phone or worry that I'll miss my turn."*

### B) The Salon / Clinic Receptionist
> *"As a front-desk receptionist, I want to mount a TV screen or tablet on the wall showing the live queue board, without having to log in on the TV or expose customer phone numbers and admin buttons, so that customers stay calm, orderly, and informed without constantly asking me 'How much longer?'"*

### C) The Venue Owner / Manager
> *"As a clinic owner, I want a branded, professional, full-screen digital signage display that showcases my clinic's name, doctor availability, queue speed, and an on-screen QR code for new walk-ins, elevating our brand perception from a chaotic waiting room to an organized, high-end experience."*

---

## 5. Current vs. Proposed Architecture

### Current State
```
┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│       Merchant Laptop / Mobile       │       │        Customer Personal Phone       │
│              /dashboard              │       │            /token/:tokenId           │
│   (Requires Login, Shows All PII)    │       │     (Only shows single user token)   │
└──────────────────┬───────────────────┘       └──────────────────┬───────────────────┘
                   │                                              │
                   └───────────────────────┬──────────────────────┘
                                           │
                                           ▼
                                 Backend REST & SSE API
                               (/api/v1/business/queue [AUTH])
```

### Proposed Phase 12 Architecture
```
┌──────────────────────────────────────┐       ┌──────────────────────────────────────────────┐
│       Merchant Private Station       │       │    Public Wall-Mounted TV / Monitor Kiosk    │
│              /dashboard              │       │            /display/:businessId              │
│    (Full Admin Controls + Config)    │       │   (Public, Read-Only, Full-Screen, Masked)   │
└──────────────────┬───────────────────┘       └──────────────────────┬───────────────────────┘
                   │                                                  │
                   ▼                                                  ▼
      Protected Admin Routes                        Public Display Endpoint (Safe PII Masking)
     /api/v1/business/queue/next                     GET /api/v1/queue/display/:businessId
     /api/v1/business/queue/complete                                  │
                   │                                                  │
                   └───────────────────────┬──────────────────────────┘
                                           │
                                           ▼
                        Realtime SSE Fan-out Engine
                       /api/v1/queue/stream?businessId=...
                   (Pushes instantaneous CUSTOMER_CALLED events
                       with 0ms latency to TV Display)
```

---

## 6. Exact Files to Create and Modify

### New Files to Create
1. [`frontend/pages/PublicDisplayPage.jsx`](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/frontend/pages/PublicDisplayPage.jsx)
   - High-contrast, full-screen digital signage view for smart TVs and reception monitors.
   - Giant "NOW SERVING" spotlight box with animated serving pulse and counter details.
   - "UP NEXT" waiting queue column showing token numbers, masked customer names ("Rohan V."), service names, and wait times.
   - Top Bar: Business name, category badge, live clock (HH:MM:SS), Queue OPEN/CLOSED indicator.
   - Side/Bottom Badge: High-resolution QR code ("Scan to Join") linking directly to that business's `/join/:businessId`.
   - Audio Announcer: Audio chime + Web Speech API synthesized voice ("Now serving Token S-104, please proceed").
   - TV Controls: Fullscreen toggle (`requestFullscreen`), Audio mute/unmute toggle, Dark/Light display mode.
2. [`backend/tests/publicDisplay.test.js`](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/backend/tests/publicDisplay.test.js)
   - Regression test suite (12+ tests) verifying public queue display data retrieval, strict PII masking (names masked, phone numbers omitted), UUID and slug resolution, closed queue state handling, and SSE public connectivity.

### Existing Files to Modify
1. [`backend/services/queueService.js`](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/backend/services/queueService.js)
   - Add `processGetPublicQueueDisplay(businessId)`:
     - Resolves business by ID or slug.
     - Retrieves active serving token and waiting tokens.
     - Strictly masks names (`"Rahul Sharma"` ➔ `"Rahul S."`) and omits customer phone numbers and user IDs.
     - Returns queue metadata, AI wait insights, and sanitized token list.
2. [`backend/controllers/customerQueueController.js`](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/backend/controllers/customerQueueController.js)
   - Add `handleGetPublicQueueDisplay(req, res, next)`.
3. [`backend/routes/customerQueueRoutes.js`](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/backend/routes/customerQueueRoutes.js)
   - Register public route `GET /display/:businessId`.
4. [`frontend/services/api.js`](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/frontend/services/api.js)
   - Add `getPublicQueueDisplayApi(businessId)`.
5. [`frontend/App.jsx`](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/frontend/App.jsx)
   - Add route `<Route path="/display/:businessId" element={<PublicDisplayPage />} />`.
   - Add route `<Route path="/live/:businessId" element={<PublicDisplayPage />} />` (convenience alias).
6. [`frontend/pages/BusinessDashboardPage.jsx`](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/frontend/pages/BusinessDashboardPage.jsx)
   - Add a **📺 TV Display** button in the dashboard header row alongside "Customer QR", allowing the owner to launch or copy the TV display URL with a single click.

---

## 7. Existing Functions to Reuse

- `findBusinessById` & `findBusinessBySlug` in [`backend/models/queueModel.js`](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/backend/models/queueModel.js).
- `findTokensByQueueId` in [`backend/models/queueModel.js`](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/backend/models/queueModel.js).
- `subscribeQueueRealtime({ businessId, onUpdate })` in [`frontend/services/realtime.js`](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/frontend/services/realtime.js): Already supports SSE events keyed by `businessId`.
- `playCounterChime()` in [`frontend/utils/audioChime.js`](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/frontend/utils/audioChime.js): Reusable counter alert audio.
- `<QRCodeSVG>` from `qrcode.react`: Generates the on-screen TV join QR code.
- `aiService.analyzeQueueInsights`: Feeds throughput and load level directly onto the TV status bar.

---

## 8. New Functions Required

1. `maskCustomerName(name)` in [`backend/utils/mask.js`](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/backend/utils/mask.js) (or within `queueService.js`):
   - Example: `"Rahul Sharma"` ➔ `"Rahul S."`, `"Pooja"` ➔ `"Pooja"`, `""` ➔ `"Guest Customer"`.
2. `processGetPublicQueueDisplay(businessId)` in `backend/services/queueService.js`:
   - Builds sanitized, PII-free payload for public displays.
3. `handleGetPublicQueueDisplay` in `backend/controllers/customerQueueController.js`.
4. `announceTokenCallout(tokenNumber, counterName)` in `PublicDisplayPage.jsx`:
   - Web Speech API speech synthesis (`window.speechSynthesis.speak(...)`) with fallback to audio chime.

---

## 9. API Specification

### `GET /api/v1/queue/display/:businessId`
- **Authentication**: None (Public endpoint).
- **Rate Limit**: General limiter (100 req/min).

#### Success Response (200 OK):
```json
{
  "success": true,
  "message": "Public queue display retrieved successfully",
  "data": {
    "business": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "name": "Shewwina Salon & Spa",
      "slug": "demo",
      "category": "salon",
      "city": "Mumbai"
    },
    "queue": {
      "id": "d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
      "name": "Main Express Queue",
      "isOpen": true,
      "tokenPrefix": "S",
      "avgServiceDuration": 15
    },
    "serving": {
      "tokenId": "e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55",
      "tokenNumber": "S-101",
      "customerName": "Rahul S.",
      "service": "Haircut & Styling",
      "calledAt": "2026-09-01T10:30:00.000Z"
    },
    "waiting": [
      {
        "position": 1,
        "tokenNumber": "S-102",
        "customerName": "Pooja K.",
        "service": "Beard Trim & Grooming",
        "estimatedWaitMinutes": 15
      },
      {
        "position": 2,
        "tokenNumber": "S-103",
        "customerName": "Amit P.",
        "service": "Haircut & Styling",
        "estimatedWaitMinutes": 30
      }
    ],
    "stats": {
      "waitingCount": 2,
      "servingCount": 1,
      "totalTokensToday": 3,
      "loadLevel": "OPTIMAL"
    }
  }
}
```

---

## 10. Security & Privacy Safeguards

1. **Strict Customer PII Masking**:
   - Phone numbers are **NEVER** returned in the public display API response (neither full nor masked).
   - Customer names are masked to first name + last initial (`"Aarav Mehta"` ➔ `"Aarav M."`).
   - User account IDs and email addresses are omitted.
2. **Zero Administrative Action**:
   - The public display page contains **no mutations**: no call next button, no complete button, no cancel button.
   - It is purely a read-only visual projection.
3. **No Authentication Required on TV**:
   - Reception smart TVs do not need to store JWTs, cookies, or owner passwords. If a TV restarts or clears cache, it automatically reloads the public display URL without requiring staff intervention.

---

## 11. Audio & Media Strategy

1. **Auto-Play Browser Policy Compliance**:
   - Modern browsers block unmuted audio autoplay without user gesture.
   - The TV display features an intuitive **"🔊 Enable Audio Announcements"** banner on initial load. Once clicked (or when entering Fullscreen mode), audio is unlocked for the session.
2. **Dual Audio Layer**:
   - **Layer 1: Digital Counter Chime**: Pleasant two-tone chime (`playCounterChime()`) to draw eyes to the screen.
   - **Layer 2: Text-to-Speech Voice**: Browser-native `SpeechSynthesis` ("Now serving Token S-101"). Configurable in display settings.

---

## 12. Testing Strategy

1. **API Unit & Regression Tests** (`backend/tests/publicDisplay.test.js`):
   - Verify public display endpoint returns 200 without Authorization header.
   - Verify phone numbers are completely absent from response JSON.
   - Verify customer names are properly masked (`FirstName + Initial`).
   - Verify slug resolution works (`/api/v1/queue/display/demo`).
   - Verify non-existent business returns 404 cleanly.
   - Verify closed queue returns `isOpen: false` indicator.
2. **Realtime Sync Verification**:
   - Calling next customer on `/dashboard` updates `/display/:businessId` within <500ms via SSE.
3. **Regression Requirement**:
   - All **170 existing tests** across all 17 test files must continue to pass with 0 failures. Target after Phase 12: **~182+ passing tests**.
4. **Production Build**:
   - Clean Vite production build with 0 errors.

---

## 13. Definition of Done (DoD)

- [ ] `processGetPublicQueueDisplay` created in `queueService.js` with strict PII masking.
- [ ] Public endpoint `GET /api/v1/queue/display/:businessId` created and verified.
- [ ] `PublicDisplayPage.jsx` implemented with "NOW SERVING", "UP NEXT", QR code, and audio chime.
- [ ] Routes `/display/:businessId` and `/live/:businessId` registered in `App.jsx`.
- [ ] "📺 TV Display" quick-access button added to `BusinessDashboardPage.jsx` header.
- [ ] All 170 previous automated tests pass.
- [ ] 12+ new public display tests pass (182+ tests total).
- [ ] Production Vite build succeeds with 0 errors.
- [ ] Local manual testing verified on dual windows (Dashboard calling tokens ➔ TV Screen updating with chime).

---

## 14. What Phase 12 Will NOT Include (Scope Boundary)

- Will NOT include multi-counter staff hardware terminals (reserved for Phase 13).
- Will NOT include commercial video advertisements on TV display (keep focused on queue flow).
- Will NOT include paid subscription paywalls.
- Will NOT include two-way customer chat.

---

## 15. Future Phases Roadmap After Phase 12

- **Phase 13**: Multi-Counter & Multi-Staff Assignment (Stations, Chairs, Doctors).
- **Phase 14**: Business Analytics & Daily Revenue Reporting.
- **Phase 15**: Automated Business Operating Hours & Queue Scheduling.
- **Phase 16**: Custom Vanity Slug Editor & Business Public Profile.

---
*(End of Plan)*
