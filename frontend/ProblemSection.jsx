import React from 'react';

/* ─────────────────────────────────────────────────────────────────────
   Problem Section — Phase 3 Redesign
   Design: dark section, 6 friction cards, no fake metrics
───────────────────────────────────────────────────────────────────── */

const PROBLEMS = [
  {
    id: '01',
    title: 'Unpredictable Long Waits',
    badge: 'Friction #1',
    description: 'Clients wait 45+ minutes in crowded lobbies with zero visibility on when their turn will actually come — causing boredom and anxiety.',
    impact: 'High Customer Drop-off',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: '02',
    title: 'Paper Token Chaos',
    badge: 'Friction #2',
    description: 'Physical slips get lost, crushed, or stolen. Staff shout numbers over noise, leading to skipped turns and arguments.',
    impact: 'Zero Digital Tracking',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  {
    id: '03',
    title: 'Frustrated Clients Leave',
    badge: 'Friction #3',
    description: 'Walk-in clients see a packed lobby and leave. Competitors with digital flow capture your lost revenue.',
    impact: 'Silent Revenue Loss',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
  },
  {
    id: '04',
    title: 'No Queue Visibility',
    badge: 'Friction #4',
    description: "Managers and clients can't see real-time queue length or service speed. Operating completely blind.",
    impact: 'No Analytics Data',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.007 10.007 0 013.682-.763c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
      </svg>
    ),
  },
  {
    id: '05',
    title: 'Overwhelmed Receptionists',
    badge: 'Friction #5',
    description: 'Staff spend hours answering "How much longer?" instead of attending to clients, managing bookings, or driving upsells.',
    impact: 'Staff Administrative Burden',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: '06',
    title: 'Angry 1-Star Reviews',
    badge: 'Friction #6',
    description: 'Lack of transparency turns waiting rooms into hostile environments. Frustrated clients post negative reviews publicly.',
    impact: 'Reputation Damage',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
];

export default function ProblemSection() {
  return (
    <section id="problems" aria-labelledby="problems-heading" className="py-24 bg-slate-900 text-white relative overflow-hidden">
      {/* Ambient glows */}
      <div aria-hidden="true" className="absolute top-0 left-0 w-80 h-80 bg-rose-600/8 rounded-full blur-3xl pointer-events-none" />
      <div aria-hidden="true" className="absolute bottom-0 right-0 w-80 h-80 bg-amber-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            The Queue Problem
          </div>

          <h2 id="problems-heading" className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Traditional Waiting is{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-amber-400">
              Hurting Your Business
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Paper tokens, crowded lobbies, and unanswered "How long?" calls cost salons and clinics real revenue every single day.
          </p>
        </div>

        {/* 6 Problem cards */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PROBLEMS.map((p) => (
            <div
              key={p.id}
              className="group relative p-6 rounded-2xl bg-slate-800/70 border border-slate-700/60 hover:border-slate-600/80 hover:bg-slate-800 transition-all duration-300 hover:-translate-y-1 flex flex-col"
            >
              {/* Number watermark */}
              <span
                aria-hidden="true"
                className="absolute top-4 right-5 font-mono text-[40px] font-black text-white/[0.04] leading-none select-none"
              >
                {p.id}
              </span>

              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600 transition-colors duration-300 shrink-0">
                  {p.icon}
                </div>
                <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 border border-rose-800/50 px-2.5 py-1 rounded-full">
                  {p.badge}
                </span>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition-colors mb-2">
                {p.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed flex-1">{p.description}</p>

              <div className="mt-5 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
                <span>Impact</span>
                <span className="font-semibold text-rose-400">{p.impact}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Transition CTA banner */}
        <div className="mt-14 p-8 sm:p-10 rounded-2xl bg-gradient-to-r from-indigo-900/80 via-indigo-900/60 to-purple-900/80 border border-indigo-700/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="max-w-2xl text-center md:text-left">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">The Shewwina Shift</div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">Replace Queue Chaos with Digital Precision</h3>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              Transform physical waiting rooms into a seamless virtual queue. Clients wait wherever they want while your staff works stress-free.
            </p>
          </div>
          <a
            href="#how-it-works"
            className="shrink-0 inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-full shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
          >
            See How It Works
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
