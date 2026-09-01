import dotenv from 'dotenv';
import { normalizePhoneNumber, isValidPhoneNumber } from '../utils/phone.js';
import { sendFast2SMS } from './messaging/fast2smsProvider.js';
import { sendTwilioMessage } from './messaging/twilioProvider.js';
import { sendWhatsAppCloudMessage } from './messaging/whatsappCloudProvider.js';

dotenv.config();

/**
 * Messaging Service — External Communication Layer (Phase 11)
 *
 * Architecture:
 * - Provider-agnostic: Supports MOCK (default zero-cost), Fast2SMS, Twilio, and WhatsApp Cloud.
 * - Failure-isolated: All dispatches are fire-and-forget; gateway failures NEVER throw or crash queue transactions.
 * - Per-phone anti-spam cooldown: Throttles duplicate dispatches to the same phone within a time window.
 * - In-memory dispatch recorder for test assertions.
 */

// In-memory recorder for test assertion and local debugging
const sentMessages = {
  sms: [],
  whatsapp: [],
};

// In-memory cooldown store: Map<"channel:phone:type", timestampMs>
const cooldownStore = new Map();

// Test hook: allow mocking gateway responses in unit tests
let customMessagingHandler = null;

export const MESSAGING_PROVIDERS = {
  MOCK: 'mock',
  TWILIO: 'twilio',
  FAST2SMS: 'fast2sms',
  MSG91: 'msg91',
  WHATSAPP_CLOUD: 'whatsapp_cloud',
};

/**
 * Clear the in-memory cooldown store (test utility)
 */
export function clearMessagingCooldown() {
  cooldownStore.clear();
}

/**
 * Set a custom test handler for mocking gateway calls (test utility)
 */
export function setCustomMessagingHandler(handler) {
  customMessagingHandler = handler;
}

/**
 * Get active SMS provider based on environment configuration
 */
export function getActiveSmsProvider() {
  const explicit = (process.env.SMS_PROVIDER || process.env.MESSAGING_PROVIDER || '').toLowerCase().trim();
  if (explicit === MESSAGING_PROVIDERS.FAST2SMS) return MESSAGING_PROVIDERS.FAST2SMS;
  if (explicit === MESSAGING_PROVIDERS.TWILIO) return MESSAGING_PROVIDERS.TWILIO;
  if (explicit === MESSAGING_PROVIDERS.MOCK) return MESSAGING_PROVIDERS.MOCK;

  // Auto-detect based on API keys if provider not explicitly specified
  if (process.env.FAST2SMS_API_KEY) return MESSAGING_PROVIDERS.FAST2SMS;
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) return MESSAGING_PROVIDERS.TWILIO;

  return MESSAGING_PROVIDERS.MOCK;
}

/**
 * Get active WhatsApp provider based on environment configuration
 */
export function getActiveWhatsAppProvider() {
  const explicit = (process.env.WHATSAPP_PROVIDER || process.env.MESSAGING_PROVIDER || '').toLowerCase().trim();
  if (explicit === MESSAGING_PROVIDERS.WHATSAPP_CLOUD) return MESSAGING_PROVIDERS.WHATSAPP_CLOUD;
  if (explicit === MESSAGING_PROVIDERS.TWILIO) return MESSAGING_PROVIDERS.TWILIO;
  if (explicit === MESSAGING_PROVIDERS.MOCK) return MESSAGING_PROVIDERS.MOCK;

  // Auto-detect based on API keys if provider not explicitly specified
  if (process.env.WHATSAPP_CLOUD_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
    return MESSAGING_PROVIDERS.WHATSAPP_CLOUD;
  }
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_WHATSAPP_NUMBER) {
    return MESSAGING_PROVIDERS.TWILIO;
  }

  return MESSAGING_PROVIDERS.MOCK;
}

/**
 * Check if a dispatch should be throttled by per-phone cooldown
 */
