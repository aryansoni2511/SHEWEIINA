/**
 * Shewwina — Shared Validation Utility (Frontend)
 *
 * Single source of truth for all input validation rules.
 * The same rules are mirrored in backend/utils/validation.js.
 *
 * CUSTOMER NAME RULES  (validateName)
 * - Required (non-empty after trim)
 * - Only English letters (a-z, A-Z) and single internal spaces
 * - No digits, no special characters
 * - Consecutive spaces are collapsed to one (normalised before storing)
 * - Minimum 2 characters (after trim)
 * - Maximum 100 characters (after trim)
 *
 * BUSINESS NAME RULES  (validateBusinessName)
 * - Required (non-empty after trim)
 * - Letters, digits, spaces, and common business punctuation: & - . ' ( )
 * - Minimum 2 characters (after trim)
 * - Maximum 100 characters (after trim)
 * - Consecutive spaces are collapsed to one (normalised before storing)
 *
 * PHONE RULES  (validatePhone — Indian 10-digit mobile)
 * - Exactly 10 digits
 * - First digit must be 7, 8, or 9
 * - No spaces, no +91, no hyphens, no letters accepted
 */

/**
 * Validate a customer (person) name.
 * @param {string} value - Raw input string.
 * @returns {{ valid: boolean, message: string, normalized: string }}
 */
export function validateName(value) {
  if (value === null || value === undefined) {
    return { valid: false, message: 'Name is required.', normalized: '' };
  }

  const trimmed = String(value).trim();

  if (trimmed.length === 0) {
    return { valid: false, message: 'Name is required.', normalized: '' };
  }

  if (trimmed.length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters.', normalized: trimmed };
  }

  if (trimmed.length > 100) {
    return { valid: false, message: 'Name must be 100 characters or fewer.', normalized: trimmed };
  }

  // Allow only letters and spaces; reject digits and special characters
  if (!/^[a-zA-Z ]+$/.test(trimmed)) {
    return {
      valid: false,
      message: 'Name must contain only letters and spaces.',
      normalized: trimmed,
    };
  }

  // Collapse multiple consecutive spaces into one
  const normalized = trimmed.replace(/  +/g, ' ');

  return { valid: true, message: '', normalized };
}

/**
 * Validate an Indian 10-digit mobile phone number.
 * Accepts exactly 10 numeric digits; first digit must be 7, 8, or 9.
 * Does NOT accept +91, 0 prefix, spaces, hyphens, or letters.
 *
 * @param {string} value - Raw input string.
 * @returns {{ valid: boolean, message: string }}
 */
export function validatePhone(value) {
  if (value === null || value === undefined) {
    return { valid: false, message: 'Phone number is required.' };
  }

  const raw = String(value).trim();

  if (raw.length === 0) {
    return { valid: false, message: 'Phone number is required.' };
  }

  // Must be exactly 10 characters
  if (raw.length !== 10) {
    return {
      valid: false,
      message: 'Enter a valid 10-digit mobile number starting with 7, 8, or 9.',
    };
  }

  // Must be all digits
  if (!/^\d{10}$/.test(raw)) {
    return {
      valid: false,
      message: 'Enter a valid 10-digit mobile number starting with 7, 8, or 9.',
    };
  }

  // First digit must be 7, 8, or 9
  if (!/^[789]/.test(raw)) {
    return {
      valid: false,
      message: 'Enter a valid 10-digit mobile number starting with 7, 8, or 9.',
    };
  }

  return { valid: true, message: '' };
}

/**
 * Validate a business name.
 * More permissive than validateName — allows digits and common business
 * punctuation characters: & - . ' ( )
 *
 * @param {string} value - Raw input string.
 * @returns {{ valid: boolean, message: string, normalized: string }}
 */
export function validateBusinessName(value) {
  if (value === null || value === undefined) {
    return { valid: false, message: 'Business name is required.', normalized: '' };
  }

  const trimmed = String(value).trim();

  if (trimmed.length === 0) {
    return { valid: false, message: 'Business name is required.', normalized: '' };
  }

  if (trimmed.length < 2) {
    return { valid: false, message: 'Business name must be at least 2 characters.', normalized: trimmed };
  }

  if (trimmed.length > 100) {
    return { valid: false, message: 'Business name must be 100 characters or fewer.', normalized: trimmed };
  }

  // Allow letters, digits, spaces, and common business punctuation: & - . ' ( )
  if (!/^[a-zA-Z0-9 &'.()-]+$/.test(trimmed)) {
    return {
      valid: false,
      message: "Business name may only contain letters, numbers, spaces, and & - . ' ( ).",
      normalized: trimmed,
    };
  }

  // Collapse multiple consecutive spaces into one
  const normalized = trimmed.replace(/  +/g, ' ');

  return { valid: true, message: '', normalized };
}

export default { validateName, validateBusinessName, validatePhone };
