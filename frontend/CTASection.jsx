import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Shewwina Call To Action (CTA) Section Component
 * 
 * Aesthetic Influence: Stripe & Linear High-Impact Gradient CTA Banner
 * Features:
 * - Headline: "Ready to Eliminate Waiting?"
 * - Subheading: "Join hundreds of businesses improving customer experience with Shewwina."
 * - Primary Button: "Start Free"
 * - Secondary Button: "Book Demo"
 * - Gradient background container with ambient spotlight glows.
 */
export default function CTASection() {
  return (
    <section id="cta" className="py-24 bg-white relative overflow-hidden text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Gradient Container */}
        <div className="relative rounded-3xl p-8 sm:p-14 lg:p-20 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white shadow-2xl overflow-hidden border border-slate-800">
          
          {/* Ambient Mesh & Glows */}
          <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(226, 232, 240, 0.4) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(226, 232, 240, 0.4) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/25 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            
            {/* Pill Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white text-xs sm:text-sm font-medium mb-8 shadow-sm">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Transform Your Customer Lobby Today
            </div>

            {/* Headline */}
            <h2 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08]">
              Ready to Eliminate <br className="hidden sm:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-200 to-purple-300">
                Waiting?
              </span>
            </h2>

            {/* Subheading */}
            <p className="mt-6 text-lg sm:text-2xl text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
              Join hundreds of businesses improving customer experience with Shewwina.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
              {/* Primary Button: Start Free — Business Sign Up */}
              <Link
                to="/register-business"
                id="cta-start-free"
                className="w-full sm:w-auto px-9 py-4 text-base sm:text-lg font-bold text-slate-950 bg-white hover:bg-slate-100 rounded-full shadow-2xl hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2.5 group"
              >
                <span>Start Free</span>
                <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>

              {/* Secondary Button: Book Demo — Live Demo Queue */}
              <Link
                to="/join/demo"
                id="cta-book-demo"
                className="w-full sm:w-auto px-9 py-4 text-base sm:text-lg font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-full shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2.5 backdrop-blur"
              >
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Book Demo</span>
              </Link>
            </div>

            {/* Trust Highlights */}
            <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                14-Day Free Trial
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                No Credit Card Required
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                Setup in 60 Seconds
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
