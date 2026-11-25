import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../Navbar';
import FooterSection from '../FooterSection';
import GovtCentreMap from '../components/government/GovtCentreMap';
import { getGovernmentServicesApi, searchGovernmentCentresApi } from '../services/api';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

/* ─────────────────────────────────────────────────────────────────────────
   Government Services Discovery Page
   Institutional Navy (#0F172A, #1E3A8A) with subtle saffron and green accents.
   Structural pattern mirrors Salon / Hospital discovery.
───────────────────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { id: 'All', label: 'All Services', icon: '🏛️', desc: 'All citizen services' },
  { id: 'Aadhaar', label: 'Aadhaar Seva', icon: '🪪', desc: 'Demographic & Biometric updates' },
  { id: 'Passport', label: 'Passport Services', icon: '🛂', desc: 'PSK appointment guidance & checklists' },
  { id: 'RTO', label: 'RTO Services', icon: '🚗', desc: 'Driving licence & RC facilitation' },
  { id: 'Municipal', label: 'Municipal Services', icon: '🏢', desc: 'Birth/Death certificates & tax' },
];

export default function GovernmentDiscoveryPage() {
  const [searchParams] = useSearchParams();
  const centreParam = searchParams.get('centre');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [services, setServices] = useState([]);
  const [centres, setCentres] = useState([]);
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingCentres, setLoadingCentres] = useState(true);
  const [activeTab, setActiveTab] = useState(centreParam ? 'centres' : 'services'); // 'services' | 'centres'

  useEffect(() => {
    async function loadServices() {
      try {
        setLoadingServices(true);
        const cat = selectedCategory === 'All' ? '' : selectedCategory;
        const res = await getGovernmentServicesApi(cat);
        if (res?.success) {
          setServices(res.data.services || []);
        }
      } catch (err) {
        console.error('Failed to load government services:', err);
      } finally {
        setLoadingServices(false);
      }
    }
    loadServices();
  }, [selectedCategory]);

  useEffect(() => {
    async function loadCentres() {
      try {
        setLoadingCentres(true);
        const cat = selectedCategory === 'All' ? '' : selectedCategory;
        const res = await searchGovernmentCentresApi({
          search: searchQuery,
          category: cat,
          city: selectedCity,
        });
        if (res?.success) {
          const loadedCentres = res.data.centres || [];
          setCentres(loadedCentres);
          if (loadedCentres.length > 0) {
            const matched = centreParam ? loadedCentres.find((c) => c.id === centreParam) : null;
            setSelectedCentre(matched || loadedCentres[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load facilitation centres:', err);
      } finally {
        setLoadingCentres(false);
      }
    }
    const timer = setTimeout(loadCentres, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedCity]);

  const filteredServices = services.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pb-28 lg:pb-12">
        {/* ── Statutory Disclaimer Banner ─────────────────────────────────── */}
        <div className="bg-amber-500/10 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-900 font-medium">
          <span className="font-bold">Citizen Facilitation Notice:</span> SHEWWINA is an independent queue facilitation platform for authorized Seva Kendras and citizen desks. We do not issue government documents or represent UIDAI, MEA, MoRTH, or Municipal bodies.
        </div>

        {/* ── Hero Section ────────────────────────────────────────────────── */}
        <section
          className="relative text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 55%, #0F172A 100%)' }}
        >
          {/* Subtle Tri-Color Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-white to-emerald-600 opacity-80" />

          <div className="max-w-7xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-amber-300 border border-white/15 backdrop-blur-sm mb-4">
              <span>🏛️ Citizen Services Queue Management</span>
              <span className="w-1 h-1 rounded-full bg-white/40" />
              <span>Zero Waiting at Seva Kendras</span>
            </div>

            <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight max-w-4xl mx-auto leading-tight">
              Smarter Citizen Services. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-white to-emerald-400">
                Transparent Fees &amp; Live Tokens.
              </span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Check document checklists, verify official government fees, and get digital tokens for Aadhaar, Passport, RTO, and Municipal desks before you leave home.
            </p>

            {/* Search Box */}
            <div className="mt-8 max-w-3xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl p-2 shadow-2xl border border-white/20 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center px-3 gap-2">
                <span className="text-slate-400 text-lg">🔍</span>
                <input
                  type="text"
                  placeholder="Search Aadhaar, Passport, Driving Licence, Birth Certificate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
                />
              </div>

              <div className="sm:w-44 flex items-center border-t sm:border-t-0 sm:border-l border-slate-200 px-3 py-1">
                <span className="text-slate-400 text-sm mr-2">📍</span>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full text-xs text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="">All Cities</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Thane">Thane</option>
                  <option value="Navi Mumbai">Navi Mumbai</option>
                  <option value="Pune">Pune</option>
                </select>
              </div>

              <button
                type="button"
                className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-semibold text-sm transition-all shadow-md"
              >
                Search
              </button>
            </div>
          </div>
        </section>

        {/* ── Category Filters ────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all shadow-sm ${
                    isSelected
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md -translate-y-0.5'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="font-bold text-xs sm:text-sm">{cat.label}</div>
                  <div className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                    {cat.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Navigation Tabs: Services Catalog vs Kendra Centres ────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('services')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'services'
                    ? 'bg-blue-950 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                📋 Service Catalog &amp; Documents ({filteredServices.length})
              </button>
              <button
                onClick={() => setActiveTab('centres')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'centres'
                    ? 'bg-blue-950 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                📍 Facilitation Kendras &amp; Live Map ({centres.length})
              </button>
            </div>

            <Link
              to="/register-government-centre"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-blue-900 hover:text-blue-700"
            >
              <span>Register Seva Kendra</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* ── Content View 1: Service Catalog ─────────────────────────────── */}
        {activeTab === 'services' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            {loadingServices ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse h-48" />
                ))}
              </div>
            ) : filteredServices.length === 0 ? (
              <EmptyState
                title="No Services Found"
                description="Try selecting a different category or clearing search terms."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
                  >
                    <div>
                      {/* Category Badge & Duration */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200">
                          {service.category}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          ⏱️ ~{service.estimated_duration_minutes} mins
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-bold text-base text-slate-900 hover:text-blue-900 transition-colors">
                        <Link to={`/government-services/service/${service.slug}`}>
                          {service.name}
                        </Link>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>

                      {/* Fee Display */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <div className="text-[11px] text-slate-400">Govt Official Fee</div>
                          <div className="font-extrabold text-sm text-slate-900">
                            {Number(service.official_fee) === 0 ? 'FREE' : `₹${Number(service.official_fee).toFixed(0)}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] text-slate-400">Required Docs</div>
                          <div className="font-bold text-xs text-blue-900">
                            {service.required_documents?.length || 0} Documents
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <Link
                        to={`/government-services/service/${service.slug}`}
                        className="flex-1 text-center py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
                      >
                        Document Checklist &amp; Token →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Content View 2: Facilitation Kendras & Split Map ───────────── */}
        {activeTab === 'centres' && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Centre Cards */}
              <div className="lg:col-span-6 space-y-4">
                {loadingCentres ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse h-40" />
                  ))
                ) : centres.length === 0 ? (
                  <EmptyState
                    title="No Facilitation Centres Found"
                    description="No kendras found matching your location or category filter."
                  />
                ) : (
                  centres.map((centre) => {
                    const isSelected = selectedCentre?.id === centre.id;
                    return (
                      <div
                        key={centre.id}
                        id={`centre-${centre.id}`}
                        onClick={() => setSelectedCentre(centre)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/40 border-blue-900 ring-1 ring-blue-900 shadow-md'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                {centre.centre_type || 'Kendra'}
                              </span>
                              {centre.is_verified ? (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  ✓ Verified
                                </span>
                              ) : (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                  Facilitation Desk
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-base text-slate-900 mt-1.5">{centre.name}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              📍 {centre.address}, {centre.city} — {centre.pincode}
                            </p>
                          </div>

                          {centre.distanceKm !== null && centre.distanceKm !== undefined && (
                            <span className="text-xs font-bold text-blue-950 bg-blue-100/70 px-2 py-1 rounded-lg shrink-0">
                              {centre.distanceKm} km
                            </span>
                          )}
                        </div>

                        {/* Supported categories */}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {(centre.supported_categories || []).map((cat) => (
                            <span
                              key={cat}
                              className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>

                        {/* Timing and Phone */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                          <span>🕐 {centre.operating_hours || 'Mon - Sat (09:30 AM - 05:30 PM)'}</span>
                          <span>📞 {centre.phone}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Sticky Map */}
              <div className="lg:col-span-6 sticky top-20">
                <GovtCentreMap
                  centres={centres}
                  selectedCentre={selectedCentre}
                  onSelectCentre={(c) => setSelectedCentre(c)}
                  height={typeof window !== 'undefined' && window.innerWidth < 1024 ? '320px' : '580px'}
                />
              </div>
            </div>
          </section>
        )}

        {/* ── Kendra Admin CTA Banner ─────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div
            className="rounded-3xl p-8 sm:p-10 relative overflow-hidden text-white"
            style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)' }}
          >
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold mb-3 border border-white/20">
                  🏢 For CSC &amp; Kendra Operators
                </div>
                <h2 className="font-display font-extrabold text-xl sm:text-2xl tracking-tight">
                  Operate a Maha E-Seva Kendra or Citizen Counter?
                </h2>
                <p className="text-slate-300 text-sm mt-1.5 max-w-lg leading-relaxed">
                  Join SHEWWINA to publish live token updates, verify citizen document checklists in advance, and eliminate crowded waiting areas at your counters.
                </p>
              </div>

              <Link
                to="/register-government-centre"
                className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shrink-0"
              >
                Register Your Kendra Free →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
