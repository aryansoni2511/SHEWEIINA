import React from 'react';

/* ─────────────────────────────────────────────────────────────────────
   How It Works Section — Shewwina Friendly 3-Step Flow
   Clean layout with small icons and concise, beginner-friendly copy:
   1. Choose a Service — Find a participating business.
   2. Get Your Token — Join the queue through the available flow.
   3. Track Your Turn — Check your queue position and estimated waiting time.
───────────────────────────────────────────────────────────────────── */

const STEPS = [
  {
    step: '1',
    title: 'Choose a Service',
    description: 'Find a participating business and select the service or consultation you need.',
    icon: (
      <svg className="w-6 h-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    step: '2',
    title: 'Get Your Token',
    description: 'Join the queue online or by scanning a QR code at the counter to receive an instant digital token pass.',
    icon: (
      <svg className="w-6 h-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  {
    step: '3',
    title: 'Track Your Turn',
    description: 'Check your live queue position and estimated waiting time right from your browser, arriving when called.',
    icon: (
      <svg className="w-6 h-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="py-16 sm:py-20 bg-white border-y border-slate-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs font-bold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Simple 3-Step Flow
          </span>
          <h2
            id="how-it-works-title"
            className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-[#172033] tracking-tight"
          >
            How Shewwina Works
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#64748B] leading-relaxed">
            Eliminate standing in crowded waiting rooms with a transparent, easy-to-understand process.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((item, index) => (
            <div
              key={item.step}
              className="relative p-6 sm:p-7 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 hover:border-emerald-300 transition-all hover:shadow-md flex flex-col group"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-emerald-100/70 border border-emerald-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <span className="font-mono text-2xl font-black text-emerald-800/30 group-hover:text-emerald-700 transition-colors">
                  0{item.step}
                </span>
              </div>

              <h3 className="text-lg font-bold text-[#172033] mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                {item.description}
              </p>

              {index < STEPS.length - 1 && (
                <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10 text-emerald-300 font-bold text-lg pointer-events-none">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
