import React from 'react';
import { Link } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────────────
   Hero Section — Shewwina Friendly Redesign
   Fresh green palette: #166534 (primary), #22C55E (accent), #DCFCE7 (soft)
   Layout: Centered friendly headline + clean illustrative queue card
───────────────────────────────────────────────────────────────────── */

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function Hero() {
  return (
    <section
      id="home"
      aria-label="Shewwina — Smart Waiting Platform"
      className="relative overflow-hidden bg-[#F8FAFC] pt-12 pb-16 lg:pt-20 lg:pb-24"
    >
      {/* Subtle green ambient glow & grid pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-grid-pattern opacity-40"
      />
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle 500px at 50% 60px, rgba(34,197,94,0.09), transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Headline Block ───────────────────────────── */}
        <div className="max-w-3xl mx-auto text-center">

          {/* Friendly Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-semibold mb-6 cursor-default select-none shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" aria-hidden="true" />
            <span>Shewwina — Smart Waiting Platform</span>
            <span className="text-emerald-400" aria-hidden="true">•</span>
            <span className="text-emerald-700 font-normal hidden sm:inline">College CSE Mini-Project</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-[#172033] tracking-tight leading-[1.12]">
            Your Time Matters.{' '}
            <br />
            <span className="text-emerald-800">
              Waiting Doesn't Have To.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg text-[#64748B] leading-relaxed max-w-2xl mx-auto">
            Join a queue, track your turn, and spend less time wondering when it’s your turn.
            A friendly, digital queue system for salons, clinics, and everyday service businesses.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <a
              href="#explore-services"
              id="hero-explore-services"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <span>Explore Services</span>
              <svg className="w-4 h-4 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </a>

            <a
              href="#how-it-works"
              id="hero-see-how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-800 rounded-full shadow-xs hover:shadow transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <span>See How It Works</span>
            </a>

            <Link
              to="/demo"
              id="hero-try-demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-full shadow-xs hover:shadow transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <span>⚡ Try Live Simulation</span>
            </Link>
          </div>

          {/* Quick Real Value Points */}
          <ul
            className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-600 font-medium"
            aria-label="Core benefits"
          >
            <li className="flex items-center gap-1.5"><CheckIcon />No app download required</li>
            <li className="flex items-center gap-1.5"><CheckIcon />Instant digital token pass</li>
            <li className="flex items-center gap-1.5"><CheckIcon />Real-time wait estimation</li>
          </ul>
        </div>

        {/* ── Illustrative Queue Preview Card ───────────────────────────── */}
        <div className="mt-12 sm:mt-14 max-w-xl mx-auto">
          <div className="rounded-3xl bg-white border border-emerald-100 shadow-xl shadow-slate-900/5 p-5 sm:p-6 relative overflow-hidden transition-all hover:shadow-2xl">
            {/* Soft decorative background tint */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-50 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

            {/* Header with Demo Data Label */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Live Queue Preview
                </span>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Demo Data
              </span>
            </div>

            {/* Illustrative Token Card Content */}
            <div className="mt-5 space-y-4">
              <div className="p-4 rounded-2xl bg-[#DCFCE7]/40 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs text-emerald-800 font-medium">Luxe Salon & Care</div>
                  <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">Token #S-104</div>
                  <div className="text-xs text-slate-600 mt-1">Haircut & Styling</div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-700 text-white shadow-xs">
                    #2 in Line
                  </span>
                  <div className="text-xs font-semibold text-slate-600 mt-1.5">
                    Est. Wait: <strong className="text-emerald-800">~10 min</strong>
                  </div>
                </div>
              </div>

              {/* Progress Steps Indicator */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 text-xs flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">●</span>
                  <span>Currently Serving: <strong className="text-slate-800 font-mono">S-103</strong></span>
                </div>
                <div className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                  <span>Getting closer</span>
                  <span className="animate-bounce">→</span>
                </div>
              </div>
            </div>

            {/* Card footer caption */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#64748B]">
              <span>Sample preview of customer waiting screen</span>
              <Link to="/demo" className="text-emerald-700 font-semibold hover:underline">
                Open full interactive playground →
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
