/**
 * Frontend Realtime Subscription Service
 *
 * Connects to Shewwina's Server-Sent Events (SSE) stream endpoint:
 * GET /api/v1/queue/stream?ticket=...&public=true
 *
 * Security & Reconnection Architecture:
 * - Never passes long-lived JWTs or credentials in GET query strings.
 * - Authenticated subscribers exchange their JWT for a single-use short-lived stream ticket (TTL 60s).
 * - Public waiting room TV displays subscribe strictly via public=true and businessId.
 * - Reliable auto-reconnection: On unexpected disconnect, closes the defunct stream, requests a
 *   fresh single-use ticket via authenticated POST, and reconnects with bounded exponential backoff (2s, 4s, 8s).
 * - Immediate termination without retry on 401/403 ticket rejection or terminal token states.
 * - Clean unmount / unsubscribe cancels pending timers and prevents duplicate or orphan streams.
 */

const AUTH_TOKEN_KEY = 'shewwina_token';

export function getStoredToken() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(AUTH_TOKEN_KEY);
    }
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage.getItem(AUTH_TOKEN_KEY);
    }
  } catch (_) {
    return null;
  }
  return null;
}

const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_BASE_URL) ||
  '';

const SSE_BASE_URL = '';

/**
 * Subscribe to realtime queue events with reliable, ticket-safe auto-reconnection.
 *
 * @param {Object} options
 * @param {string} [options.tokenId] - Token ID to track (for customer)
 * @param {string} [options.businessId] - Business ID to track (for business dashboard or public display)
 * @param {boolean} [options.isPublic] - True for unauthenticated public waiting room display
 * @param {Function} [options.onUpdate] - Callback invoked when a queue event arrives: (eventData) => void
 * @param {Function} [options.onError] - Callback invoked on connection error: (error) => void
 * @param {Array<number>} [options._backoffDelays] - Custom backoff delays in ms (default: [2000, 4000, 8000])
 * @param {number} [options._maxRetries] - Maximum auto-reconnect retries (default: 3)
 * @param {string} [options._token] - Optional explicit auth token override (for testing/node env)
 * @param {string} [options._apiBaseUrl] - Optional API base URL override
 * @returns {Function} unsubscribe function to close the connection cleanly
 */
export function subscribeQueueRealtime({
  tokenId,
  businessId,
  isPublic = false,
  onUpdate,
  onError,
  _backoffDelays = [2000, 4000, 8000],
  _maxRetries = 3,
  _token,
  _apiBaseUrl,
}) {
  const EventSourceConstructor =
    (typeof window !== 'undefined' && window.EventSource) ||
    (typeof globalThis !== 'undefined' && globalThis.EventSource);

  if (!EventSourceConstructor) {
    return () => {};
  }

  if (!tokenId && !businessId) {
    return () => {};
  }

  const backoffDelays = Array.isArray(_backoffDelays) ? _backoffDelays : [2000, 4000, 8000];
  const maxRetries = typeof _maxRetries === 'number' ? _maxRetries : 3;
  const baseUrl = _apiBaseUrl !== undefined ? _apiBaseUrl : API_BASE_URL;

  let eventSource = null;
  let isClosed = false;
  let isConnecting = false;
  let isTerminal = false;
  let retryCount = 0;
  let reconnectTimer = null;

  function cleanupCurrentStream() {
    if (eventSource) {
      // Detach handlers to avoid spurious events during intentional closure
      eventSource.onerror = null;
      eventSource.onopen = null;
      try {
        eventSource.close();
      } catch (_) {
        /* ignore close errors */
      }
      eventSource = null;
    }
  }

  function scheduleReconnect(err) {
    if (isClosed || isTerminal) return;

    cleanupCurrentStream();

    if (retryCount >= maxRetries) {
      if (onError) {
        onError(new Error(`[Realtime] Max reconnection attempts (${maxRetries}) exceeded`));
      }
      return;
    }

    const delay = backoffDelays[retryCount] !== undefined ? backoffDelays[retryCount] : 8000;
    retryCount += 1;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (!isClosed && !isTerminal) {
        establishConnection();
      }
    }, delay);
  }

  async function establishConnection() {
    if (isClosed || isTerminal || isConnecting) return;
    isConnecting = true;

    cleanupCurrentStream();

    let streamUrl = `${baseUrl || SSE_BASE_URL}/api/v1/queue/stream`;

    // 1. Public TV display (unauthenticated, strictly businessId)
    if (isPublic && businessId) {
      streamUrl += `?businessId=${encodeURIComponent(businessId)}&public=true`;
    }
    // 2. Authenticated operator or customer stream via short-lived ticket
    else {
      let token = _token;
      if (token === undefined) {
        try {
          token = typeof getStoredToken === 'function' ? getStoredToken() : null;
        } catch (_) {
          token = null;
        }
      }

      if (!token) {
        isConnecting = false;
        if (onError) onError(new Error('Authentication token required for queue stream'));
        return; // Do NOT retry without an auth token
      }

      try {
        const ticketRes = await fetch(`${baseUrl}/api/v1/queue/stream-ticket`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tokenId, businessId }),
        });

        // 401 / 403: Explicit authentication or authorization failure -> do NOT enter infinite retry loop
        if (ticketRes.status === 401 || ticketRes.status === 403) {
          isConnecting = false;
          const errPayload = await ticketRes.json().catch(() => ({}));
          const error = new Error(errPayload?.message || `Forbidden or Unauthorized (HTTP ${ticketRes.status})`);
          error.status = ticketRes.status;
          if (onError) onError(error);
          return;
        }

        const ticketData = await ticketRes.json().catch(() => null);
        if (!ticketRes.ok || !ticketData?.success || !ticketData?.data?.ticket) {
          isConnecting = false;
          const error = new Error(ticketData?.message || 'Failed to obtain stream ticket');
          if (onError) onError(error);
          scheduleReconnect(error);
          return;
        }

        streamUrl += `?ticket=${encodeURIComponent(ticketData.data.ticket)}`;
      } catch (err) {
        isConnecting = false;
        if (onError) onError(err);
        scheduleReconnect(err);
        return;
      }
    }

    if (isClosed || isTerminal) {
      isConnecting = false;
      return;
    }

    try {
      const es = new EventSourceConstructor(streamUrl);
      eventSource = es;
      isConnecting = false;

      es.onopen = () => {
        // Reset retry count upon successful handshake
        retryCount = 0;
      };

      es.addEventListener('connected', () => {
        // Connected confirmation event also resets retry count
        retryCount = 0;
      });

      es.addEventListener('queue_update', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          const status = parsed?.status || parsed?.data?.status;
          // Halt reconnect if token reaches terminal state
          if (status && ['SERVED', 'COMPLETED', 'CANCELLED', 'SKIPPED'].includes(status)) {
            isTerminal = true;
          }
          if (onUpdate) {
            onUpdate(parsed);
          }
        } catch (err) {
          console.error('[Realtime] Failed to parse queue event data', err);
        }
      });

      es.onerror = (err) => {
        if (onError) {
          onError(err);
        }
        scheduleReconnect(err);
      };
    } catch (err) {
      isConnecting = false;
      if (onError) {
        onError(err);
      }
      scheduleReconnect(err);
    }
  }

  establishConnection();

  // Return clean unmount cleanup function
  return function unsubscribe() {
    isClosed = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    cleanupCurrentStream();
  };
}
