/**
 * Twilio Provider Adapter — Shewwina Messaging Layer (Phase 11)
 *
 * Supports global SMS and Twilio WhatsApp messaging.
 * Endpoint: https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json
 *
 * Guarantees:
 * - Failure-isolated: Never throws. Returns structured { success, provider, messageId, error }.
 * - Handles both SMS and WhatsApp channel formatting.
 */

export async function sendTwilioMessage({
  to,
  message,
  accountSid,
  authToken,
  fromNumber,
  channel = 'sms',
}) {
  if (!accountSid || !authToken || !fromNumber) {
    return {
      success: false,
      provider: 'twilio',
      channel,
      error: 'Twilio credentials not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER).',
    };
  }

  const isWhatsApp = channel.toLowerCase() === 'whatsapp';
  const formattedTo = isWhatsApp && !to.startsWith('whatsapp:') ? `whatsapp:${to}` : to;
  const formattedFrom = isWhatsApp && !fromNumber.startsWith('whatsapp:') ? `whatsapp:${fromNumber}` : fromNumber;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;

  const params = new URLSearchParams();
  params.append('To', formattedTo);
  params.append('From', formattedFrom);
  params.append('Body', message);

  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errMsg = data?.message || `Twilio HTTP status ${response.status}`;
      return {
        success: false,
        provider: 'twilio',
        channel,
        error: errMsg,
      };
    }

    return {
      success: true,
      provider: 'twilio',
      channel,
      messageId: data?.sid || `tw_${Date.now()}`,
    };
  } catch (err) {
    return {
      success: false,
      provider: 'twilio',
      channel,
      error: err.message || 'Twilio network dispatch failed',
    };
  }
}

export default {
  sendTwilioMessage,
};
