# Shewwina Phase 7B Realtime Diagnosis

---

## 1. Expected Flow

```
Business clicks "Call Next Customer"
  -> Frontend: callNextCustomer(businessId, queueId)
      -> POST /api/v1/business/queue/next
  -> Backend: handleCallNextCustomer (businessQueueController.js)
      -> processCallNextCustomer (queueService.js)
          -> callNextWaitingToken() — DB: token status WAITING -> SERVING
          -> realtimeService.broadcastQueueEvent({ type: 'CUSTOMER_CALLED', tokenId, businessId })
              -> iterates all connected SSE clients
              -> sends 'queue_update' event to:
                  (a) client.businessId === businessId  [business dashboard]
                  (b) ALL client.tokenId subscribers    [all customer token pages]
  -> Customer browser (TokenStatusPage / CustomerDashboardPage):
      -> EventSource open on /api/v1/queue/stream?tokenId=<id>
      -> Receives 'queue_update' SSE event (type: 'CUSTOMER_CALLED')
      -> onUpdate() fires -> fetchTokenStatus() called
      -> setTokenData({ status: 'SERVING' }) -> React re-render
      -> UI shows SERVING status + "IT'S YOUR TURN!" banner
```

---

## 2. Actual Flow

```
Business clicks "Call Next Customer"
  -> POST /api/v1/business/queue/next           OK - DB updated correctly
  -> processCallNextCustomer fires               OK - token changed to SERVING
  -> realtimeService.broadcastQueueEvent called  OK - SSE tests confirm this works
  -> SSE route GET /api/v1/queue/stream          OK - registered in queueRoutes.js

CUSTOMER BROWSER SIDE -- WHERE IT BREAKS:

  -> subscribeQueueRealtime({ tokenId }) called in TokenStatusPage.jsx line 53
  -> new EventSource('http://localhost:5000/api/v1/queue/stream?tokenId=...')
     (because VITE_API_BASE_URL=http://localhost:5000 is set in .env)
  -> EventSource connects OK; backend registers client with tokenId
  -> Business clicks Call Next -> CUSTOMER_CALLED event broadcast
  -> EventSource receives the event -> onUpdate() fires

  *** RACE CONDITION BEGINS ***

  onUpdate() calls fetchTokenStatus(false) [ASYNC function]
     |
     V
  fetchTokenStatus() awaits getTokenStatus(tokenId) -- async network call
     |
     V [Meanwhile, BEFORE the network call returns...]
  setTokenData({ status: 'SERVING' }) is queued by React
     |
     V
  React re-render fires. tokenData?.status changed (WAITING -> SERVING).
     |
     V
  useEffect dependency array [tokenId, tokenData?.status, soundEnabled]
  detects the change. THE CLEANUP FUNCTION RUNS IMMEDIATELY:
     - isMounted = false         <-- KEY
     - unsubscribe()             <-- EventSource CLOSED
     - clearInterval(interval)   <-- Polling STOPPED
     |
     V
  fetchTokenStatus() async fetch finally resolves.
  Inside: if (isMounted) { setTokenData(data); }
              ^^^^^^^^
  isMounted is NOW FALSE. setTokenData is NOT called.
     |
     V
  The UI does NOT update. Customer still sees WAITING.

  The useEffect re-runs: new EventSource opened, new interval started.
  The polling fallback will update the UI after ~5 seconds.
  Until then -- no update.

ALSO: stale closure bug in polling interval:
    tokenData captured at useEffect init time is the OLD tokenData.
    The terminal-status check (tokenData?.status === 'SERVED' etc.)
    never works correctly -- tokenData in the closure is always stale.
```

---

## 3. Exact Root Cause

**Primary (Critical):** `tokenData?.status` is included in the `useEffect` dependency array at [TokenStatusPage.jsx line 89](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/frontend/pages/TokenStatusPage.jsx).

This causes the entire SSE subscription + polling interval to be torn down and rebuilt every time the token status changes. The teardown sets `isMounted = false` **before** the in-flight `fetchTokenStatus()` async call resolves, causing the `setTokenData()` state update to be silently suppressed. The UI never updates until the next polling interval fires (~5 seconds later).

**Secondary:** `VITE_API_BASE_URL=http://localhost:5000` in `.env` causes `EventSource` to connect directly cross-origin to the backend (bypassing Vite proxy). The CORS config allows this so it does not cause a hard failure -- but the direct connection bypasses Vite's proxy buffering logic, which is a fragility risk.

**Tertiary (dead code):** `broadcastQueueEvent` for `QUEUE_SETTINGS_UPDATED` in `processUpdateQueueSettings` is unreachable -- it appears after a `return` statement (lines 724-736 of queueService.js).

---

## 4. Evidence

