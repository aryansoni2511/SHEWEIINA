import React from 'react';

/* ─────────────────────────────────────────────────────────────────────
   Industries Section — Phase 3 Redesign
   7 verticals in a responsive card grid
───────────────────────────────────────────────────────────────────── */

const INDUSTRIES = [
  {
    id: 'salon',
    title: 'Salons & Spas',
    tagline: 'HAIR & BEAUTY',
    description: 'Eliminate crowded waiting chairs. Clients browse nearby shops until their stylist is ready — and arrive right on time.',
    footerLabel: 'Stylist Flow Sync',
    color: 'indigo',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 0A3 3 0 104.879 4.879a3 3 0 004.242 4.242zm0 5.758a3 3 0 10-4.242 4.242 3 3 0 004.242-4.242z" />
      </svg>
    ),
  },
  {
    id: 'clinic',
    title: 'Clinics & OPDs',
    tagline: 'HEALTHCARE',
    description: 'Reduce patient anxiety in waiting rooms with live queue tracking, SMS alerts, and smart doctor scheduling.',
    footerLabel: 'Doctor Queue Engine',
    color: 'rose',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    id: 'hospital',
    title: 'Hospitals & Labs',
    tagline: 'HIGH VOLUME',
    description: 'Streamline high-volume patient flow across labs, pharmacy pickups, and multi-department specialist visits.',
    footerLabel: 'Multi-Dept Routing',
    color: 'emerald',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h1m-1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'restaurant',
    title: 'Restaurants & Cafes',
    tagline: 'HOSPITALITY',
    description: 'Replace buzzer pagers with WhatsApp waitlist notifications. Guests wait nearby and arrive exactly when the table is ready.',
    footerLabel: 'Table Seating Sync',
    color: 'amber',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'bank',
    title: 'Banks & Financial',
    tagline: 'FINANCE',
    description: 'Manage counter queues, teller routing, and VIP customer appointments with real-time wait analytics and audit trails.',
    footerLabel: 'Teller & Counter Routing',
    color: 'cyan',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
    ),
  },
  {
    id: 'government',
    title: 'Government Offices',
    tagline: 'PUBLIC SECTOR',
    description: 'Organize public queues for license renewals, documentation counters, and municipal services with digital precision.',
    footerLabel: 'Public Counter Engine',
    color: 'purple',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
  },
  {
    id: 'service',
    title: 'Service Centers',
    tagline: 'ELECTRONICS & AUTO',
    description: 'Notify customers instantly when their device, car, or item is ready for pickup or bench assignment.',
    footerLabel: 'Pickup & Status Alerts',
    color: 'slate',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const colorTokens = {
  indigo: { badge: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: 'bg-indigo-50 border-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white', hover: 'hover:border-indigo-400/40' },
  rose:   { badge: 'text-rose-600 bg-rose-50 border-rose-100',       icon: 'bg-rose-50 border-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',       hover: 'hover:border-rose-400/40'   },
  emerald:{ badge: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: 'bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white', hover: 'hover:border-emerald-400/40' },
  amber:  { badge: 'text-amber-600 bg-amber-50 border-amber-100',    icon: 'bg-amber-50 border-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',    hover: 'hover:border-amber-400/40'  },
  cyan:   { badge: 'text-cyan-600 bg-cyan-50 border-cyan-100',       icon: 'bg-cyan-50 border-cyan-100 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white',       hover: 'hover:border-cyan-400/40'   },
  purple: { badge: 'text-purple-600 bg-purple-50 border-purple-100', icon: 'bg-purple-50 border-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white', hover: 'hover:border-purple-400/40' },
  slate:  { badge: 'text-slate-700 bg-slate-100 border-slate-200',   icon: 'bg-slate-100 border-slate-200 text-slate-700 group-hover:bg-slate-900 group-hover:text-white',   hover: 'hover:border-slate-400/40'  },
};

export default function IndustriesSection() {
  return (
    <section id="industries" aria-labelledby="industries-heading" className="py-24 bg-white border-t border-slate-200/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
            </svg>
            Industries We Serve
          </div>

          <h2 id="industries-heading" className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Built for Every{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Waiting Business
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            From boutique salons to high-volume diagnostic clinics and public service offices — Shewwina works wherever waiting exists.
          </p>
        </div>

        {/* 7 industry cards */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {INDUSTRIES.map((ind) => {
            const c = colorTokens[ind.color] || colorTokens.indigo;
            return (
              <div
                key={ind.id}
                className={`group flex flex-col p-6 rounded-2xl bg-white border border-slate-200/80 ${c.hover} shadow-[0_1px_3px_0_rgba(15,23,42,0.06)] hover:shadow-[0_10px_25px_-3px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-12 h-12 p-2.5 rounded-xl border flex items-center justify-center transition-colors duration-300 shrink-0 ${c.icon}`}>
                    {ind.icon}
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${c.badge}`}>
                    {ind.tagline}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">
                  {ind.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed flex-1">{ind.description}</p>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>{ind.footerLabel}</span>
                  <span className="text-indigo-500 font-bold group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
