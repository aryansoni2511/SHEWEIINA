import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight, ShieldCheck, Clock, Smartphone, Sparkles } from 'lucide-react';
import Badge from './components/ui/Badge';
import Button from './components/ui/Button';

/* ─────────────────────────────────────────────────────────────────────────────
   SHEWWINA Editorial Hero Section (Phase 2)
   Design System: Warm ivory canvas (#FAF8F5), stone borders (#E7E3DC),
   charcoal typography (#171717), and tabular numerals.
───────────────────────────────────────────────────────────────────────────── */

const POPULAR_CITIES = [
  'All Cities',
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Pune',
  'Hyderabad',
  'Chennai',
];

export default function Hero({ onSearchSubmit }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit({ search: searchQuery, city: selectedCity === 'All Cities' ? '' : selectedCity });
      const el = document.getElementById('explore-services');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedCity && selectedCity !== 'All Cities') params.set('city', selectedCity);
      navigate(`/explore?${params.toString()}`);
    }
  };

  return (
    <section
      id="home"
      aria-label="SHEWWINA — India's Smart Queue & Customer Flow Platform"
      className="relative overflow-hidden bg-[#FAF8F5] pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-[#E7E3DC]"
    >
      {/* Subtle warm neutral grid texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-grid-pattern opacity-30"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* ── Left Column: Editorial Headline & Search Console (7 cols) ── */}
          <div className="lg:col-span-7 text-left">

            {/* Editorial Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E7E3DC] text-[#57534E] text-xs font-medium mb-6 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#C25E38] animate-pulse" aria-hidden="true" />
              <span className="font-semibold text-[#171717]">SHEWWINA</span>
              <span className="text-[#A8A29E]">•</span>
              <span>India&apos;s Smart Queue Platform</span>
            </div>

            {/* Main Editorial Headline */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-[#171717] tracking-tight leading-[1.12]">
              Your Time Matters.{' '}
              <br className="hidden sm:inline" />
              <span className="italic font-normal text-[#57534E]">
                Arrive when it&apos;s your turn.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg text-[#57534E] leading-relaxed max-w-2xl">
              Search hospitals, outpatient OPDs, local clinics, salons, and citizen facilitation kendras.
              Take an instant digital queue pass in your browser—without crowded waiting rooms.
            </p>

            {/* ── Search & Filter Form Console ── */}
            <form
              onSubmit={handleSearch}
              className="mt-8 p-2 sm:p-2.5 rounded-2xl bg-white border border-[#E7E3DC] shadow-card flex flex-col sm:flex-row items-stretch gap-2.5 max-w-2xl"
            >
              {/* Service / Provider Query Input */}
              <div className="relative flex-1 flex items-center">
                <Search className="w-5 h-5 text-[#A8A29E] ml-3 absolute pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hospital, doctor, salon, or Aadhaar..."
                  className="w-full pl-10 pr-3 py-3 text-sm text-[#171717] placeholder-[#A8A29E] bg-transparent border-0 focus:outline-none focus:ring-0"
                />
              </div>

              {/* City Selector */}
              <div className="relative sm:w-44 border-t sm:border-t-0 sm:border-l border-[#E7E3DC] flex items-center">
                <MapPin className="w-4 h-4 text-[#A8A29E] ml-3 absolute pointer-events-none" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full pl-9 pr-8 py-3 text-sm text-[#171717] bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer appearance-none"
                  aria-label="Select City"
                >
                  {POPULAR_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="absolute right-3 pointer-events-none text-xs text-[#A8A29E]">▼</div>
              </div>

              {/* Search Submit CTA */}
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold rounded-xl shadow-xs transition-colors shrink-0 active-press"
              >
                <span>Find Queues</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Core Trust Pillars */}
            <div className="mt-8 pt-6 border-t border-[#E7E3DC]/80 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-[#57534E]">
              <div className="flex items-center gap-1.5 font-medium">
                <Smartphone className="w-4 h-4 text-[#171717]" />
                <span>Zero app download required</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-[#171717]" />
                <span>Live token & wait estimates</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-[#171717]" />
                <span>Instant browser digital pass</span>
              </div>
            </div>

          </div>

          {/* ── Right Column: Live Editorial Token Preview Artifact (5 cols) ── */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md rounded-2xl bg-white border border-[#E7E3DC] shadow-elevated p-6 overflow-hidden">

              {/* Header: Facility Info & Live Pulse */}
              <div className="flex items-start justify-between pb-4 border-b border-[#E7E3DC]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse" />
                    <span className="text-[11px] font-bold tracking-wider uppercase text-[#15803D]">
                      Active Live Pass
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#171717] mt-1">
                    City Care Multi-Specialty Hospital
                  </h3>
                  <p className="text-xs text-[#57534E]">General Medicine OPD • Counter 03</p>
                </div>
                <Badge variant="hospital" size="sm">Hospital OPD</Badge>
              </div>

              {/* Central Token Number Display */}
              <div className="my-5 p-5 rounded-xl bg-[#FAF8F5] border border-[#E7E3DC] flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-[#57534E] uppercase tracking-wider">Your Digital Token</div>
                  <div className="text-3xl font-extrabold font-mono text-[#171717] tabular-nums mt-0.5 tracking-tight">
                    OPD-108
                  </div>
                  <div className="text-xs text-[#57534E] mt-1">Patient: Anita R. Verma</div>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 rounded-full bg-[#1E40AF] text-white text-xs font-semibold tabular-nums">
                    #2 in Line
                  </div>
                  <div className="text-xs font-semibold text-[#57534E] mt-2">
                    Est. Wait: <span className="text-[#171717] font-mono font-bold tabular-nums">~12 min</span>
                  </div>
                </div>
              </div>

              {/* Live Flow Progression Meter */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs text-[#57534E]">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
                    <span>Now Serving: <strong className="font-mono text-[#171717] tabular-nums">OPD-106</strong></span>
                  </div>
                  <div className="text-[11px] font-medium text-[#1E40AF] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Turn approaching</span>
                  </div>
                </div>

                {/* Stepper bar */}
                <div className="w-full bg-[#E7E3DC] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#171717] h-full w-[70%] rounded-full" />
                </div>

                <div className="flex justify-between text-[11px] text-[#A8A29E] font-mono tabular-nums">
                  <span>Issued 10:15 AM</span>
                  <span>Estimated 10:45 AM</span>
                </div>
              </div>

              {/* Bottom Notice */}
              <div className="mt-5 pt-4 border-t border-[#E7E3DC] text-[11px] text-[#57534E] flex items-center justify-between">
                <span>SMS alert sent to +91 98•••• 1222</span>
                <span className="font-semibold text-[#171717]">Browser auto-refreshes</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