| # | File | Line(s) | Issue |
|---|------|---------|-------|
| 1 | [TokenStatusPage.jsx](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/frontend/pages/TokenStatusPage.jsx) | 89 | `tokenData?.status` in useEffect deps -> subscription torn down on every status change |
| 2 | [TokenStatusPage.jsx](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/frontend/pages/TokenStatusPage.jsx) | 55-59 | `if (isMounted)` guard in `onUpdate` suppresses `setTokenData` after cleanup runs |
| 3 | [TokenStatusPage.jsx](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/frontend/pages/TokenStatusPage.jsx) | 65 | `tokenData` in polling closure is stale -- captured at effect init, never updated |
| 4 | [.env](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/.env) | 4 | `VITE_API_BASE_URL=http://localhost:5000` forces EventSource cross-origin, bypasses Vite proxy |
| 5 | [realtime.js](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/frontend/services/realtime.js) | 16 | `API_BASE_URL` fallback `''` is correct but overridden by the .env value |
| 6 | [queueService.js](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/backend/services/queueService.js) | 724-736 | `broadcastQueueEvent` for `QUEUE_SETTINGS_UPDATED` is dead code (after `return`) |
| 7 | [realtimeService.js](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/backend/services/realtimeService.js) | 90-124 | CORRECT -- backend broadcast delivers to all `tokenId` subscribers |

**Backend Test Results (all 7 pass -- confirms bug is frontend-only):**

```
OK  GET /api/v1/queue/stream without params returns 400
OK  GET /api/v1/queue/stream with businessId but no auth returns 403
OK  Customer can open SSE stream for specific tokenId
OK  Business can connect to SSE stream with valid Bearer token
OK  Calling next customer triggers realtime queue_update event  <- CRITICAL
OK  Client disconnect automatically removes client from realtime registry
OK  Phase 7B Realtime Queue Updates Test Suite
    tests: 7  pass: 7  fail: 0
```

---

## 5. Existing Function That Should Be Reused

All of these are correct -- **no duplication needed:**

| Function | File | Status |
|----------|------|--------|
| `subscribeQueueRealtime` | frontend/services/realtime.js | Keep unchanged |
| `fetchTokenStatus` | TokenStatusPage.jsx | Keep unchanged |
| `fetchDashboardData` | CustomerDashboardPage.jsx | Keep unchanged |
| `broadcastQueueEvent` | backend/services/realtimeService.js | Keep unchanged |
| `processCallNextCustomer` | backend/services/queueService.js | Keep unchanged |
| `handleQueueStream` | backend/controllers/realtimeController.js | Keep unchanged |

---

## 6. Proposed Minimal Fix

### Fix 1 (Critical) -- TokenStatusPage.jsx useEffect dependency array

**File:** [frontend/pages/TokenStatusPage.jsx](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/frontend/pages/TokenStatusPage.jsx)

```diff
- }, [tokenId, tokenData?.status, soundEnabled]);
+ }, [tokenId]);
```

Additionally, replace the stale `tokenData` closure in the polling interval with a `useRef`-based terminal flag, and remove the `isMounted` guard from `onUpdate`:

```js
// Add at top of component alongside hasPlayedChimeRef:
const isTerminalRef = useRef(false);

// Replace the useEffect (lines 47-89) with:
useEffect(() => {
  isTerminalRef.current = false;
  hasPlayedChimeRef.current = false;

  fetchTokenStatus();

  const unsubscribe = subscribeQueueRealtime({
    tokenId,
    onUpdate: () => {
      // No isMounted guard: fetchTokenStatus is safe to call.
      // setTokenData on an unmounted component produces a harmless React
      // warning (not a crash) and the new subscription handles fresh state.
      fetchTokenStatus(false);
    },
  });

  const interval = setInterval(() => {
    if (isTerminalRef.current) {
      clearInterval(interval);
      return;
    }
    getTokenStatus(tokenId)
      .then((res) => {
        const data = res.data;
        setTokenData(data);
        if (['SERVED', 'CANCELLED', 'SKIPPED'].includes(data?.status)) {
          isTerminalRef.current = true;
        }
        if (data?.status === 'SERVING' && !hasPlayedChimeRef.current && soundEnabled) {
          hasPlayedChimeRef.current = true;
          playCounterChime();
        }
      })
      .catch(() => {});
  }, 5000);

  return () => {
    unsubscribe();
    clearInterval(interval);
  };
}, [tokenId]);   // ONLY tokenId -- SSE/polling stable for the lifetime of tokenId
```

Key changes:
- Remove `tokenData?.status` and `soundEnabled` from deps -- subscription is stable
- Remove `isMounted` entirely -- no more race condition with async fetch
- Use `isTerminalRef` (a stable ref, never stale) for polling termination

### Fix 2 (Secondary) -- realtime.js SSE URL should use relative path

**File:** [frontend/services/realtime.js](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/frontend/services/realtime.js)

```diff
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
+ // SSE must always use relative path to go through Vite proxy
+ const SSE_BASE_URL = '';

  ...

- const url = `${API_BASE_URL}/api/v1/queue/stream?${params.join('&')}`;
+ const url = `${SSE_BASE_URL}/api/v1/queue/stream?${params.join('&')}`;
```

### Fix 3 (Minor) -- queueService.js dead code after return

