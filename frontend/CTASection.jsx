import React from 'react';
import { Link } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────────────
   CTA Section — Phase 3 Redesign
   Final conversion section before Footer
───────────────────────────────────────────────────────────────────── */

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

export default function CTASection() {
  return (
    <section
      id="cta"
      aria-labelledby="cta-heading"
      className="py-24 bg-white relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Container */}
        <div className="relative rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden px-8 py-14 sm:px-14 lg:px-20 lg:py-20 shadow-2xl">

          {/* Subtle grid overlay */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(to right,rgba(226,232,240,0.5) 1px,transparent 1px),linear-gradient(to bottom,rgba(226,232,240,0.5) 1px,transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          {/* Ambient glows */}
          <div aria-hidden="true" className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div aria-hidden="true" className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto text-center">

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/8 backdrop-blur border border-white/15 text-white text-xs sm:text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" aria-hidden="true" />
              Start managing queues digitally today
            </div>

            {/* Headline */}
            <h2
              id="cta-heading"
              className="font-display text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08]"
            >
              Ready to Eliminate{' '}
              <br className="hidden sm:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-indigo-200 to-purple-300">
                the Wait?
              </span>
            </h2>

            {/* Subheading */}
            <p className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-xl mx-auto">
              Give your customers a live digital queue they can track from their phone — and give your staff a clean, simple dashboard to manage it.
            </p>

            {/* CTA buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                to="/register-business"
                id="cta-start-free"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-4 text-base font-bold text-slate-950 bg-white hover:bg-slate-100 rounded-full shadow-2xl hover:shadow-indigo-400/20 hover:-translate-y-px active:scale-[0.98] transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Start Free
                <svg className="w-4 h-4 text-indigo-600 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>

              <Link
                to="/join/demo"
                id="cta-demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-4 text-base font-semibold text-white bg-white/8 hover:bg-white/15 border border-white/15 rounded-full backdrop-blur transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                See a Live Demo
              </Link>
            </div>

            {/* Trust highlights */}
            <ul
              className="mt-10 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-slate-400 font-medium"
              aria-label="Key guarantees"
            >
              <li className="flex items-center gap-1.5"><CheckIcon />14-Day Free Trial</li>
              <li className="flex items-center gap-1.5"><CheckIcon />No Credit Card Required</li>
              <li className="flex items-center gap-1.5"><CheckIcon />Setup in 60 Seconds</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
