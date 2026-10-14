import React from 'react';
import { Link } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────────────
   Solution Section — Phase 3 Redesign
   Layout: 2-col bento grid of 4 real Shewwina capabilities
───────────────────────────────────────────────────────────────────── */

const SOLUTIONS = [
  {
    id: '01',
    tagline: 'DIGITAL QUEUE',
    title: 'Virtual QR Queue Joining',
    description:
      'Customers scan a QR code or tap a link to join your live digital waitlist. They see their position and estimated wait time instantly — no app download required.',
    color: 'indigo',
    illustration: (
      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-white space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" aria-hidden="true" />
            Live Token
          </span>
          <span className="font-mono text-slate-300">#Q-048</span>
        </div>
        <div className="flex items-center justify-between bg-slate-900 p-3.5 rounded-xl border border-slate-800">
          <div>
            <div className="text-xs text-slate-400">Position in Line</div>
            <div className="text-2xl font-black text-white font-mono mt-0.5">#2 Next</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Estimated Wait</div>
            <div className="text-lg font-bold text-indigo-400 font-mono mt-0.5">6 min</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: '02',
    tagline: 'REAL-TIME ALERTS',
    title: 'Automated WhatsApp & SMS Alerts',
    description:
      'Customers receive timely WhatsApp and SMS turn alerts as their position advances — so they can wait comfortably nearby instead of crowding your lobby.',
    color: 'emerald',
    illustration: (
      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-white">
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd" />
              </svg>
              WhatsApp Alert
            </span>
            <span className="text-[10px] text-slate-500 font-mono">11:28 AM</span>
          </div>
          <p className="text-sm text-slate-200 leading-snug">
            "Hi Priya! You're up next at Luxe Salon. Please head to Chair #1 in 3 mins."
          </p>
        </div>
      </div>
    ),
  },
  {
    id: '03',
    tagline: 'PUBLIC DISPLAY',
    title: 'Lobby TV Display & Public View',
    description:
      'Cast Shewwina to any TV or large tablet in your lobby. Customers see the live token display with automatic call announcements — no extra hardware.',
    color: 'amber',
    illustration: (
      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-white">
        <div className="flex items-center gap-2 mb-3 text-xs text-slate-400">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
          </svg>
          Lobby Display — Live
        </div>
        <div className="text-center py-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-mono">Now Serving</div>
          <div className="text-5xl font-black text-emerald-400 font-mono leading-none">#Q-041</div>
          <div className="text-xs text-slate-400 mt-2">Please proceed to Counter 1</div>
        </div>
      </div>
    ),
  },
  {
    id: '04',
    tagline: 'BUSINESS DASHBOARD',
    title: 'Real-Time Business Analytics',
    description:
      'Track live queue state, tokens served, average wait time, and estimated revenue for today — all in a single real-time control panel.',
    color: 'purple',
    illustration: (
      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-white space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Served Today', value: 'Live Count', color: 'text-white' },
            { label: 'Avg Wait', value: 'Real-time', color: 'text-emerald-400' },
          ].map((s) => (
            <div key={s.label} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">{s.label}</div>
              <div className={`text-sm font-bold mt-0.5 ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
        <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
          <div className="text-[10px] text-slate-500 mb-2">Queue Velocity</div>
          <div className="flex items-end gap-1 h-8">
            {[40, 60, 80, 100, 85, 95].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{ height: `${h}%`, background: `rgba(139,92,246,${0.3 + i * 0.1})` }}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

const accentColors = {
  indigo: { badge: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: 'bg-indigo-50 border-indigo-100 text-indigo-600', bar: 'bg-indigo-600', hover: 'hover:border-indigo-400/40' },
  emerald: { badge: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: 'bg-emerald-50 border-emerald-100 text-emerald-600', bar: 'bg-emerald-600', hover: 'hover:border-emerald-400/40' },
  amber: { badge: 'text-amber-600 bg-amber-50 border-amber-100', icon: 'bg-amber-50 border-amber-100 text-amber-600', bar: 'bg-amber-500', hover: 'hover:border-amber-400/40' },
  purple: { badge: 'text-purple-600 bg-purple-50 border-purple-100', icon: 'bg-purple-50 border-purple-100 text-purple-600', bar: 'bg-purple-600', hover: 'hover:border-purple-400/40' },
};

export default function SolutionSection() {
  return (
    <section
      id="solutions"
      aria-labelledby="solutions-heading"
      className="py-24 bg-slate-50/60 border-t border-slate-200/80 relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            The Shewwina Solution
          </div>

          <h2 id="solutions-heading" className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            How Shewwina{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Solves It
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Four real capabilities that turn a chaotic waiting room into a seamless digital queue experience.
          </p>
        </div>

        {/* 2×2 bento grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {SOLUTIONS.map((s) => {
            const c = accentColors[s.color];
            return (
              <div
                key={s.id}
                className={`bg-white rounded-2xl p-7 border border-slate-200/80 shadow-[0_1px_3px_0_rgba(15,23,42,0.06),0_1px_2px_-1px_rgba(15,23,42,0.06)] ${c.hover} hover:shadow-[0_10px_25px_-3px_rgba(15,23,42,0.08),0_4px_6px_-4px_rgba(15,23,42,0.04)] hover:-translate-y-1 transition-all duration-300 flex flex-col gap-6 group overflow-hidden`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${c.badge}`}>
                      {s.id} · {s.tagline}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{s.title}</h3>
                  <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">{s.description}</p>
                </div>
                <div>{s.illustration}</div>
              </div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <Link
            to="/register-business"
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:-translate-y-px transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Try Shewwina Free
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
