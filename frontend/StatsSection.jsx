import React from 'react';

/* ─────────────────────────────────────────────────────────────────────
   Stats / Trust Section — Phase 3 Redesign
   4 real platform capabilities on a dark background
───────────────────────────────────────────────────────────────────── */

const CAPABILITIES = [
  {
    id: 'qr-checkin',
    title: 'QR Virtual Check-In',
    badge: 'ZERO HARDWARE',
    description:
      'Customers scan a printed QR code or join via link. No thermal paper rolls, ticket dispensers, or buzzer pagers required.',
    color: 'indigo',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'sms-whatsapp',
    title: 'WhatsApp & SMS Alerts',
    badge: 'REAL-TIME',
    description:
      'Customers receive timely turn alerts as their position advances — so they can wait comfortably nearby rather than crowding your reception.',
    color: 'emerald',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    id: 'live-tracking',
    title: 'Live Browser Tracking',
    badge: 'NO APP NEEDED',
    description:
      'Customers track their position, estimated wait, and live token call from any mobile browser — with optional audio chimes.',
    color: 'amber',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="2" />
        <path d="M12 18h.01" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'tv-display',
    title: 'Lobby TV Display',
    badge: 'LARGE SCREEN',
    description:
      'Cast to any TV or tablet in your lobby for a high-visibility token display. Clients can see their turn approaching at a glance.',
    color: 'purple',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
];

const iconStyles = {
  indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600',
  amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600',
  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600',
};

const hoverBorder = {
  indigo: 'hover:border-indigo-500/40',
  emerald: 'hover:border-emerald-500/40',
  amber: 'hover:border-amber-500/40',
  purple: 'hover:border-purple-500/40',
};

export default function StatsSection() {
  return (
    <section
      id="platform"
      aria-labelledby="platform-heading"
      className="py-24 bg-slate-950 text-white relative overflow-hidden"
    >
      {/* Ambient indigo glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(79,70,229,0.06), transparent)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Built for Real Operations
          </div>

          <h2 id="platform-heading" className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Queue Smarter,{' '}
            <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400">
              Not Harder
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Everything your business needs to turn chaotic waiting lines into an organized, transparent digital experience.
          </p>
        </div>

        {/* 4 Capability cards */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CAPABILITIES.map((cap) => {
            const is = iconStyles[cap.color] || iconStyles.indigo;
            const hb = hoverBorder[cap.color] || hoverBorder.indigo;
            return (
              <div
                key={cap.id}
                className={`group p-7 rounded-2xl bg-slate-900/80 border border-slate-800 ${hb} hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col`}
              >
                <div className={`w-12 h-12 mb-5 rounded-xl border flex items-center justify-center transition-colors duration-300 ${is}`}>
                  {cap.icon}
                </div>

                <span className="inline-block text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase mb-2">
                  {cap.badge}
                </span>

                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors mb-2.5">
                  {cap.title}
                </h3>

                <p className="text-sm text-slate-400 leading-relaxed">{cap.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
