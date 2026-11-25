import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Building2,
  Stethoscope,
  Scissors,
  Landmark,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  Phone,
  User,
  X,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../Navbar';
import FooterSection from '../FooterSection';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import ErrorState from '../components/ui/ErrorState';
import ExploreMap from '../components/explore/ExploreMap';
import { isValidCoordinate, calculateDistanceKm } from '../utils/geo';
import {
  getBusinessDirectoryApi,
  searchHospitalsApi,
  searchGovernmentCentresApi,
} from '../services/api';
import {
  formatProviderTitle,
  resolveBusinessCategory,
  deduplicateProviders,
} from '../utils/providerDeduplication';

/* ─────────────────────────────────────────────────────────────────────────────
   SHEWWINA Mobile-First Explore & Nearby Discovery (/explore)
   Aligned with target reference design:
   1. Top Greeting & Profile Avatar
   2. Clean Search Input & Compact Category Chips
   3. Interactive Leaflet Map with Clean Blue Location Markers
   4. Nearby Service Cards Directly Below the Map
   5. Bottom Navigation Bar Integration
───────────────────────────────────────────────────────────────────────────── */

const CATEGORY_TABS = [
  { id: 'all', label: 'All', icon: Filter },
  { id: 'hospital', label: 'Hospital', icon: Building2 },
  { id: 'clinic', label: 'Clinic', icon: Stethoscope },
  { id: 'salon', label: 'Salon', icon: Scissors },
  { id: 'government', label: 'Government', icon: Landmark },
];

