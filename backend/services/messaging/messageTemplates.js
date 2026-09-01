/**
 * Message Templates — Shewwina Notification & Messaging Layer (Phase 11)
 *
 * Standardized, concise transactional message templates for SMS and WhatsApp.
 * Designed for high deliverability, Indian character limits, and DLT compliance.
 */

export const MESSAGE_TYPES = {
  CUSTOMER_JOINED_QUEUE: 'CUSTOMER_JOINED_QUEUE',
  YOUR_TURN_APPROACHING: 'YOUR_TURN_APPROACHING',
  CUSTOMER_CALLED: 'CUSTOMER_CALLED',
  SERVICE_COMPLETED: 'SERVICE_COMPLETED',
  QUEUE_CANCELLED: 'QUEUE_CANCELLED',
  TEST_ALERT: 'TEST_ALERT',
};

/**
 * Format message content based on notification type and context.
 *
 * @param {string} type - Event type from MESSAGE_TYPES or NOTIFICATION_TYPES
 * @param {object} data - Context data: { businessName, tokenNumber, position, peopleAhead, estimatedWaitMinutes, trackingUrl }
 * @returns {string} Clean, formatted message string
 */
export function formatTemplateMessage(type, data = {}) {
  const {
    businessName = 'Shewwina Business',
    tokenNumber = 'Token',
    position = 1,
    peopleAhead = 0,
    estimatedWaitMinutes = 0,
    trackingUrl = '',
  } = data;

  const trackSuffix = trackingUrl ? ` Track: ${trackingUrl}` : '';

  switch (type) {
    case MESSAGE_TYPES.CUSTOMER_JOINED_QUEUE:
      return `Your token ${tokenNumber} is confirmed at ${businessName}. You are #${position} in line. Est wait: ~${estimatedWaitMinutes} min.${trackSuffix}`;

    case MESSAGE_TYPES.YOUR_TURN_APPROACHING:
      if (peopleAhead === 0) {
        return `You're next! Token ${tokenNumber} at ${businessName} — please be ready to proceed.${trackSuffix}`;
      }
      return `Almost your turn! Token ${tokenNumber} at ${businessName} (${peopleAhead} ahead). Please proceed to waiting area.${trackSuffix}`;

    case MESSAGE_TYPES.CUSTOMER_CALLED:
      return `It's your turn! Token ${tokenNumber} has been called at ${businessName}. Please proceed to the service counter now.`;

    case MESSAGE_TYPES.SERVICE_COMPLETED:
      return `Your service for token ${tokenNumber} at ${businessName} has been completed. Thank you for your visit!`;

    case MESSAGE_TYPES.QUEUE_CANCELLED:
      return `Your queue token ${tokenNumber} at ${businessName} has been cancelled.`;

    case MESSAGE_TYPES.TEST_ALERT:
      return `Shewwina: Test alert for ${businessName}. Your messaging gateway is active and working properly!`;

    default:
      return `Update from ${businessName}: Token ${tokenNumber}.${trackSuffix}`;
  }
}

export default {
  MESSAGE_TYPES,
  formatTemplateMessage,
};
