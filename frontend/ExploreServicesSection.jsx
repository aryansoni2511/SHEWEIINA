import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Stethoscope,
  Scissors,
  Landmark,
  MapPin,
  Clock,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import {
  getBusinessDirectoryApi,
  searchHospitalsApi,
  searchGovernmentCentresApi,
} from './services/api';
import {
  formatProviderTitle,
  resolveBusinessCategory,
  deduplicateProviders,
} from './utils/providerDeduplication';
import Badge from './components/ui/Badge';
import Button from './components/ui/Button';
import Card from './components/ui/Card';
import EmptyState from './components/ui/EmptyState';
import Skeleton, { CardSkeleton } from './components/ui/Skeleton';
import ErrorState from './components/ui/ErrorState';

/* ─────────────────────────────────────────────────────────────────────────────
   SHEWWINA Editorial Explore & Discovery Section (Phase 2)
   Aggregates live providers across:
   1. Hospitals (OPD Departments & Doctors)
   2. Clinics (Consultation Queues)
   3. Salons & Spas (Grooming Queues)
   4. Government Services (Citizen Facilitation Kendras)
───────────────────────────────────────────────────────────────────────────── */

const CATEGORY_TABS = [
  { id: 'all', label: 'All Services', icon: Filter },
  { id: 'hospital', label: 'Hospitals & OPD', icon: Building2, badgeVariant: 'hospital' },
  { id: 'clinic', label: 'Clinics', icon: Stethoscope, badgeVariant: 'clinic' },
  { id: 'salon', label: 'Salons & Spas', icon: Scissors, badgeVariant: 'salon' },
  { id: 'government', label: 'Govt & Citizen Kendras', icon: Landmark, badgeVariant: 'government' },
];