**File:** [backend/services/queueService.js](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/backend/services/queueService.js)

Move `realtimeService.broadcastQueueEvent(...)` from after `return` (lines 724-736) to before the `return` statement, and fix variable reference from `result` to `updated`:

```diff
+ realtimeService.broadcastQueueEvent({
+   businessId: business.id,
+   queueId: queue.id,
+   type: 'QUEUE_SETTINGS_UPDATED',
+   data: {
+     isOpen: Boolean(updated.is_open),
+     name: updated.name,
+     tokenPrefix: updated.token_prefix || 'S',
+   },
+ });
+
  return {
    id: updated.id,
    businessId: updated.business_id,
    name: updated.name,
    isOpen: Boolean(updated.is_open),
    ...
  };
-
- // DEAD CODE removed (was after return, never executed):
- realtimeService.broadcastQueueEvent({ ... });
- return result;
```

---

## 7. Why The Fix Will Not Duplicate Existing Logic

- **No new functions created.** `subscribeQueueRealtime`, `fetchTokenStatus`, `broadcastQueueEvent` are all kept exactly as-is.
- **No new EventSource created.** The same `subscribeQueueRealtime` is called -- we only stop tearing it down unnecessarily.
- **No new polling added.** The existing `setInterval` is kept; only its stale closure is fixed via `useRef`.
- **No backend changes for Fix 1 or 2.** The entire fix is in the frontend `useEffect` dependency array.
- **Fix 2** only changes the URL prefix string for SSE -- no new logic, no new functions.
- **Fix 3** is dead-code relocation + variable name correction -- no behavioral change except enabling the already-intended broadcast.

---

## 8. Tests Required

### Run existing tests (do NOT modify):

```
node --test backend/tests/realtime.test.js
```

All 7 must continue to pass.

### Manual verification after fix:

1. Customer opens `/token/<tokenId>` -- confirm SSE indicator "Live (5s)" visible
2. Open browser DevTools -> Network -> filter `stream` -> confirm exactly **one** persistent SSE connection (not being repeatedly torn down and recreated)
3. Business clicks **Call Next Customer**
4. **Within less than 1 second:** Customer page shows `SERVING` status and the "IT'S YOUR TURN!" banner appears WITHOUT any manual refresh
5. Confirm `CustomerDashboardPage` also updates instantly (its `useEffect` deps are `[activeToken?.tokenId]` -- this page is NOT affected by the bug but verify it also works)

---

## 9. Risk To Existing Features

| Feature | Risk | Notes |
|---------|------|-------|
| TokenStatusPage SSE updates | Low | Only removing extra deps; SSE still connects on mount |
| TokenStatusPage polling | Low | Stale closure fixed with `isTerminalRef`; polling still runs every 5s |
| CustomerDashboardPage | None | Its `useEffect` deps are `[activeToken?.tokenId]` -- not affected |
| Business Dashboard SSE | None | Backend broadcast unchanged |
| Cancel Token flow | None | Unrelated |
| All 7 backend realtime tests | None | No backend changes for Fix 1 and 2 |
| Queue Settings broadcast | Very Low | Fix 3 makes existing intended code reachable; no behavioral regression for other features |

---

## 10. Final Recommendation

The backend SSE pipeline is **confirmed working end-to-end** by 7 passing tests. The backend:
- Correctly registers customer SSE clients by `tokenId`
- Correctly broadcasts `CUSTOMER_CALLED` to all `tokenId` subscribers
- Correctly formats and delivers `queue_update` SSE events

**The failure is entirely in the frontend -- in `TokenStatusPage.jsx`.**

### Root Cause Summary

| Bug | Location | Severity |
|-----|----------|----------|
| `tokenData?.status` in useEffect deps -> isMounted race condition suppresses state update | [TokenStatusPage.jsx:89](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/frontend/pages/TokenStatusPage.jsx) | Critical |
| Stale `tokenData` closure in polling interval terminal-check | [TokenStatusPage.jsx:65](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/frontend/pages/TokenStatusPage.jsx) | Medium |
| `VITE_API_BASE_URL=http://localhost:5000` causes EventSource to bypass Vite proxy | [.env:4](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/.env) / [realtime.js:16](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/frontend/services/realtime.js) | Medium |
| `broadcastQueueEvent` for `QUEUE_SETTINGS_UPDATED` is dead code after `return` | [queueService.js:724](file:///c:/Users/guddu/OneDrive/Desktop/Sheweiina/backend/services/queueService.js) | Low |

---

## **READY TO FIX -- root cause identified**

The primary fix is removing `tokenData?.status` from the `useEffect` dependency array in `TokenStatusPage.jsx` (line 89) and replacing the stale `tokenData` closure in the polling interval with a stable `useRef` flag.

The secondary fix is making the SSE `EventSource` always use a relative URL so it routes through Vite's dev proxy, consistent with how all other API calls behave in development.

These two fixes will make the customer token page update **instantly** (sub-second) when the business clicks Call Next -- using the existing SSE infrastructure without any new functions or duplicated logic.
