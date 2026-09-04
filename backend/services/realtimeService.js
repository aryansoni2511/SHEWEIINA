import { EventEmitter } from 'events';

/**
 * Realtime Event Bus & SSE Client Registry
 *
 * Architecture:
 * - Uses Node.js native EventEmitter. Zero new external dependencies.
 * - Manages active HTTP SSE (Server-Sent Events) subscriber response streams.
 * - Scopes events:
 *     - businessId: Business dashboard & public display subscribers for that specific business/tenant
 *     - tokenId: Customer token tracking subscribers for that specific token
 * - Zero PII: Broadcast payloads contain only identifiers, statuses, and recalculation signals.
 */

class RealtimeService extends EventEmitter {
  constructor() {
    super();
    // In-memory set of connected SSE client objects:
    // { id, res, businessId, tokenId, isPublic, connectedAt }
    this.clients = new Map();
    this.clientIdCounter = 1;

    // Periodic heartbeat to prevent proxies/browsers from timing out inactive SSE connections
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 25000);

    // Prevent interval from keeping the process alive if all else is closed
    if (this.heartbeatInterval.unref) {
      this.heartbeatInterval.unref();
    }
  }

  /**
   * Register a new SSE subscriber response stream
   */
  registerClient({ res, businessId = null, tokenId = null, isPublic = false }) {
    const clientId = `client_${Date.now()}_${this.clientIdCounter++}`;

    const client = {
      id: clientId,
      res,
      businessId: businessId ? String(businessId) : null,
      tokenId: tokenId ? String(tokenId) : null,
      isPublic: Boolean(isPublic),
      connectedAt: new Date(),
    };

    this.clients.set(clientId, client);

    // Send initial connected confirmation event
    this.sendToClient(client, 'connected', {
      clientId,
      subscribedAt: client.connectedAt.toISOString(),
      businessId: client.businessId,
      tokenId: client.tokenId,
      isPublic: client.isPublic,
    });

    return clientId;
  }

  /**
   * Remove a subscriber on client disconnect
   */
  removeClient(clientId) {
    if (this.clients.has(clientId)) {
      this.clients.delete(clientId);
    }
  }

  /**
   * Send a formatted SSE message to a specific client
   */
  sendToClient(client, eventType, data) {
    try {
      if (!client.res.writableEnded) {
        client.res.write(`event: ${eventType}\n`);
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    } catch (err) {
      this.removeClient(client.id);
    }
  }

  /**
   * Broadcast a queue update event to interested clients
   * Scoped strictly:
   * - Business & Public TV display subscribers receive events matching their businessId
   * - Customer subscribers receive events matching their tokenId OR if queue recalculated
   * - Zero PII: Only status codes, token numbers, sequence counters, and timestamps
   */
  broadcastQueueEvent({ businessId, queueId = null, tokenId = null, type, data = {} }) {
    const payload = {
      type,
      businessId: businessId ? String(businessId) : null,
      queueId: queueId ? String(queueId) : null,
      tokenId: tokenId ? String(tokenId) : null,
      timestamp: new Date().toISOString(),
      ...data,
    };

    for (const client of this.clients.values()) {
      let shouldDeliver = false;

      // 1. Business Dashboard or Public Display subscriber: matches businessId
      if (client.businessId && String(client.businessId) === String(businessId)) {
        shouldDeliver = true;
      }

      // 2. Customer Token subscriber:
      // - matches exact tokenId
      // - OR if the event is a general queue recalculation / next called / skip for this queue
      if (client.tokenId) {
        if (tokenId && String(client.tokenId) === String(tokenId)) {
          shouldDeliver = true;
        } else if (['CUSTOMER_CALLED', 'CUSTOMER_SKIPPED', 'SERVICE_COMPLETED', 'QUEUE_CANCELLED', 'QUEUE_SETTINGS_UPDATED', 'CUSTOMER_JOINED'].includes(type)) {
          shouldDeliver = true;
        }
      }

      if (shouldDeliver) {
        this.sendToClient(client, 'queue_update', payload);
      }
    }
  }

  /**
   * Send ping keep-alive comment to all active clients
   */
  sendHeartbeat() {
    for (const client of this.clients.values()) {
      try {
        if (!client.res.writableEnded) {
          client.res.write(': ping\n\n');
        } else {
          this.removeClient(client.id);
        }
      } catch (err) {
        this.removeClient(client.id);
      }
    }
  }

  /**
   * Return number of currently connected subscribers (useful for diagnostics & tests)
   */
  getClientCount() {
    return this.clients.size;
  }
}

export const realtimeService = new RealtimeService();
export default realtimeService;
