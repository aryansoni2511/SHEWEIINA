/**
 * Masking Utilities — Shewwina Customer Privacy (Phase 12)
 *
 * Ensures customer names and phone numbers are strictly protected on public displays.
 */

/**
 * Masks full customer name for public display.
 * e.g. "Rahul Sharma" -> "Rahul S."
 * e.g. "Pooja" -> "Pooja"
 * e.g. "Amit Kumar Verma" -> "Amit V."
 * e.g. null / empty -> "Guest"
 *
 * @param {string} name - Raw customer name
 * @returns {string} Safe, privacy-preserving display name
 */
export function maskCustomerName(name) {
  if (!name || typeof name !== 'string') return 'Guest';
  const trimmed = name.trim();
  if (!trimmed) return 'Guest';

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0];
  }

  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() || '';
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

export default {
  maskCustomerName,
};