export default function ExplorePage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCat = searchParams.get('category') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User Geolocation State
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const [businesses, setBusinesses] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [kendras, setKendras] = useState([]);

  // Load all providers from real backend endpoints
  const fetchAllData = async () => {
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
      console.error('Failed to load explore data:', err);
      setError('Unable to load directory providers. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Request User Location with graceful fallback on denial
  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation permission not granted or timeout:', err.message);
        setLocating(false);
        // Do not display an aggressive error banner for normal user dismissals
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  // Update URL search parameters when filters change
  const applyFilters = (cat, q) => {
    setSelectedCategory(cat);
    setSearchQuery(q);

    const params = new URLSearchParams();
    if (cat !== 'all') params.set('category', cat);
    if (q) params.set('search', q);
    setSearchParams(params);
  };

  // Harmonize and deduplicate all provider models
  const rawProviders = [
    ...hospitals.map((h) => ({
      id: h.id,
      title: formatProviderTitle(h.name),
      category: 'hospital',
      categoryLabel: 'Hospital OPD',
      address: h.address || h.city,
      city: h.city,
      phone: h.phone,
      latitude: h.latitude,
      longitude: h.longitude,
      waitingCount: h.waitingCount ?? h.queue?.waitingCount ?? null,
      estimatedWaitMinutes: h.estimatedWaitMinutes ?? h.queue?.estimatedWaitMinutes ?? null,
      hours: h.opening_hours || '24x7 Emergency / OPD 09:00 AM - 05:00 PM',
      meta: h.hospital_type ? `${h.hospital_type} Healthcare` : 'Multi-Specialty Healthcare',
      subMeta: h.departments?.length ? `${h.departments.length} Outpatient Departments` : 'General & Specialist OPD',
      link: `/hospital/${h.id}`,
      actionText: 'View OPD',
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
        latitude: b.latitude,
        longitude: b.longitude,
        waitingCount: b.waitingCount ?? b.queue?.waitingCount ?? null,
        estimatedWaitMinutes: b.estimatedWaitMinutes ?? b.queue?.estimatedWaitMinutes ?? null,
        hours: isClinic ? 'Mon - Sat (10:00 AM - 08:00 PM)' : 'Tue - Sun (10:00 AM - 09:00 PM)',
        meta: isClinic ? 'Doctor Consultation & Outpatient Care' : 'Haircut & Personal Grooming',
        subMeta: isClinic ? 'Digital Queue Pass Available' : 'Live Queue & Walk-ins',
        link: `/join/${b.slug || b.id}`,
        actionText: 'Join Queue',
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
      latitude: k.latitude,
      longitude: k.longitude,
      waitingCount: k.waitingCount ?? k.queue?.waitingCount ?? null,
      estimatedWaitMinutes: k.estimatedWaitMinutes ?? k.queue?.estimatedWaitMinutes ?? null,
      hours: k.operating_hours || 'Mon - Sat (09:30 AM - 05:30 PM)',
      meta: 'Aadhaar, Passport & Citizen Services',
      subMeta: k.counters?.length ? `${k.counters.length} Active Service Desks` : 'Document Facilitation',
      link: `/government-services?centre=${k.id}`,
      actionText: 'Explore Desks',
      badgeVariant: 'government',
    })),
  ];

  const allProviders = deduplicateProviders(rawProviders);

  // Apply active search and category filters
  const filteredProviders = allProviders.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchAddress = item.address?.toLowerCase().includes(q);
      const matchCity = item.city?.toLowerCase().includes(q);
      const matchMeta = item.meta?.toLowerCase().includes(q);
      if (!matchTitle && !matchAddress && !matchCity && !matchMeta) return false;
    }
    return true;
  });

  const userGreeting = isAuthenticated && user?.name
    ? `Hello, ${user.name.split(' ')[0]} 👋`
    : 'Explore Nearby 👋';

  return (
    <div className="bg-[#FAF8F5] text-[#171717] min-h-screen flex flex-col font-sans selection:bg-[#2563EB] selection:text-white">
      {/* Desktop Top Navbar */}
      <Navbar />

      <main className="flex-1 py-4 sm:py-8 pb-28 lg:pb-12">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-4">

          {/* ── 1. TOP GREETING & PROFILE AVATAR ───────────────────────────── */}
          <header className="flex items-center justify-between gap-3 pt-1 pb-2">
            <div>
              <h1 className="font-sans font-extrabold text-xl sm:text-2xl text-[#171717] tracking-tight">
                {userGreeting}
              </h1>
              <p className="text-xs text-[#78716C] mt-0.5">
                Find healthcare, salons, and public services with live queues
              </p>
            </div>

            {/* Profile Avatar / Quick Link */}
            <Link
              to={isAuthenticated ? '/customer/dashboard' : '/login'}
              title={isAuthenticated ? 'Open Customer Dashboard' : 'Sign In'}
              className="w-10 h-10 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-900/10 hover:bg-[#1D4ED8] transition-all flex-shrink-0 active:scale-95"
              aria-label="Profile navigation"
            >
              {isAuthenticated && user?.name ? (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              ) : (
                <User className="w-5 h-5" />
              )}
            </Link>
          </header>

          {/* ── 2. SEARCH BAR & COMPACT CATEGORY FILTER CHIPS ─────────────── */}
          <section className="space-y-3" aria-label="Search and filter services">
            {/* Unified Search Input */}
            <div className="relative flex items-center bg-white rounded-2xl border border-[#E7E3DC] shadow-xs px-3.5 py-2.5 focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <Search className="w-4 h-4 text-[#2563EB] flex-shrink-0 mr-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => applyFilters(selectedCategory, e.target.value)}
                placeholder="Search business, service, doctor or location..."
                className="w-full text-xs sm:text-sm text-[#171717] placeholder-[#A8A29E] bg-transparent border-0 focus:outline-none focus:ring-0 p-0"
                aria-label="Search services"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => applyFilters(selectedCategory, '')}
                  className="p-1 text-[#78716C] hover:text-[#171717] rounded-lg ml-1"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Compact Category Chips Bar */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {CATEGORY_TABS.map((tab) => {
                const Icon = tab.icon;
                const isSelected = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => applyFilters(tab.id, searchQuery)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'bg-white text-[#57534E] border border-[#E7E3DC] hover:border-[#2563EB]/40 hover:text-[#171717]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── 3. MAIN EXPLORE VIEW: INTERACTIVE MAP & NEARBY CARDS TOGETHER ── */}
          {loading ? (
            <div className="space-y-4 pt-2">
              <div className="w-full h-[260px] sm:h-[320px] rounded-3xl bg-[#E7E3DC]/40 animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map((n) => (
                  <CardSkeleton key={n} />
                ))}
              </div>
            </div>
          ) : error ? (
            <ErrorState
              title="Failed to Load Services"
              message={error}
              onRetry={fetchAllData}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pt-1">

              {/* ── Interactive Map (Visible Above Cards on Mobile, Sticky on Desktop) ── */}
              <div className="lg:col-span-7 w-full h-[260px] sm:h-[320px] lg:h-[580px] lg:sticky lg:top-6">
                <ExploreMap
                  providers={filteredProviders}
                  selectedProvider={selectedProvider}
                  onSelectProvider={(p) => setSelectedProvider(p)}
                  userLocation={userLocation}
                  onRequestLocation={requestUserLocation}
                  locating={locating}
                />
              </div>

              {/* ── Nearby Service Cards (Directly Below Map on Mobile) ── */}
              <div className="lg:col-span-5 space-y-3">
                {/* Header for Nearby List */}
                <div className="flex items-center justify-between px-0.5 pt-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xs font-bold text-[#171717] uppercase tracking-wider">
                      Nearby Services
                    </h2>
                    <span className="text-[11px] font-semibold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {filteredProviders.length}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#78716C]">
                    Tap card to locate on map
                  </span>
                </div>

                {/* Empty State */}
                {filteredProviders.length === 0 ? (
                  <EmptyState
                    icon={Search}
                    title="No service providers found"
                    description="Try selecting 'All' or clearing your search keywords."
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyFilters('all', '')}
                      >
                        Clear Filters
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-2.5 max-h-[580px] overflow-y-auto no-scrollbar pr-0.5">
                    {filteredProviders.map((provider) => {
                      const isSelected = selectedProvider?.id === provider.id;

                      // Actual calculated distance only when user location & real provider coordinates exist
                      let distanceBadge = null;
                      if (
                        userLocation &&
                        isValidCoordinate(userLocation[0], userLocation[1]) &&
                        isValidCoordinate(provider.latitude, provider.longitude)
                      ) {
                        const d = calculateDistanceKm(
                          userLocation[0],
                          userLocation[1],
                          Number(provider.latitude),
                          Number(provider.longitude)
                        );
                        if (!isNaN(d)) {
                          distanceBadge = d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
                        }
                      }

                      return (
                        <article
                          key={`${provider.category}-${provider.id}`}
                          onClick={() => setSelectedProvider(provider)}
                          className={`p-3.5 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs ${
                            isSelected
                              ? 'border-[#2563EB] ring-2 ring-blue-100 shadow-sm'
                              : 'border-[#E7E3DC] hover:border-[#2563EB]/40'
                          }`}
                        >
                          {/* Top Row: Category badge & Distance */}
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              {provider.categoryLabel}
                            </span>

                            {distanceBadge && (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                                <span>📍</span>
                                <span>{distanceBadge}</span>
                              </span>
                            )}
                          </div>

                          {/* Business Name */}
                          <h3 className="text-sm font-bold text-[#171717] tracking-tight truncate">
                            {provider.title}
                          </h3>

                          {/* Address & Meta */}
                          <p className="text-xs text-[#78716C] mt-0.5 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-[#A8A29E] flex-shrink-0" />
                            <span>{provider.address || provider.city}</span>
                          </p>

                          {/* Live Queue Status & Action Button */}
                          <div className="mt-2.5 pt-2 border-t border-[#F0ECE4] flex items-center justify-between gap-2">
                            {/* Actual queue info if returned by backend, else clean active badge */}
                            <div className="text-[11px] text-[#57534E]">
                              {provider.waitingCount != null ? (
                                <span className="font-semibold text-[#171717] flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>{provider.waitingCount} in line • ~{provider.estimatedWaitMinutes || provider.waitingCount * 15}m wait</span>
                                </span>
                              ) : (
                                <span className="font-medium text-emerald-700 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span>Live Queue Open</span>
                                </span>
                              )}
                            </div>

                            {/* View / Join Action */}
                            <Link
                              to={provider.link}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors shadow-xs active:scale-95 flex-shrink-0"
                            >
                              <span>{provider.actionText}</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Desktop Footer */}
      <FooterSection />
    </div>
  );
}
