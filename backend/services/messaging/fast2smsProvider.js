/**
 * Fast2SMS Provider Adapter — Shewwina Messaging Layer (Phase 11)
 *
 * Cost-effective Indian domestic SMS gateway.
 * Endpoint: https://www.fast2sms.com/dev/bulkV2
 *
 * Guarantees:
 * - Failure-isolated: Never throws. Returns structured { success, provider, messageId, error }.
 * - Strips leading '+91' or '91' to 10-digit Indian format required by Fast2SMS.
 */

export async function sendFast2SMS({ to, message, apiKey, route = 'q' }) {
  if (!apiKey) {
    return {
      success: false,
      provider: 'fast2sms',
      error: 'Fast2SMS API key not configured (FAST2SMS_API_KEY).',
    };
  }

  // Fast2SMS requires 10-digit phone numbers (e.g. 9876543210)
  const cleanDigits = to.replace(/\D/g, '');
  const tenDigitPhone = cleanDigits.length > 10 ? cleanDigits.slice(-10) : cleanDigits;

  if (tenDigitPhone.length !== 10) {
    return {
      success: false,
      provider: 'fast2sms',
      error: `Invalid 10-digit phone number for Fast2SMS: ${to}`,
    };
  }

  const payload = {
    route: route || 'q',
    message,
    language: 'english',
    numbers: tenDigitPhone,
  };

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || (data && data.return === false)) {
      const errMsg = (data && data.message) ? (Array.isArray(data.message) ? data.message.join(', ') : data.message) : `Fast2SMS HTTP status ${response.status}`;
      return {
        success: false,
        provider: 'fast2sms',
        error: errMsg,
      };
    }

    const messageId = data?.request_id || `f2s_${Date.now()}`;
    return {
      success: true,
      provider: 'fast2sms',
      messageId,
      raw: data,
    };
  } catch (err) {
    return {
      success: false,
      provider: 'fast2sms',
      error: err.message || 'Fast2SMS network dispatch failed',
    };
  }
}

export default {
  sendFast2SMS,
};