function checkAndApplyCooldown(channel, phone, type = 'general') {
  const cooldownSec = Number(process.env.MESSAGING_COOLDOWN_SECONDS || 10);
  if (cooldownSec <= 0) return false;

  const key = `${channel}:${phone}:${type}`;
  const now = Date.now();
  const lastSent = cooldownStore.get(key) || 0;

  if (now - lastSent < cooldownSec * 1000) {
    return true; // Throttled
  }

  cooldownStore.set(key, now);
  return false;
}

/**
 * Dispatch SMS message via configured provider
 * Safe fire-and-forget: Never throws.
 */
export async function sendSMS({ to, message, metadata = {} }) {
  if (!to || !message) {
    return { success: false, reason: 'Missing phone number or message content' };
  }

  const normalizedTo = normalizePhoneNumber(to);
  if (!isValidPhoneNumber(normalizedTo)) {
    return { success: false, reason: `Invalid phone number: ${to}` };
  }

  const messageType = metadata.type || 'general';

  // Per-phone anti-spam throttling
  if (checkAndApplyCooldown('sms', normalizedTo, messageType)) {
    return {
      success: false,
      throttled: true,
      reason: `SMS throttled by anti-spam cooldown for ${normalizedTo}`,
    };
  }

  const provider = getActiveSmsProvider();

  const record = {
    id: `sms_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    channel: 'SMS',
    provider,
    to: normalizedTo,
    message,
    metadata,
    sentAt: new Date().toISOString(),
  };

  try {
    // Check if a custom test handler was attached in tests
    if (customMessagingHandler) {
      const customRes = await customMessagingHandler('SMS', { to: normalizedTo, message, metadata, provider });
      if (customRes !== undefined) {
        sentMessages.sms.push(record);
        return { success: true, provider: 'custom_mock', messageId: record.id, ...customRes };
      }
    }

    // 1. MOCK Provider (Default for dev & tests)
    if (provider === MESSAGING_PROVIDERS.MOCK) {
      console.log(`[SMS][MOCK] To: ${normalizedTo} | Message: "${message}"`);
      sentMessages.sms.push(record);
      return { success: true, provider: 'mock', messageId: record.id };
    }

    // 2. Fast2SMS Provider (Indian Domestic SMS)
    if (provider === MESSAGING_PROVIDERS.FAST2SMS) {
      const f2sRes = await sendFast2SMS({
        to: normalizedTo,
        message,
        apiKey: process.env.FAST2SMS_API_KEY,
        route: process.env.FAST2SMS_ROUTE || 'q',
      });
      sentMessages.sms.push({ ...record, ...f2sRes });
      return f2sRes;
    }

    // 3. Twilio SMS Provider (Global SMS)
    if (provider === MESSAGING_PROVIDERS.TWILIO) {
      const twilioRes = await sendTwilioMessage({
        to: normalizedTo,
        message,
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_PHONE_NUMBER,
        channel: 'sms',
      });
      sentMessages.sms.push({ ...record, ...twilioRes });
      return twilioRes;
    }

    // Fallback if provider was unknown
    sentMessages.sms.push(record);
    return { success: true, provider, messageId: record.id };
  } catch (err) {
    console.error(`[SMS] Failed to send SMS to ${normalizedTo}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Dispatch WhatsApp message via configured provider
 * Safe fire-and-forget: Never throws.
 */
export async function sendWhatsApp({ to, message, metadata = {} }) {
  if (!to || !message) {
    return { success: false, reason: 'Missing phone number or message content' };
  }

  const normalizedTo = normalizePhoneNumber(to);
  if (!isValidPhoneNumber(normalizedTo)) {
    return { success: false, reason: `Invalid phone number: ${to}` };
  }

  const messageType = metadata.type || 'general';

  // Per-phone anti-spam throttling
  if (checkAndApplyCooldown('whatsapp', normalizedTo, messageType)) {
    return {
      success: false,
      throttled: true,
      reason: `WhatsApp alert throttled by anti-spam cooldown for ${normalizedTo}`,
    };
  }

  const provider = getActiveWhatsAppProvider();

  const record = {
    id: `wa_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    channel: 'WHATSAPP',
    provider,
    to: normalizedTo,
    message,
    metadata,
    sentAt: new Date().toISOString(),
  };

  try {
    // Check if a custom test handler was attached in tests
    if (customMessagingHandler) {
      const customRes = await customMessagingHandler('WHATSAPP', { to: normalizedTo, message, metadata, provider });
      if (customRes !== undefined) {
        sentMessages.whatsapp.push(record);
        return { success: true, provider: 'custom_mock', messageId: record.id, ...customRes };
      }
    }

    // 1. MOCK Provider (Default for dev & tests)
    if (provider === MESSAGING_PROVIDERS.MOCK) {
      console.log(`[WHATSAPP][MOCK] To: ${normalizedTo} | Message: "${message}"`);
      sentMessages.whatsapp.push(record);
      return { success: true, provider: 'mock', messageId: record.id };
    }

    // 2. Meta WhatsApp Cloud API Provider
    if (provider === MESSAGING_PROVIDERS.WHATSAPP_CLOUD) {
      const waRes = await sendWhatsAppCloudMessage({
        to: normalizedTo,
        message,
        accessToken: process.env.WHATSAPP_CLOUD_ACCESS_TOKEN,
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      });
      sentMessages.whatsapp.push({ ...record, ...waRes });
      return waRes;
    }

    // 3. Twilio WhatsApp Provider
    if (provider === MESSAGING_PROVIDERS.TWILIO) {
      const twilioRes = await sendTwilioMessage({
        to: normalizedTo,
        message,
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER,
        channel: 'whatsapp',
      });
      sentMessages.whatsapp.push({ ...record, ...twilioRes });
      return twilioRes;
    }

    // Fallback if provider was unknown
    sentMessages.whatsapp.push(record);
    return { success: true, provider, messageId: record.id };
  } catch (err) {
    console.error(`[WHATSAPP] Failed to send WhatsApp to ${normalizedTo}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Multi-channel dispatch helper: sends via both SMS & WhatsApp where enabled by preferences.
 * Safe fire-and-forget: Runs asynchronously and never throws.
 *
 * @param {object} params - { phone, message, metadata, preferences }
 */
export async function dispatchCustomerAlert({
  phone,
  message,
  metadata = {},
  preferences = { smsEnabled: true, whatsappEnabled: false },
}) {
  if (!phone) return;

  const smsEnabled = preferences?.smsEnabled !== false;
  const whatsappEnabled = Boolean(preferences?.whatsappEnabled);

  const dispatches = [];

  if (smsEnabled) {
    dispatches.push(sendSMS({ to: phone, message, metadata }).catch(() => {}));
  }

  if (whatsappEnabled) {
    dispatches.push(sendWhatsApp({ to: phone, message, metadata }).catch(() => {}));
  }

  Promise.all(dispatches).catch(() => {});
}

// ─── TEST UTILITIES ──────────────────────────────────────────────────────────

export function getLastSentSMS() {
  return sentMessages.sms[sentMessages.sms.length - 1] || null;
}

export function getLastSentWhatsApp() {
  return sentMessages.whatsapp[sentMessages.whatsapp.length - 1] || null;
}

export function getAllSentMessages() {
  return { ...sentMessages };
}

export function clearSentMessages() {
  sentMessages.sms = [];
  sentMessages.whatsapp = [];
}

export default {
  sendSMS,
  sendWhatsApp,
  dispatchCustomerAlert,
  getActiveSmsProvider,
  getActiveWhatsAppProvider,
  clearMessagingCooldown,
  setCustomMessagingHandler,
  getLastSentSMS,
  getLastSentWhatsApp,
  getAllSentMessages,
  clearSentMessages,
  MESSAGING_PROVIDERS,
};
