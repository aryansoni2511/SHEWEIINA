import React from 'react';

/* ─────────────────────────────────────────────────────────────────────
   Friendly Trust Section — Real Benefits of Queue Management
   Strictly highlights real operational benefits without invented metrics:
   1. Better visibility into waiting times.
   2. Easier queue tracking.
   3. More organized service management.
───────────────────────────────────────────────────────────────────── */

const BENEFITS = [
  {
    title: 'Better Visibility Into Waiting Times',
    description:
      'Eliminate the uncertainty of waiting rooms. Customers see their live position in line and an estimated wait time calculated from service duration.',
    icon: (
      <svg className="w-6 h-6 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  {
    title: 'Easier Queue Tracking',
    description:
      'Digital waiting passes update in real-time on any smartphone browser. Customers can wait nearby or outdoors rather than crowding the reception area.',
    icon: (
      <svg className="w-6 h-6 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="2" />
        <path d="M12 18h.01" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'More Organized Service Management',
    description:
      'Counters and service providers get a straightforward dashboard to call the next customer, mark services complete, and maintain orderly service order.',
    icon: (
      <svg className="w-6 h-6 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
];

export default function FriendlyTrustSection() {
  return (
    <section
      id="about"
      aria-labelledby="trust-section-title"
      className="py-16 sm:py-20 bg-white border-t border-slate-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-xs font-bold tracking-wider uppercase text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
            Why Queue Management Matters
          </span>
          <h2
            id="trust-section-title"
            className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-[#172033] tracking-tight"
          >
            Built to Replace Physical Waiting Lines
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#64748B] leading-relaxed">
            Shewwina focuses on solving waiting congestion with practical software design.
            Here is how digital queueing transforms the waiting experience.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit.title}
              className="p-6 sm:p-7 rounded-3xl bg-[#F8FAFC] border border-slate-200 hover:border-emerald-300 transition-all hover:shadow-md flex flex-col"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] border border-emerald-200 flex items-center justify-center mb-5">
                {benefit.icon}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#172033] mb-2.5">
                {benefit.title}
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* College Project Context Banner */}
        <div className="mt-10 p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-base">🎓</span>
            <div>
              <strong className="font-bold">Academic Project Verification:</strong> Developed for CSE mini-project presentation to demonstrate full-stack queue orchestration with React, Express, and PostgreSQL.
            </div>
          </div>
          <a
            href="#how-it-works"
            className="font-bold text-emerald-800 hover:underline shrink-0"
          >
            Review Architecture ↑
          </a>
        </div>
      </div>
    </section>
  );
}
