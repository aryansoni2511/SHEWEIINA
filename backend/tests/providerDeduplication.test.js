import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatProviderTitle,
  resolveBusinessCategory,
  deduplicateProviders,
  extractBrandTokens,
  normalizeAddress,
} from '../../frontend/utils/providerDeduplication.js';

test('Provider Deduplication & Normalization Suite', async (suite) => {
  // 1. Title formatting
  await suite.test('formatProviderTitle strips timestamps and generated numeric test IDs', () => {
    assert.strictEqual(
      formatProviderTitle('Apex Health & Wellness Clinic 1795363336077'),
      'Apex Health & Wellness Clinic'
    );
    assert.strictEqual(
      formatProviderTitle('Apex Health Clinic 1795363336078'),
      'Apex Health Clinic'
    );
    assert.strictEqual(
      formatProviderTitle('City Care Multi-Specialty Hospital-1002'),
      'City Care Multi-Specialty Hospital'
    );
    assert.strictEqual(formatProviderTitle('Shewwina Salon & Spa'), 'Shewwina Salon & Spa');
    assert.strictEqual(formatProviderTitle(''), '');
  });

  // 2. Address normalization
  await suite.test('normalizeAddress standardizes road/street suffixes and collapses whitespace', () => {
    const addr1 = normalizeAddress('15 Dr. Ambedkar Road, Dadar East');
    const addr2 = normalizeAddress('15 Dr. Ambedkar Rd., Dadar East');
    assert.strictEqual(addr1, addr2);
    assert.strictEqual(addr1, '15 dr ambedkar rd dadar east');

    const addr3 = normalizeAddress('Shop 12, Phoenix Mall, Lower Parel');
    const addr4 = normalizeAddress('Unit 12, Phoenix Mall, Lower Parel');
    assert.strictEqual(addr3, addr4);
  });

  // 3. Category resolution
  await suite.test('resolveBusinessCategory resolves explicit categories and infers missing ones from name', () => {
    // Explicit categories
    assert.strictEqual(resolveBusinessCategory({ category: 'clinic' }), 'clinic');
    assert.strictEqual(resolveBusinessCategory({ category: 'Clinic' }), 'clinic');
    assert.strictEqual(resolveBusinessCategory({ category: 'salon' }), 'salon');
    assert.strictEqual(resolveBusinessCategory({ category: 'hospital' }), 'hospital');
    assert.strictEqual(resolveBusinessCategory({ category: 'government' }), 'government');

    // Missing category with clinic/doctor keywords in name -> resolves to clinic
    assert.strictEqual(
      resolveBusinessCategory({ name: 'Apex Health & Wellness Clinic', category: null }),
      'clinic'
    );
    assert.strictEqual(
      resolveBusinessCategory({ name: 'Dr. Sharma Dental Care', category: '' }),
      'clinic'
    );
    assert.strictEqual(
      resolveBusinessCategory({ name: 'Care First Medical Centre', category: undefined }),
      'clinic'
    );

    // Missing category with hospital keywords in name -> resolves to hospital
    assert.strictEqual(
      resolveBusinessCategory({ name: 'Apex Multi-Specialty Hospital', category: null }),
      'hospital'
    );

    // Missing category with regular name -> defaults to salon
    assert.strictEqual(
      resolveBusinessCategory({ name: 'Shewwina Hair Studio', category: null }),
      'salon'
    );
  });

  // 4. Exact duplicate IDs
  await suite.test('deduplicateProviders eliminates items with identical IDs', () => {
    const items = [
      { id: 'b-1', title: 'Apex Health Clinic', category: 'clinic', city: 'Mumbai', address: '15 Dr. Ambedkar Road' },
      { id: 'b-1', title: 'Apex Health Clinic', category: 'clinic', city: 'Mumbai', address: '15 Dr. Ambedkar Road' },
    ];
    const result = deduplicateProviders(items);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'b-1');
  });

  // 5. Duplicate providers with different generated IDs representing the same provider
  await suite.test('deduplicateProviders eliminates duplicate providers with different IDs at the same address', () => {
    const items = [
      {
        id: 'uuid-1',
        title: 'Apex Health & Wellness Clinic',
        category: 'clinic',
        city: 'Mumbai',
        address: '15 Dr. Ambedkar Road, Dadar East',
        link: '/join/apex-1',
      },
      {
        id: 'uuid-2',
        title: 'Apex Health & Wellness Clinic 1795363336077',
        category: 'clinic',
        city: 'Mumbai',
        address: '15 Dr. Ambedkar Road, Dadar East',
        link: '/join/apex-2',
      },
      {
        id: 'uuid-3',
        title: 'Apex Health Clinic',
        category: 'clinic',
        city: 'Mumbai',
        address: '15 Dr. Ambedkar Road, Dadar East',
        link: '/join/apex-3',
      },
    ];

    const result = deduplicateProviders(items);
    assert.strictEqual(result.length, 1, 'Expected all 3 duplicates to collapse into 1 card');
    assert.strictEqual(result[0].id, 'uuid-1');
    assert.strictEqual(result[0].title, 'Apex Health & Wellness Clinic');
  });

  // 6. Preservation of legitimate separate branches
  await suite.test('deduplicateProviders strictly preserves legitimate separate branches at different addresses', () => {
    const items = [
      {
        id: 'b-branch-dadar',
        title: 'Apex Health Clinic',
        category: 'clinic',
        city: 'Mumbai',
        address: '15 Dr. Ambedkar Road, Dadar East',
        link: '/join/apex-dadar',
      },
      {
        id: 'b-branch-andheri',
        title: 'Apex Health Clinic',
        category: 'clinic',
        city: 'Mumbai',
        address: 'Plot 42, Health City Avenue, Andheri West',
        link: '/join/apex-andheri',
      },
    ];

    const result = deduplicateProviders(items);
    assert.strictEqual(result.length, 2, 'Different branch addresses must BOTH be preserved');
    assert.strictEqual(result[0].address, '15 Dr. Ambedkar Road, Dadar East');
    assert.strictEqual(result[1].address, 'Plot 42, Health City Avenue, Andheri West');
  });

  // 7. Preservation of different providers with different names at the same commercial building
  await suite.test('deduplicateProviders preserves unrelated providers at the same address', () => {
    const items = [
      {
        id: 'sal-1',
        title: 'Shewwina Salon & Spa',
        category: 'salon',
        city: 'Mumbai',
        address: 'Shop 12, Phoenix Mall, Lower Parel',
        link: '/join/shewwina-salon',
      },
      {
        id: 'sal-2',
        title: 'Nail Art Studio',
        category: 'salon',
        city: 'Mumbai',
        address: 'Shop 12, Phoenix Mall, Lower Parel',
        link: '/join/nail-art',
      },
    ];

    const result = deduplicateProviders(items);
    assert.strictEqual(result.length, 2, 'Unrelated providers at same mall must both be preserved');
  });

  // 8. Preservation of different categories
  await suite.test('deduplicateProviders preserves different categories even if names are related', () => {
    const items = [
      {
        id: 'hosp-1',
        title: 'Apex Super-Specialty Medical Institute',
        category: 'hospital',
        city: 'Mumbai',
        address: '15 Dr. Ambedkar Road, Dadar East',
        link: '/hospital/hosp-1',
      },
      {
        id: 'clinic-1',
        title: 'Apex Health Clinic',
        category: 'clinic',
        city: 'Mumbai',
        address: '15 Dr. Ambedkar Road, Dadar East',
        link: '/join/clinic-1',
      },
    ];

    const result = deduplicateProviders(items);
    assert.strictEqual(result.length, 2, 'Hospital and Clinic must not be merged');
    assert.strictEqual(result[0].category, 'hospital');
    assert.strictEqual(result[1].category, 'clinic');
  });

  // 9. Metadata enrichment from duplicate records
  await suite.test('deduplicateProviders enriches retained primary item with missing coordinates & phone from duplicate', () => {
    const items = [
      {
        id: 'uuid-1',
        title: 'Apex Health Clinic',
        category: 'clinic',
        city: 'Mumbai',
        address: '15 Dr. Ambedkar Road, Dadar East',
        latitude: null,
        longitude: null,
        phone: null,
      },
      {
        id: 'uuid-2',
        title: 'Apex Health Clinic',
        category: 'clinic',
        city: 'Mumbai',
        address: '15 Dr. Ambedkar Road, Dadar East',
        latitude: 19.0178,
        longitude: 72.8478,
        phone: '+919820112233',
        waitingCount: 3,
        estimatedWaitMinutes: 20,
      },
    ];

    const result = deduplicateProviders(items);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].latitude, 19.0178);
    assert.strictEqual(result[0].longitude, 72.8478);
    assert.strictEqual(result[0].phone, '+919820112233');
    assert.strictEqual(result[0].waitingCount, 3);
    assert.strictEqual(result[0].estimatedWaitMinutes, 20);
  });

  // 10. Coordinates and government centre links preservation
  await suite.test('deduplicateProviders preserves separate government centres with distinct centre query links', () => {
    const items = [
      {
        id: 'gcentre-101',
        title: 'Maha E-Seva Kendra — Dadar Citizen Facility',
        category: 'government',
        city: 'Mumbai',
        address: 'Shop 12, Ground Floor, Chhabildas Road, Near Dadar Railway Station (West)',
        latitude: 19.0178,
        longitude: 72.8478,
        link: '/government-services?centre=gcentre-101',
      },
      {
        id: 'gcentre-102',
        title: 'Aadhaar Seva Kendra — Andheri Facilitation Desk',
        category: 'government',
        city: 'Mumbai',
        address: 'Unit 4, Crystal Point Mall, New Link Road, Andheri West',
        latitude: 19.1363,
        longitude: 72.8276,
        link: '/government-services?centre=gcentre-102',
      },
    ];

    const result = deduplicateProviders(items);
    assert.strictEqual(result.length, 2, 'Both distinct government centres must be retained');
    assert.strictEqual(result[0].latitude, 19.0178);
    assert.strictEqual(result[1].latitude, 19.1363);
  });

  // 11. Empty and invalid inputs
  await suite.test('deduplicateProviders safely handles empty/null arrays', () => {
    assert.deepStrictEqual(deduplicateProviders([]), []);
    assert.deepStrictEqual(deduplicateProviders(null), []);
    assert.deepStrictEqual(deduplicateProviders(undefined), []);
  });
});
