/**
 * Unified Phone Number Normalization Utility
 * Single source of truth across SMS, WhatsApp, and Queue services.
 *
 * Supports Indian format conversions:
 * - 9876543210 -> +919876543210
 * - 09876543210 -> +919876543210
 * - 919876543210 -> +919876543210
 * - +919876543210 -> +919876543210
 */

export function normalizePhoneNumber(rawPhone) {
  if (!rawPhone) return null;

  // Remove spaces, dashes, parentheses
  let cleaned = String(rawPhone).trim().replace(/[\s\-\(\)]/g, '');

  if (!cleaned) return null;

  // Handle + prefix
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  // Handle leading 0
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }

  // If 10 digits (standard Indian mobile format)
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }

  // If already starts with 91 and has 12 digits total
  if (cleaned.startsWith('91') && cleaned.length === 12 && /^[6-9]/.test(cleaned.slice(2))) {
    return `+${cleaned}`;
  }

  // Fallback for international or non-standard format
  return `+${cleaned}`;
}

export function isValidPhoneNumber(phone) {
  if (!phone) return false;
  const normalized = normalizePhoneNumber(phone);
  // Valid E.164: + followed by 10 to 15 digits
  return /^\+[1-9]\d{9,14}$/.test(normalized);
}

export default {
  normalizePhoneNumber,
  isValidPhoneNumber,
};
