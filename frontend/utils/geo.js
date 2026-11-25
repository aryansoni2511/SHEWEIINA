/**
 * Geographic utilities for SHEWWINA Explore & Map components.
 */

/**
 * Validates latitude and longitude values strictly:
 * - Latitude between -90 and 90
 * - Longitude between -180 and 180
 * - Does not treat legitimate 0 as missing
 * - Rejects null, undefined, NaN, non-finite, and out-of-range
 */
export function isValidCoordinate(lat, lng) {
  if (lat === null || lat === undefined || lat === '' || lng === null || lng === undefined || lng === '') {
    return false;
  }
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) {
    return false;
  }
  return nLat >= -90 && nLat <= 90 && nLng >= -180 && nLng <= 180;
}

/**
 * Returns [latitude, longitude] only if provider has verified, finite GPS coordinates.
 * Never returns synthetic, randomized, or city-center fallback coordinates.
 */
export function getProviderCoords(provider) {
  if (!provider) return null;
  const { latitude, longitude } = provider;
  if (isValidCoordinate(latitude, longitude)) {
    return [Number(latitude), Number(longitude)];
  }
  return null;
}

/**
 * Spherical Haversine formula to compute great-circle distance between two points in km.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
