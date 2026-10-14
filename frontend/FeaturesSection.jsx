import React from 'react';

/* ─────────────────────────────────────────────────────────────────────
   Features Section — Phase 3 Redesign
   8 real Shewwina features in a 4-col grid
───────────────────────────────────────────────────────────────────── */

const FEATURES = [
  {
    id: '01',
    title: 'Live Queue Sync',
    badge: 'REALTIME',
    category: 'Queue Management',
    description: 'Digital waitlist synchronized across all staff devices with instant live status updates and priority controls.',
    color: 'indigo',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: '02',
    title: 'Digital Token System',
    badge: 'PAPERLESS',
    category: 'Pass Generation',
    description: 'QR-based digital tokens issued instantly to customer smartphones. Zero paper, zero lost tickets, zero confusion.',
    color: 'emerald',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
  },
  {
    id: '03',
    title: 'Real-Time ETA',
    badge: 'CALCULATED',
    category: 'Wait Time Engine',
    description: 'Position and estimated wait time calculated from service duration and queue velocity — updated live as the queue moves.',
    color: 'amber',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: '04',
    title: 'WhatsApp & SMS Alerts',
    badge: 'AUTOMATED',
    category: 'Turn Reminders',
    description: 'Automated WhatsApp and SMS notifications keep clients informed when their turn approaches — no manual follow-up.',
    color: 'rose',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    id: '05',
    title: 'Business Dashboard',
    badge: 'CONTROL HUB',
    category: 'Central Control',
    description: 'Unified dashboard: monitor all tokens, queue state, serving status, and staff actions from one screen.',
    color: 'slate',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    id: '06',
    title: 'Public Display Mode',
    badge: 'TV READY',
    category: 'Lobby Screen',
    description: 'Cast to any lobby TV or tablet — live token display with voice-based call announcements for high-visibility waiting areas.',
    color: 'cyan',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    id: '07',
    title: 'Revenue Tracking',
    badge: 'TODAY\'S DATA',
    category: 'Analytics',
    description: 'View estimated revenue from served customers today with price snapshots captured at join time — accurate even after price changes.',
    color: 'purple',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: '08',
    title: 'No App Download',
    badge: 'BROWSER ONLY',
    category: 'Customer Access',
    description: 'Customers access their live queue pass from any mobile browser — no install, no account, no friction.',
    color: 'sky',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="2" />
        <path d="M12 18h.01" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
];

const colorTokens = {
  indigo: { badge: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: 'bg-indigo-50 border-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white', arrow: 'text-indigo-600', hover: 'hover:border-indigo-400/40' },
  emerald: { badge: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: 'bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white', arrow: 'text-emerald-600', hover: 'hover:border-emerald-400/40' },
  amber: { badge: 'text-amber-600 bg-amber-50 border-amber-100', icon: 'bg-amber-50 border-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white', arrow: 'text-amber-600', hover: 'hover:border-amber-400/40' },
  rose: { badge: 'text-rose-600 bg-rose-50 border-rose-100', icon: 'bg-rose-50 border-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white', arrow: 'text-rose-600', hover: 'hover:border-rose-400/40' },
  slate: { badge: 'text-slate-700 bg-slate-100 border-slate-200', icon: 'bg-slate-100 border-slate-200 text-slate-700 group-hover:bg-slate-900 group-hover:text-white', arrow: 'text-slate-700', hover: 'hover:border-slate-400/40' },
  cyan: { badge: 'text-cyan-600 bg-cyan-50 border-cyan-100', icon: 'bg-cyan-50 border-cyan-100 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white', arrow: 'text-cyan-600', hover: 'hover:border-cyan-400/40' },
  purple: { badge: 'text-purple-600 bg-purple-50 border-purple-100', icon: 'bg-purple-50 border-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white', arrow: 'text-purple-600', hover: 'hover:border-purple-400/40' },
  sky: { badge: 'text-sky-600 bg-sky-50 border-sky-100', icon: 'bg-sky-50 border-sky-100 text-sky-600 group-hover:bg-sky-600 group-hover:text-white', arrow: 'text-sky-600', hover: 'hover:border-sky-400/40' },
};

export default function FeaturesSection() {
  return (
    <section id="features" aria-labelledby="features-heading" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Feature Suite
          </div>

          <h2 id="features-heading" className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Everything to{' '}
            <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Master Customer Flow
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Built for salons, clinics, and service businesses. Real capabilities, not buzzwords.
          </p>
        </div>

        {/* 8 Feature cards — 4 col on lg */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => {
            const c = colorTokens[f.color] || colorTokens.indigo;
            return (
              <div
                key={f.id}
                className={`group flex flex-col p-6 rounded-2xl bg-white border border-slate-200/80 ${c.hover} shadow-[0_1px_3px_0_rgba(15,23,42,0.06)] hover:shadow-[0_10px_25px_-3px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}
              >
                {/* Number watermark */}
                <span
                  aria-hidden="true"
                  className="absolute top-3 right-4 font-mono text-5xl font-black text-slate-900/[0.03] leading-none select-none"
                >
                  {f.id}
                </span>

                <div className="flex items-center justify-between mb-5">
                  <div className={`w-11 h-11 p-2.5 rounded-xl border flex items-center justify-center transition-colors duration-300 shrink-0 ${c.icon}`}>
                    {f.icon}
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${c.badge}`}>
                    {f.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed flex-1">{f.description}</p>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>{f.category}</span>
                  <span className={`${c.arrow} font-bold group-hover:translate-x-0.5 transition-transform`}>→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
