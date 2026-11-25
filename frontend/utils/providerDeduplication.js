/**
 * Provider Deduplication & Normalization Utility
 * Harmonizes provider records across Hospitals, Clinics, Salons, and Government Kendras,
 * eliminating duplicate provider cards and map markers while strictly preserving legitimate
 * separate branches at distinct addresses.
 */

// Common words that don't distinguish a brand name
const GENERIC_PROVIDER_WORDS = new Set([
  'and',
  'the',
  'of',
  'in',
  'at',
  'for',
  'clinic',
  'clinics',
  'hospital',
  'hospitals',
  'salon',
  'salons',
  'spa',
  'spas',
  'center',
  'centre',
  'wellness',
  'healthcare',
  'health',
  'medical',
  'care',
  'services',
  'service',
  'solutions',
  'pvt',
  'ltd',
  'limited',
  'institute',
  'foundation',
  'branch',
]);

/**
 * Strips raw numeric timestamps or generated test suffixes from display names.
 * Example: "Apex Health Clinic 1795363336077" -> "Apex Health Clinic"
 */
export function formatProviderTitle(title) {
  if (!title || typeof title !== 'string') return '';
  return title
    .replace(/[\s_-]+\d{4,}$/g, '') // strip trailing numeric timestamps/IDs (4+ digits)
    .trim();
}

/**
 * Normalizes an address string for stable identity comparison.
 * Standardizes street types (road, rd, street, st) and collapses whitespace/punctuation.
 */
export function normalizeAddress(address) {
  if (!address || typeof address !== 'string') return '';
  return address
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(road|rd)\b/g, 'rd')
    .replace(/\b(street|st)\b/g, 'st')
    .replace(/\b(lane|ln)\b/g, 'ln')
    .replace(/\b(avenue|ave)\b/g, 'ave')
    .replace(/\b(floor|flr)\b/g, 'fl')
    .replace(/\b(shop|unit|plot|no|number|block|bldg|building)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes city names.
 */
export function normalizeCity(city) {
  if (!city || typeof city !== 'string') return '';
  return city.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

/**
 * Extracts distinctive core brand tokens from a provider's title.
 * Example: "Apex Health & Wellness Clinic" -> "apex" or "apex health"
 */
export function extractBrandTokens(title) {
  if (!title || typeof title !== 'string') return '';
  const cleaned = formatProviderTitle(title)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]/g, ' ');

  const tokens = cleaned
    .split(/\s+/)
    .filter((word) => word.length > 1 && !GENERIC_PROVIDER_WORDS.has(word));

  // If all tokens were filtered out as generic, fallback to cleaned words
  if (tokens.length === 0) {
    return cleaned.split(/\s+/).filter(Boolean).slice(0, 3).join(' ');
  }

  return tokens.slice(0, 3).join(' ');
}

/**
 * Accurately classifies a business record when category is missing or ambiguous.
 */
export function resolveBusinessCategory(business) {
  if (!business) return 'salon';
  const rawCat = (business.category || '').trim().toLowerCase();

  if (rawCat === 'clinic' || rawCat.includes('clinic') || rawCat.includes('doctor') || rawCat.includes('dental')) {
    return 'clinic';
  }
  if (rawCat === 'hospital' || rawCat.includes('hospital')) {
    return 'hospital';
  }
  if (rawCat === 'government' || rawCat.includes('govt') || rawCat.includes('kendra')) {
    return 'government';
  }
  if (rawCat === 'salon' || rawCat.includes('salon') || rawCat.includes('spa') || rawCat.includes('grooming')) {
    return 'salon';
  }

  // If category is missing or unspecified, infer from business name
  const name = (business.name || '').toLowerCase();
  if (/\b(clinic|doctor|health|wellness|dental|medical|care|ayur|physio|diagnostic|pathology)\b/i.test(name)) {
    return 'clinic';
  }
  if (/\b(hospital|nursing|maternity)\b/i.test(name)) {
    return 'hospital';
  }
  if (/\b(kendra|aadhaar|pan|passport|citizen|suvidha)\b/i.test(name)) {
    return 'government';
  }

  // Safe default
  return 'salon';
}

/**
 * Deduplicates provider items:
 * 1. Tracks stable IDs and links.
 * 2. Compares normalized provider identity: category + city + normalized address + brand tokens.
 * 3. Enriches the retained primary record with any missing coordinates, phone numbers, or hours from duplicates.
 * 4. Strictly preserves separate branches at different addresses.
 */
export function deduplicateProviders(providers = []) {
  if (!Array.isArray(providers) || providers.length === 0) return [];

  const seenIds = new Set();
  const seenLinks = new Set();
  const seenIdentities = new Map(); // key -> index in deduplicated list
  const deduplicated = [];

  for (const item of providers) {
    if (!item) continue;

    // 1. Direct ID check
    if (item.id && seenIds.has(String(item.id))) {
      continue;
    }

    // 2. Exact link target check (e.g. two items linking to the exact same /join/xyz)
    if (item.link && seenLinks.has(String(item.link))) {
      continue;
    }

    // 3. Compute normalized identity
    const category = (item.category || 'other').toLowerCase();
    const normCity = normalizeCity(item.city);
    const normAddr = normalizeAddress(item.address);
    const brandTokens = extractBrandTokens(item.title);
    const phone = (item.phone || '').replace(/[^0-9]/g, '');

    // Composite identity key:
    let identityKey = null;
    const isDistinctAddress = normAddr && normAddr !== normCity;

    if (isDistinctAddress) {
      identityKey = `${category}|${normCity}|${normAddr}|${brandTokens}`;
    } else if (phone && phone.length >= 8) {
      identityKey = `${category}|${phone}`;
    } else {
      identityKey = `${category}|${normCity}|${brandTokens}`;
    }

    if (seenIdentities.has(identityKey)) {
      // Duplicate provider detected! Enrich the existing retained record with any missing details
      const existingIdx = seenIdentities.get(identityKey);
      const existing = deduplicated[existingIdx];

      if ((!existing.latitude || !existing.longitude) && item.latitude && item.longitude) {
        existing.latitude = item.latitude;
        existing.longitude = item.longitude;
      }
      if (!existing.phone && item.phone) {
        existing.phone = item.phone;
      }
      if (!existing.hours && item.hours) {
        existing.hours = item.hours;
      }
      if ((existing.waitingCount === null || existing.waitingCount === undefined) && item.waitingCount != null) {
        existing.waitingCount = item.waitingCount;
      }
      if ((existing.estimatedWaitMinutes === null || existing.estimatedWaitMinutes === undefined) && item.estimatedWaitMinutes != null) {
        existing.estimatedWaitMinutes = item.estimatedWaitMinutes;
      }
      continue;
    }

    // New unique provider
    if (item.id) seenIds.add(String(item.id));
    if (item.link) seenLinks.add(String(item.link));
    seenIdentities.set(identityKey, deduplicated.length);
    deduplicated.push({ ...item });
  }

  return deduplicated;
}
