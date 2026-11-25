import crypto from 'crypto';

/**
 * Short-Lived Single-Use SSE Stream Ticket Manager
 *
 * Security Architecture:
 * - Native browser EventSource cannot send custom HTTP Authorization headers.
 * - Long-lived JWTs must NEVER be passed in GET query parameters (avoids URL logging, proxy leakage).
 * - Instead, authenticated clients request a single-use, narrowly-scoped stream ticket (TTL 60s).
 * - The ticket is consumed and invalidated immediately upon SSE connection handshake.
 */
class TicketService {
  constructor() {
    this.tickets = new Map();

    // Clean up expired tickets periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 30000);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Issue a new single-use stream ticket for an authenticated client
   */
  createTicket({ userId, role, tokenId = null, businessId = null, queueId = null, module = 'salon' }) {
    const ticketId = `sst_${crypto.randomBytes(24).toString('hex')}`;
    const expiresAt = Date.now() + 60000; // 60 seconds TTL

    const ticket = {
      id: ticketId,
      userId: userId ? String(userId) : null,
      role: role || 'CUSTOMER',
      tokenId: tokenId ? String(tokenId) : null,
      businessId: businessId ? String(businessId) : null,
      queueId: queueId ? String(queueId) : null,
      module: module || 'salon',
      expiresAt,
    };

    this.tickets.set(ticketId, ticket);
    return ticket;
  }

  /**
   * Consume a ticket during SSE stream establishment (single-use)
   */
  consumeTicket(ticketId) {
    if (!ticketId || typeof ticketId !== 'string') return null;
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return null;

    // Single-use: delete immediately upon consumption
    this.tickets.delete(ticketId);

    if (Date.now() > ticket.expiresAt) {
      return null; // Expired ticket rejected
    }

    return ticket;
  }

  /**
   * Cleanup expired tickets to prevent memory leakage
   */
  cleanupExpired() {
    const now = Date.now();
    for (const [id, ticket] of this.tickets.entries()) {
      if (now > ticket.expiresAt) {
        this.tickets.delete(id);
      }
    }
  }

  /**
   * Get active ticket count (diagnostics & tests)
   */
  getTicketCount() {
    return this.tickets.size;
  }
}

const ticketService = new TicketService();
export default ticketService;
