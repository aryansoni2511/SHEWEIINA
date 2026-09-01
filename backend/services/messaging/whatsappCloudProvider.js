/**
 * Meta WhatsApp Cloud API Adapter — Shewwina Messaging Layer (Phase 11)
 *
 * Official WhatsApp Cloud Graph API.
 * Endpoint: https://graph.facebook.com/v19.0/{phoneNumberId}/messages
 *
 * Guarantees:
 * - Failure-isolated: Never throws. Returns structured { success, provider, messageId, error }.
 * - Formats recipient to international format without leading '+'.
 */

export async function sendWhatsAppCloudMessage({
  to,
  message,
  accessToken,
  phoneNumberId,
}) {
  if (!accessToken || !phoneNumberId) {
    return {
      success: false,
      provider: 'whatsapp_cloud',
      error: 'WhatsApp Cloud credentials not configured (WHATSAPP_CLOUD_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID).',
    };
  }

  // Meta Graph API expects digits without '+'
  const cleanTo = to.replace(/\D/g, '');

  const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(phoneNumberId)}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanTo,
    type: 'text',
    text: {
      preview_url: true,
      body: message,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errMsg = data?.error?.message || `WhatsApp Cloud HTTP status ${response.status}`;
      return {
        success: false,
        provider: 'whatsapp_cloud',
        error: errMsg,
      };
    }

    const messageId = data?.messages?.[0]?.id || `wac_${Date.now()}`;
    return {
      success: true,
      provider: 'whatsapp_cloud',
      messageId,
      raw: data,
    };
  } catch (err) {
    return {
      success: false,
      provider: 'whatsapp_cloud',
      error: err.message || 'WhatsApp Cloud network dispatch failed',
    };
  }
}

export default {
  sendWhatsAppCloudMessage,
};
