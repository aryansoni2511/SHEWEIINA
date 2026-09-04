/**
 * Frontend Realtime Subscription Service
 *
 * Connects to Shewwina's Server-Sent Events (SSE) stream endpoint:
 * GET /api/v1/queue/stream?businessId=...&tokenId=...&public=true
 *
 * Resilient Architecture:
 * - Uses browser native EventSource. Zero extra client libraries.
 * - Handles auto-reconnect on network drops.
 * - Dispatches 'queue_update' callbacks immediately to trigger fresh REST state retrieval.
 * - Provides clean unsubscribe cleanup on component unmount.
 */

import { getStoredToken } from './api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// SSE connections must always use a relative URL so they go through the Vite
// dev proxy (localhost:5173 -> localhost:5000). Using the full absolute URL
// from VITE_API_BASE_URL would bypass the proxy and can cause cross-origin
// issues with EventSource. In production the relative URL resolves to the same
// origin, which is also correct.
const SSE_BASE_URL = '';

/**
 * Subscribe to realtime queue events.
 *
 * @param {Object} options
 * @param {string} [options.tokenId] - Token ID to track (for customer)
 * @param {string} [options.businessId] - Business ID to track (for business dashboard or public display)
 * @param {boolean} [options.isPublic] - True for unauthenticated public waiting room display
 * @param {Function} options.onUpdate - Callback invoked when a queue event arrives: (eventData) => void
 * @param {Function} [options.onError] - Callback invoked on connection error
 * @returns {Function} unsubscribe function to close the connection cleanly
 */
export function subscribeQueueRealtime({ tokenId, businessId, isPublic = false, onUpdate, onError }) {
  if (typeof window === 'undefined' || !window.EventSource) {
    return () => {};
  }

  if (!tokenId && !businessId) {
    return () => {};
  }

  const params = [];
  if (tokenId) params.push(`tokenId=${encodeURIComponent(tokenId)}`);
  if (businessId) params.push(`businessId=${encodeURIComponent(businessId)}`);

  // Attach stored token if business dashboard (not public display)
  const token = getStoredToken();
  if (businessId && token && !isPublic) {
    params.push(`token=${encodeURIComponent(token)}`);
  } else if (isPublic || (businessId && !token)) {
    params.push('public=true');
  }

  const url = `${SSE_BASE_URL}/api/v1/queue/stream?${params.join('&')}`;

  let eventSource = null;
  let isClosed = false;

  function connect() {
    if (isClosed) return;

    try {
      eventSource = new EventSource(url);

      eventSource.addEventListener('queue_update', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (onUpdate) {
            onUpdate(parsed);
          }
        } catch (err) {
          console.error('[Realtime] Failed to parse queue event data', err);
        }
      });

      eventSource.onerror = (err) => {
        if (onError) {
          onError(err);
        }
      };
    } catch (err) {
      if (onError) {
        onError(err);
      }
    }
  }

  connect();

  // Return clean unmount cleanup function
  return function unsubscribe() {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}