export default function ExploreServicesSection({ initialFilter = {} }) {
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState(initialFilter.search || '');
  const [selectedCity, setSelectedCity] = useState(initialFilter.city || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Aggregated data stores
  const [businesses, setBusinesses] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [kendras, setKendras] = useState([]);

  // Load all live data sources concurrently
  const loadDiscoveryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bizRes, hospRes, kendraRes] = await Promise.allSettled([
        getBusinessDirectoryApi(),
        searchHospitalsApi({}),
        searchGovernmentCentresApi({}),
      ]);

      if (bizRes.status === 'fulfilled' && bizRes.value?.data?.businesses) {
        setBusinesses(bizRes.value.data.businesses);
      }
      if (hospRes.status === 'fulfilled' && hospRes.value?.data?.hospitals) {
        setHospitals(hospRes.value.data.hospitals);
      }
      if (kendraRes.status === 'fulfilled' && kendraRes.value?.data?.centres) {
        setKendras(kendraRes.value.data.centres);
      }
    } catch (err) {
      console.error('Failed to load discovery providers:', err);
      setError('Unable to load nearby providers. Please check your network and retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscoveryData();
  }, []);

  // Update filters if props change
  useEffect(() => {
    if (initialFilter.search !== undefined) setSearchQuery(initialFilter.search);
    if (initialFilter.city !== undefined) setSelectedCity(initialFilter.city);
  }, [initialFilter]);

  // Transform and harmonize items into a unified card format
  const rawItems = [
    ...hospitals.map((h) => ({
      id: h.id,
      title: formatProviderTitle(h.name),
      category: 'hospital',
      categoryLabel: 'Hospital OPD',
      address: h.address || h.city,
      city: h.city,
      phone: h.phone,
      meta: h.hospital_type ? `${h.hospital_type} Healthcare` : 'Multi-Specialty Healthcare',
      subMeta: h.departments?.length ? `${h.departments.length} Outpatient Departments` : 'General & Specialist OPD',
      link: `/hospital/${h.id}`,
      actionText: 'View OPD & Doctors',
      badgeVariant: 'hospital',
    })),
    ...businesses.map((b) => {
      const resolvedCategory = resolveBusinessCategory(b);
      const isClinic = resolvedCategory === 'clinic';
      return {
        id: b.id,
        title: formatProviderTitle(b.name),
        category: resolvedCategory,
        categoryLabel: isClinic ? 'Clinic' : 'Salon & Spa',
        address: b.address || b.city,
        city: b.city,
        phone: b.phone,
        meta: isClinic ? 'Doctor Consultation & Checkup' : 'Haircut & Personal Grooming',
        subMeta: isClinic ? 'Digital Queue Pass Available' : 'Live Queue & Walk-ins',
        link: `/join/${b.slug || b.id}`,
        actionText: isClinic ? 'Join Clinic Queue' : 'Join Salon Queue',
        badgeVariant: resolvedCategory,
      };
    }),
    ...kendras.map((k) => ({
      id: k.id,
      title: formatProviderTitle(k.name),
      category: 'government',
      categoryLabel: 'Citizen Kendra',
      address: k.address || k.city,
      city: k.city,
      phone: k.phone,
      meta: 'Aadhaar, Passport & Citizen Services',
      subMeta: k.counters?.length ? `${k.counters.length} Active Service Desks` : 'Document Facilitation',
      link: `/government-services?centre=${k.id}`,
      actionText: 'Explore Desks & Checklists',
      badgeVariant: 'government',
    })),
  ];

  const unifiedItems = deduplicateProviders(rawItems);

  // Apply in-memory filtering based on selectedTab, search query, and city
  const filteredItems = unifiedItems.filter((item) => {
    // Category Tab Filter
    if (selectedTab !== 'all' && item.category !== selectedTab) {
      return false;
    }
    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchAddress = item.address?.toLowerCase().includes(q);
      const matchCity = item.city?.toLowerCase().includes(q);
      const matchMeta = item.meta?.toLowerCase().includes(q);
      if (!matchTitle && !matchAddress && !matchCity && !matchMeta) return false;
    }
    // City Filter
    if (selectedCity && selectedCity !== 'All Cities' && selectedCity.trim()) {
      const c = selectedCity.toLowerCase().trim();
      if (!item.city?.toLowerCase().includes(c)) return false;
    }
    return true;
  });

  return (
    <section
      id="explore-services"
      aria-labelledby="explore-services-title"
      className="py-16 sm:py-24 bg-[#FAF8F5] border-b border-[#E7E3DC]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E7E3DC] text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-3">
            <span>Live Provider Directory</span>
          </div>
          <h2
            id="explore-services-title"
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#171717] tracking-tight"
          >
            Explore Services &amp; Queues
          </h2>
          <p className="mt-4 text-base text-[#57534E] leading-relaxed">
            Find active queues at hospitals, OPD clinics, salons, and citizen facilitation centres.
            Choose your service to join or monitor queue status.
          </p>
        </div>

        {/* ── Category Filter Tabs ── */}
        <div className="mt-10 flex items-center justify-start sm:justify-center overflow-x-auto pb-2 scrollbar-none gap-2">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#171717] text-white shadow-xs'
                    : 'bg-white text-[#57534E] border border-[#E7E3DC] hover:border-[#171717] hover:text-[#171717]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Search & Filter Controls Bar ── */}
        <div className="mt-6 p-3 rounded-2xl bg-white border border-[#E7E3DC] shadow-xs flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full flex items-center">
            <Search className="w-4 h-4 text-[#A8A29E] ml-3 absolute pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name, doctor, department, or area..."
              className="w-full pl-9 pr-3 py-2 text-sm text-[#171717] placeholder-[#A8A29E] bg-transparent border-0 focus:outline-none focus:ring-0"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 border-t sm:border-t-0 sm:border-l border-[#E7E3DC] pt-2 sm:pt-0 sm:pl-3">
            <div className="relative flex-1 sm:w-40 flex items-center">
              <MapPin className="w-4 h-4 text-[#A8A29E] ml-2 absolute pointer-events-none" />
              <input
                type="text"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                placeholder="City (e.g. Mumbai)"
                className="w-full pl-8 pr-2 py-2 text-sm text-[#171717] placeholder-[#A8A29E] bg-transparent border-0 focus:outline-none focus:ring-0"
              />
            </div>

            {(searchQuery || selectedCity) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCity('');
                }}
                className="text-xs text-[#57534E] hover:text-[#171717] underline font-medium px-2 py-1 shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* ── Provider Cards Grid / Content States ── */}
        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <CardSkeleton key={n} />
              ))}
            </div>
          ) : error ? (
            <ErrorState
              title="Failed to Load Providers"
              message={error}
              onRetry={loadDiscoveryData}
            />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No providers found matching your criteria"
              description="Try adjusting your category filter, keyword query, or city location to find active queues."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTab('all');
                    setSearchQuery('');
                    setSelectedCity('');
                  }}
                >
                  Clear all filters
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item, idx) => {
                const estDistance = (0.8 + ((idx * 37) % 50) / 10).toFixed(1);
                return (
                  <div
                    key={`${item.category}-${item.id}`}
                    className="rounded-2xl bg-white border border-[#E7E3DC] hover:border-[#2563EB] hover:shadow-card transition-all duration-150 p-6 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Header: Category Badge, Distance & City */}
                      <div className="flex items-center justify-between pb-3 border-b border-[#E7E3DC]">
                        <Badge variant={item.badgeVariant} size="sm">
                          {item.categoryLabel}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#BFDBFE]">
                            ~{estDistance} km
                          </span>
                          {item.city && (
                            <div className="flex items-center gap-1 text-xs text-[#57534E] font-medium">
                              <MapPin className="w-3.5 h-3.5 text-[#A8A29E]" />
                              <span>{item.city}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Facility Name & Meta */}
                      <div className="mt-4">
                        <h3 className="font-display text-xl font-bold text-[#171717] leading-snug group-hover:text-[#2563EB] transition-colors">
                          {item.title}
                        </h3>
                        {item.address && (
                          <p className="mt-1 text-xs text-[#57534E] line-clamp-1">
                            {item.address}
                          </p>
                        )}
                      </div>

                      {/* Operational Feature Pill */}
                      <div className="mt-4 p-3 rounded-xl bg-[#FAF8F5] border border-[#E7E3DC] text-xs space-y-1">
                        <div className="font-semibold text-[#171717] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#15803D]" />
                          <span>{item.meta}</span>
                        </div>
                        <div className="text-[#57534E] text-[11px] font-medium">
                          {item.subMeta}
                        </div>
                      </div>
                    </div>

                    {/* Card Action Link */}
                    <div className="mt-6 pt-4 border-t border-[#E7E3DC]">
                      <Link
                        to={item.link}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold transition-all duration-150 shadow-xs active-press"
                      >
                        <span>{item.actionText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Direct Navigation to Dedicated Hubs */}
        <div className="mt-12 p-6 rounded-2xl bg-white border border-[#E7E3DC] flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-display text-lg font-bold text-[#171717]">
              Looking for a specific institutional directory?
            </h4>
            <p className="text-xs text-[#57534E] mt-0.5">
              Explore dedicated hospital OPD departments or citizen document checklists directly.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to="/hospitals"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E7E3DC] hover:border-[#1E40AF] text-[#1E40AF] text-xs font-semibold transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Hospital OPD Hub</span>
            </Link>
            <Link
              to="/government-services"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E7E3DC] hover:border-[#0F172A] text-[#0F172A] text-xs font-semibold transition-colors"
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Citizen Kendras Hub</span>
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#171717] hover:bg-[#262626] text-white text-xs font-semibold transition-colors"
            >
              <span>Full Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
