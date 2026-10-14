import React from 'react';

/* ─────────────────────────────────────────────────────────────────────
   Timeline / How Shewwina Works — Phase 3 Redesign
   Layout: numbered vertical timeline with alternating cards on desktop
───────────────────────────────────────────────────────────────────── */

const STEPS = [
  {
    n: '01',
    phase: 'SETUP',
    title: 'Register Your Business',
    description: 'Create your Shewwina account in under 60 seconds. Set your business name, operating hours, location, and number of service counters or chairs.',
    color: 'indigo',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
      </svg>
    ),
  },
  {
    n: '02',
    phase: 'CONFIGURATION',
    title: 'Add Services & Pricing',
    description: 'Define your service menu — haircuts, consultations, treatments — with duration times and pricing. Prices are snapshot-captured at queue join for accurate revenue tracking.',
    color: 'purple',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    n: '03',
    phase: 'CUSTOMER JOIN',
    title: 'Customer Scans QR & Joins',
    description: 'Walk-in clients scan your printed QR code or tap your booking link. They receive an instant digital token on their phone — no app download required.',
    color: 'cyan',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
  },
  {
    n: '04',
    phase: 'LIVE TRACKING',
    title: 'Customer Tracks Their Turn',
    description: 'Clients see their live position (#3 in queue, ~12 min wait) from any mobile browser. They can wait in their car or a nearby cafe — not in your crowded lobby.',
    color: 'amber',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    n: '05',
    phase: 'NOTIFICATION',
    title: 'WhatsApp & SMS Alert Fires',
    description: 'When they\'re up next, Shewwina automatically sends a WhatsApp and SMS alert: "Please head to Counter #1 in 3 minutes." No manual action needed.',
    color: 'emerald',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    n: '06',
    phase: 'SERVICE',
    title: 'Staff Calls & Serves Client',
    description: 'Staff tap "Call Next" on the dashboard. The queue auto-advances. The public lobby display updates and the next client is notified in real time.',
    color: 'rose',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
  {
    n: '07',
    phase: 'COMPLETE',
    title: 'Service Done — Revenue Tracked',
    description: 'Token marked SERVED. Today\'s revenue updates on your dashboard instantly using the price snapshot from join time. Business analytics update in real time.',
    color: 'indigo',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const nodeBg = {
  indigo: 'bg-indigo-600 shadow-indigo-500/30',
  purple: 'bg-purple-600 shadow-purple-500/30',
  cyan: 'bg-cyan-600 shadow-cyan-500/30',
  amber: 'bg-amber-500 shadow-amber-500/30',
  emerald: 'bg-emerald-600 shadow-emerald-500/30',
  rose: 'bg-rose-600 shadow-rose-500/30',
};

const cardHover = {
  indigo: 'hover:border-indigo-400/40',
  purple: 'hover:border-purple-400/40',
  cyan: 'hover:border-cyan-400/40',
  amber: 'hover:border-amber-400/40',
  emerald: 'hover:border-emerald-400/40',
  rose: 'hover:border-rose-400/40',
};

const stepColor = {
  indigo: 'text-indigo-600',
  purple: 'text-purple-600',
  cyan: 'text-cyan-600',
  amber: 'text-amber-600',
  emerald: 'text-emerald-600',
  rose: 'text-rose-600',
};

export default function TimelineSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="howitworks-heading"
      className="py-24 bg-slate-50/70 border-t border-slate-200/80 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            7-Step Workflow
          </div>
          <h2 id="howitworks-heading" className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            How Shewwina{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Works
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            From business setup to completed service — an automated customer flow in 7 simple steps.
          </p>
        </div>

        {/* Timeline */}
        <div className="mt-20 relative max-w-5xl mx-auto">
          {/* Vertical connector line */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute left-1/2 top-6 bottom-6 -translate-x-1/2 w-px bg-gradient-to-b from-indigo-400/40 via-purple-400/30 to-emerald-400/40"
          />

          <div className="space-y-10 lg:space-y-12 relative">
            {STEPS.map((step, idx) => {
              const isEven = idx % 2 === 0;
              const nb = nodeBg[step.color] || nodeBg.indigo;
              const ch = cardHover[step.color] || cardHover.indigo;
              const sc = stepColor[step.color] || stepColor.indigo;

              return (
                <div key={step.n} className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10 group">
                  {/* Left col */}
                  <div className={`w-full lg:w-[calc(50%-3rem)] ${isEven ? 'order-2 lg:order-1' : 'hidden lg:block order-1'}`}>
                    {isEven && (
                      <div className={`p-6 rounded-2xl bg-white border border-slate-200/80 ${ch} shadow-[0_1px_3px_0_rgba(15,23,42,0.06)] hover:shadow-[0_10px_25px_-3px_rgba(15,23,42,0.08)] transition-all duration-300 text-right`}>
                        <div className="flex items-center justify-end gap-2 text-xs font-mono font-bold uppercase mb-2">
                          <span className={sc}>STEP {step.n}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-400">{step.phase}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{step.title}</h3>
                        <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{step.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Central node */}
                  <div className={`order-1 lg:order-2 shrink-0 w-12 h-12 rounded-2xl ${nb} text-white flex items-center justify-center shadow-lg z-20 border-4 border-white group-hover:scale-110 transition-transform duration-300`}
                    aria-label={`Step ${step.n}: ${step.title}`}
                  >
                    {step.icon}
                  </div>

                  {/* Right col */}
                  <div className={`w-full lg:w-[calc(50%-3rem)] ${!isEven ? 'order-2 lg:order-3' : 'hidden lg:block order-3'}`}>
                    {!isEven && (
                      <div className={`p-6 rounded-2xl bg-white border border-slate-200/80 ${ch} shadow-[0_1px_3px_0_rgba(15,23,42,0.06)] hover:shadow-[0_10px_25px_-3px_rgba(15,23,42,0.08)] transition-all duration-300`}>
                        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase mb-2">
                          <span className={sc}>STEP {step.n}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-400">{step.phase}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{step.title}</h3>
                        <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{step.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
