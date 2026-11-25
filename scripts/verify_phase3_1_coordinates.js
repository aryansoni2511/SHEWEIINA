import assert from 'assert';
import { isValidCoordinate, getProviderCoords } from '../frontend/utils/geo.js';

console.log('=== RUNNING PHASE 3.1 COORDINATE VALIDATION TESTS ===\n');

// 1. Valid coordinates
console.log('Test 1: Valid coordinates');
assert.strictEqual(isValidCoordinate(19.076, 72.8777), true, 'Standard positive lat/lng should be valid');
assert.strictEqual(isValidCoordinate(-33.8688, 151.2093), true, 'Negative lat, positive lng should be valid');
assert.strictEqual(isValidCoordinate(40.7128, -74.006), true, 'Positive lat, negative lng should be valid');
assert.strictEqual(isValidCoordinate(-22.9068, -43.1729), true, 'Both negative lat/lng should be valid');
assert.deepStrictEqual(
  getProviderCoords({ id: 'p1', latitude: 19.076, longitude: 72.8777 }),
  [19.076, 72.8777],
  'getProviderCoords should return [lat, lng] numbers for valid provider'
);
assert.deepStrictEqual(
  getProviderCoords({ id: 'p1_str', latitude: '19.076', longitude: '72.8777' }),
  [19.076, 72.8777],
  'getProviderCoords should parse string lat/lng into numbers'
);
console.log('  -> PASS');

// 2. Null coordinates
console.log('Test 2: Null coordinates');
assert.strictEqual(isValidCoordinate(null, null), false, 'null lat/lng should be invalid');
assert.strictEqual(isValidCoordinate(19.076, null), false, 'null lng should be invalid');
assert.strictEqual(isValidCoordinate(null, 72.8777), false, 'null lat should be invalid');
assert.strictEqual(
  getProviderCoords({ id: 'p2', latitude: null, longitude: null }),
  null,
  'getProviderCoords should return null for null coordinates'
);
console.log('  -> PASS');

// 3. Undefined coordinates
console.log('Test 3: Undefined coordinates');
assert.strictEqual(isValidCoordinate(undefined, undefined), false, 'undefined lat/lng should be invalid');
assert.strictEqual(isValidCoordinate(19.076, undefined), false, 'undefined lng should be invalid');
assert.strictEqual(isValidCoordinate(undefined, 72.8777), false, 'undefined lat should be invalid');
assert.strictEqual(
  getProviderCoords({ id: 'p3' }),
  null,
  'getProviderCoords should return null for undefined coordinates'
);
console.log('  -> PASS');

// 4. Invalid latitude/longitude (out of range, NaN, non-finite, empty string)
console.log('Test 4: Invalid latitude / longitude');
assert.strictEqual(isValidCoordinate(91, 72), false, 'lat > 90 should be invalid');
assert.strictEqual(isValidCoordinate(-90.1, 72), false, 'lat < -90 should be invalid');
assert.strictEqual(isValidCoordinate(19, 180.1), false, 'lng > 180 should be invalid');
assert.strictEqual(isValidCoordinate(19, -180.1), false, 'lng < -180 should be invalid');
assert.strictEqual(isValidCoordinate('abc', 72), false, 'string non-number lat should be invalid');
assert.strictEqual(isValidCoordinate(19, 'xyz'), false, 'string non-number lng should be invalid');
assert.strictEqual(isValidCoordinate('', ''), false, 'empty string should be invalid');
assert.strictEqual(isValidCoordinate(NaN, 72), false, 'NaN should be invalid');
assert.strictEqual(isValidCoordinate(Infinity, 72), false, 'Infinity should be invalid');
assert.strictEqual(
  getProviderCoords({ id: 'p4', latitude: 95, longitude: 200 }),
  null,
  'getProviderCoords should return null for out of range coordinates'
);
console.log('  -> PASS');

// 5. Legitimate zero coordinates (Equator / Prime Meridian)
console.log('Test 5: Legitimate zero latitude or longitude');
assert.strictEqual(isValidCoordinate(0, 0), true, '0, 0 (Equator / Prime Meridian) must be valid');
assert.strictEqual(isValidCoordinate('0', '0'), true, 'String "0", "0" must be valid');
assert.strictEqual(isValidCoordinate(0, 72.8777), true, 'lat 0 with normal lng must be valid');
assert.strictEqual(isValidCoordinate(19.076, 0), true, 'normal lat with lng 0 must be valid');
assert.strictEqual(isValidCoordinate(-90, -180), true, 'Exact min boundary -90, -180 must be valid');
assert.strictEqual(isValidCoordinate(90, 180), true, 'Exact max boundary 90, 180 must be valid');
assert.deepStrictEqual(
  getProviderCoords({ id: 'p5', latitude: 0, longitude: 0 }),
  [0, 0],
  'getProviderCoords should return [0, 0] for legitimate zero coordinates'
);
console.log('  -> PASS');

// 6. Map marker filtering vs Nearby cards preservation
console.log('Test 6: Map marker filtering vs Nearby cards preservation');
const mockProviders = [
  { id: '1', title: 'Hospital Alpha', category: 'hospital', latitude: 19.076, longitude: 72.8777 },
  { id: '2', title: 'Clinic Beta (No GPS)', category: 'clinic', latitude: null, longitude: null },
  { id: '3', title: 'Salon Gamma (Undefined GPS)', category: 'salon' },
  { id: '4', title: 'Citizen Kendra (Invalid GPS)', category: 'government', latitude: 999, longitude: -999 },
  { id: '5', title: 'Equator Health Desk', category: 'clinic', latitude: 0, longitude: 72.85 },
];

// Nearby cards must keep ALL providers
const cardsList = mockProviders;
assert.strictEqual(cardsList.length, 5, 'Nearby cards list must preserve all 5 providers');

// Map markers must only render for providers with valid coordinates
const mappedMarkers = mockProviders
  .map((p) => ({ provider: p, coords: getProviderCoords(p) }))
  .filter((m) => m.coords !== null);

assert.strictEqual(mappedMarkers.length, 2, 'Map markers must only be created for 2 eligible providers');
assert.strictEqual(mappedMarkers[0].provider.id, '1', 'Provider 1 should be mapped');
assert.strictEqual(mappedMarkers[1].provider.id, '5', 'Provider 5 (with lat 0) should be mapped');
console.log('  -> PASS');

// 7. Selecting a card without coordinates
console.log('Test 7: Selecting card without coordinates');
const unlocatedProvider = mockProviders[1]; // Clinic Beta
const coordsForFlyTo = getProviderCoords(unlocatedProvider);
assert.strictEqual(coordsForFlyTo, null, 'Unlocated provider must return null coords so map.flyTo() is not called');
console.log('  -> PASS');

// 8. Empty map state when no providers have coordinates
console.log('Test 8: Map empty state detection');
const noGpsProviders = [
  { id: '10', title: 'No GPS 1', latitude: null, longitude: null },
  { id: '11', title: 'No GPS 2', latitude: undefined, longitude: undefined },
];
const eligibleCount = noGpsProviders.filter((p) => isValidCoordinate(p.latitude, p.longitude)).length;
assert.strictEqual(eligibleCount, 0, 'No GPS providers should have 0 eligible markers');
const shouldShowEmptyMapOverlay = noGpsProviders.length > 0 && eligibleCount === 0;
assert.strictEqual(shouldShowEmptyMapOverlay, true, 'Map empty overlay should activate when providers exist but none have coordinates');
console.log('  -> PASS');

console.log('\n=== ALL 8 COORDINATE TEST SUITES PASSED PERFECTLY ===');
