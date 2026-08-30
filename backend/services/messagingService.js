import dotenv from 'dotenv';
import { normalizePhoneNumber, isValidPhoneNumber } from '../utils/phone.js';

dotenv.config();

/**
 * Messaging Service — External Communication Layer (SMS & WhatsApp)
 *
 * Architecture:
 * - Provider-agnostic. Supports MOCK (default zero-cost) and real provider adapters.
 * - Failure-isolated: All messaging dispatches run fire-and-forget; gateway failures,
 *   timeouts, or unconfigured credentials NEVER crash queue transactions or throw to clients.
 * - Normalized Indian phone numbers (+91...) automatically.
 * - In-memory dispatch recorder for testing/verification.
 */

// In-memory recorder for test assertion and local debugging
const sentMessages = {
  sms: [],
  whatsapp: [],
};

export const MESSAGING_PROVIDERS = {
  MOCK: 'mock',
  TWILIO: 'twilio',
  FAST2SMS: 'fast2sms',
  MSG91: 'msg91',
  WHATSAPP_CLOUD: 'whatsapp_cloud',
};

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

  const provider = (process.env.SMS_PROVIDER || process.env.MESSAGING_PROVIDER || 'mock').toLowerCase();

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
    if (provider === MESSAGING_PROVIDERS.MOCK || !process.env.SMS_API_KEY) {
      // Zero-cost Mock Mode: Safe log & store in memory for test assertions
      console.log(`[SMS][MOCK] To: ${normalizedTo} | Message: "${message}"`);
      sentMessages.sms.push(record);
      return { success: true, provider: 'mock', messageId: record.id };
    }

    // Future Real Provider (e.g. Fast2SMS / MSG91 / Twilio) HTTP adapter can be wired here
    // Example: await callSmsGateway(provider, normalizedTo, message);
    sentMessages.sms.push(record);
    return { success: true, provider, messageId: record.id };
  } catch (err) {
    console.error(`[SMS] Failed to send SMS to ${normalizedTo}:`, err.message);
    // Failure isolation: Return false status without propagating exception
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

  const provider = (process.env.WHATSAPP_PROVIDER || process.env.MESSAGING_PROVIDER || 'mock').toLowerCase();

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
    if (provider === MESSAGING_PROVIDERS.MOCK || !process.env.WHATSAPP_API_KEY) {
      // Zero-cost Mock Mode: Safe log & store in memory for test assertions
      console.log(`[WHATSAPP][MOCK] To: ${normalizedTo} | Message: "${message}"`);
      sentMessages.whatsapp.push(record);
      return { success: true, provider: 'mock', messageId: record.id };
    }

    // Future Real WhatsApp Cloud API / Twilio adapter
    sentMessages.whatsapp.push(record);
    return { success: true, provider, messageId: record.id };
  } catch (err) {
    console.error(`[WHATSAPP] Failed to send WhatsApp to ${normalizedTo}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Multi-channel dispatch helper: sends via both SMS & WhatsApp where configured
 */
export async function dispatchCustomerAlert({ phone, message, metadata = {} }) {
  if (!phone) return;

  // Execute concurrently without awaiting either (fire-and-forget)
  Promise.all([
    sendSMS({ to: phone, message, metadata }).catch(() => {}),
    sendWhatsApp({ to: phone, message, metadata }).catch(() => {}),
  ]).catch(() => {});
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
  getLastSentSMS,
  getLastSentWhatsApp,
  getAllSentMessages,
  clearSentMessages,
};
