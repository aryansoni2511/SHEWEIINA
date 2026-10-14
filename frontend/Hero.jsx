import React from 'react';
import { Link } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────────────
   Hero Section — Shewwina Phase 3 Redesign
   Layout: centred headline + live queue mockup illustration
   Tone: professional Indian SaaS, trust & speed
───────────────────────────────────────────────────────────────────── */

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

/* Mini live-queue mockup card for the illustration */
function QueueCard({ position, name, wait, status }) {
  const statusStyles = {
    serving: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    next:    'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
    waiting: 'bg-slate-800 border-slate-700 text-slate-400',
  };
  const labels = { serving: 'NOW SERVING', next: 'UP NEXT', waiting: `#${position} QUEUE` };

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border text-xs ${statusStyles[status]}`}>
      <div className="flex items-center gap-2.5">
        <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${statusStyles[status]}`}>
          {labels[status]}
        </span>
        <span className="font-semibold text-white">{name}</span>
      </div>
      <span className="font-mono text-[11px] opacity-80">{wait}</span>
    </div>
  );
}

export default function Hero() {
  return (
    <section
      id="home"
      aria-label="Shewwina — India's Smart Waiting Platform"
      className="relative overflow-hidden bg-white pt-12 pb-20 lg:pt-20 lg:pb-28"
    >
      {/* Subtle grid pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-grid-pattern opacity-[0.45]"
      />
      {/* Indigo ambient glow */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(circle 560px at 50% 80px, rgba(79,70,229,0.07), transparent 70%)' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Headline block ───────────────────────────── */}
        <div className="max-w-3xl mx-auto text-center">

          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/5 border border-slate-900/10 text-slate-700 text-xs sm:text-sm font-medium mb-8 cursor-default select-none">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse shrink-0" aria-hidden="true" />
            <span className="font-semibold text-slate-900">Shewwina 2.0</span>
            <span className="text-slate-300" aria-hidden="true">•</span>
            <span className="text-slate-600 hidden sm:inline">India's Smart Waiting Platform for Salons & Clinics</span>
            <span className="text-slate-600 sm:hidden">Smart Waiting Platform</span>
          </div>

          {/* H1 */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.06]">
            No More Waiting{' '}
            <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600">
              in the Dark.
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-7 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Shewwina gives salons, clinics, and service businesses a live digital queue
            — customers join via QR code, track their position on their phone, and get WhatsApp alerts when it's their turn.
          </p>

          {/* CTA row */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/register-business"
              id="hero-get-started"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-slate-900 hover:bg-indigo-700 rounded-full shadow-lg shadow-slate-900/20 hover:shadow-indigo-700/30 hover:-translate-y-px active:translate-y-0 active:scale-[0.98] transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Start Free — Register Business
              <svg className="w-4 h-4 text-slate-300 group-hover:text-white group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>

            <Link
              to="/join/demo"
              id="hero-see-demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-slate-700 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 rounded-full shadow-sm hover:shadow transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              See a Live Demo Queue
            </Link>
          </div>

          {/* Trust micro-proofs */}
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500 font-medium" aria-label="Key benefits">
            <li className="flex items-center gap-1.5"><CheckIcon />No hardware needed</li>
            <li className="flex items-center gap-1.5"><CheckIcon />Setup in 60 seconds</li>
            <li className="flex items-center gap-1.5 hidden sm:flex"><CheckIcon />WhatsApp & SMS included</li>
          </ul>
        </div>

        {/* ── Illustration ─────────────────────────────── */}
        <div className="mt-16 sm:mt-20 max-w-5xl mx-auto">
          {/* Outer frame */}
          <div className="rounded-3xl bg-gradient-to-b from-slate-200/70 via-slate-100/30 to-slate-200/50 border border-slate-200/80 shadow-2xl shadow-slate-900/10 p-3 sm:p-5">
            {/* Dark glass shell */}
            <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
              {/* Browser chrome header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/60">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" aria-hidden="true" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" aria-hidden="true" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" aria-hidden="true" />
                  <span className="hidden sm:flex ml-3 items-center gap-1.5 text-xs font-mono text-slate-500">
                    <svg className="w-3 h-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    app.shewwina.com — Live Queue
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" aria-hidden="true" />
                  Live
                </span>
              </div>

              {/* 3-column product showcase */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-800/60">

                {/* Panel 1 — Customer token */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Customer App</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Shewwina Pass</span>
                      <span className="font-mono text-emerald-400">#Q-042</span>
                    </div>
                    <div className="p-3 bg-indigo-950/60 rounded-lg border border-indigo-800/40">
                      <div className="text-xs text-indigo-300 font-medium">Luxe Salon & Spa</div>
                      <div className="text-2xl font-black text-white mt-1 font-mono">#2 in Queue</div>
                      <div className="flex items-center gap-1 text-xs text-slate-300 mt-1.5">
                        <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Est. wait: <span className="font-bold text-white">8 min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300 bg-emerald-950/40 border border-emerald-800/40 rounded-lg px-3 py-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />
                      WhatsApp alert sent
                    </div>
                  </div>
                </div>

                {/* Panel 2 — Queue engine */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Live Queue</span>
                  </div>
                  <div className="space-y-2">
                    <QueueCard position={1} name="Rahul S." wait="Chair #1" status="serving" />
                    <QueueCard position={2} name="Priya K." wait="~4 min" status="next" />
                    <QueueCard position={3} name="Amit M." wait="~12 min" status="waiting" />
                  </div>
                  <div className="pt-1 text-[11px] text-slate-500 font-mono text-center">
                    Auto-advances on staff action
                  </div>
                </div>

                {/* Panel 3 — Business dashboard */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Business Dashboard</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Total Tokens', value: '47', color: 'text-white' },
                      { label: 'Avg Wait', value: '4.2m', color: 'text-emerald-400' },
                      { label: 'Serving Now', value: '3', color: 'text-indigo-300' },
                      { label: 'Waiting', value: '8', color: 'text-amber-400' },
                    ].map((s) => (
                      <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">{s.label}</div>
                        <div className={`text-xl font-black font-mono mt-0.5 ${s.color}`}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Mini throughput bars */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                      <span>Today's Customer Flow</span>
                      <span className="text-emerald-400 font-semibold">Live</span>
                    </div>
                    <div className="flex items-end gap-1 h-8">
                      {[35, 55, 70, 90, 100, 80, 65].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t"
                          style={{
                            height: `${h}%`,
                            background: i < 5
                              ? `rgba(99,102,241,${0.3 + i * 0.12})`
                              : 'rgba(99,102,241,0.5)',
                          }}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
