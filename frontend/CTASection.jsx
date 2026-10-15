import React from 'react';
import { Link } from 'react-router-dom';

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-300 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function CTASection() {
  return (
    <section
      id="cta"
      aria-labelledby="cta-heading"
      className="py-16 sm:py-20 bg-[#F8FAFC] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-emerald-900 border border-emerald-800 overflow-hidden px-8 py-12 sm:px-14 lg:px-20 lg:py-16 shadow-xl text-center">
          {/* Subtle glow */}
          <div
            aria-hidden="true"
            className="absolute -top-32 -left-32 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-32 -right-32 w-80 h-80 bg-green-400/20 rounded-full blur-3xl pointer-events-none"
          />

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-700 text-emerald-200 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Start testing digital queues today
            </div>

            <h2
              id="cta-heading"
              className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight"
            >
              Ready to Upgrade the Waiting Experience?
            </h2>

            <p className="mt-4 text-base sm:text-lg text-emerald-100/90 leading-relaxed max-w-xl mx-auto">
              Give customers an easy digital token they can check from their smartphone, and give your staff an organized dashboard to call turns without chaos.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                to="/demo"
                id="cta-try-demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-bold text-emerald-950 bg-white hover:bg-emerald-50 rounded-full shadow-md hover:-translate-y-0.5 transition-all"
              >
                <span>⚡ Launch Queue Simulation</span>
                <span className="text-emerald-700">→</span>
              </Link>

              <Link
                to="/register-business"
                id="cta-register-business"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-emerald-800/90 hover:bg-emerald-800 border border-emerald-600 rounded-full transition-all"
              >
                <span>Register a Business</span>
              </Link>
            </div>

            <ul
              className="mt-8 pt-6 border-t border-emerald-800/80 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-emerald-200"
              aria-label="Features"
            >
              <li className="flex items-center gap-1.5"><CheckIcon />No Hardware Required</li>
              <li className="flex items-center gap-1.5"><CheckIcon />Instant QR Check-In</li>
              <li className="flex items-center gap-1.5"><CheckIcon />Accessible From Any Browser</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
