import React, { useState, useEffect } from 'react';

/**
 * Shewwina Premium SaaS Navbar Component
 * 
 * Design Philosophy:
 * - Apple: Minimalist precision, frosted glass backdrop-blur, sub-pixel borders, smooth transitions.
 * - Stripe: Rich interactive mega-menu dropdowns, crisp micro-badges, tactile CTA buttons.
 * 
 * Features:
 * - Sticky positioning with scroll-aware glassmorphism elevation
 * - Mega-menu dropdown for "Features" with icon badges & descriptions
 * - Fully responsive mobile drawer with collapsible sub-sections
 * - Clean white theme matching startup aesthetics
 */
export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [isMobileFeaturesOpen, setIsMobileFeaturesOpen] = useState(false);

  // Handle sticky navbar backdrop transition on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-sm shadow-slate-900/5 py-0'
          : 'bg-white border-b border-transparent py-1'
      }`}
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          
          {/* LOGO (LEFT) */}
          <div className="flex items-center gap-3">
            <a
              href="#home"
              className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1 transition-transform active:scale-95"
            >
              {/* Custom Flow Node Logo Mark */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-md shadow-blue-500/20 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/40 to-transparent opacity-80" />
                  <svg
                    className="w-5 h-5 text-white relative z-10 transform group-hover:rotate-12 transition-transform duration-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
              </div>

              {/* Logotype */}
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  Shewwina<span className="text-blue-600">.</span>
                </span>
                <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase -mt-1 hidden sm:block">
                  Customer Flow OS
                </span>
              </div>
            </a>
          </div>

          {/* NAVIGATION LINKS (CENTER - DESKTOP) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <a
              href="#home"
              className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100/80 transition-all duration-200"
            >
              Home
            </a>

            {/* Features (With Stripe-Style Mega Menu) */}
            <div
              className="relative group"
              onMouseEnter={() => setIsFeaturesOpen(true)}
              onMouseLeave={() => setIsFeaturesOpen(false)}
            >
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100/80 transition-all duration-200 focus:outline-none"
                aria-expanded={isFeaturesOpen}
              >
                <span>Features</span>
                <svg
                  className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${
                    isFeaturesOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 mt-2 w-[540px] transition-all duration-200 ease-out z-50 ${
                  isFeaturesOpen
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 translate-y-2 pointer-events-none'
                }`}
              >
                <div className="p-4 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-900/10">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Item 1 */}
                    <a
                      href="#features"
                      className="flex gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors group/item"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover/item:bg-blue-600 group-hover/item:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 group-hover/item:text-blue-600 flex items-center gap-1.5">
                          Smart Queues
                          <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">AI</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          Virtual waitlists & real-time ETA updates for clients.
                        </p>
                      </div>
                    </a>

                    {/* Item 2 */}
                    <a
                      href="#features"
                      className="flex gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors group/item"
                    >
                      <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover/item:bg-purple-600 group-hover/item:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 group-hover/item:text-purple-600">
                          Appointments
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          Automated booking & multi-staff scheduling engine.
                        </p>
                      </div>
                    </a>

                    {/* Item 3 */}
                    <a
                      href="#features"
                      className="flex gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors group/item"
                    >
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover/item:bg-emerald-600 group-hover/item:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 group-hover/item:text-emerald-600">
                          Flow Analytics
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          Predictive customer throughput insights & heatmaps.
                        </p>
                      </div>
                    </a>

                    {/* Item 4 */}
                    <a
                      href="#features"
                      className="flex gap-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors group/item"
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover/item:bg-amber-600 group-hover/item:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 group-hover/item:text-amber-600">
                          WhatsApp SMS
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          Instant notifications & automated status alerts.
                        </p>
                      </div>
                    </a>
                  </div>

                  {/* Mega Menu Footer Banner */}
                  <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/60 -mx-4 -mb-4 p-3.5 px-6 rounded-b-2xl flex items-center justify-between text-xs">
                    <span className="text-slate-500">Need custom enterprise flow control?</span>
                    <a href="#contact" className="font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                      Explore Enterprise &rarr;
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <a
              href="#how-it-works"
              className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100/80 transition-all duration-200"
            >
              How it Works
            </a>

            <a
              href="#pricing"
              className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100/80 transition-all duration-200"
            >
              Pricing
            </a>

            <a
              href="#faq"
              className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100/80 transition-all duration-200"
            >
              FAQ
            </a>

            <a
              href="#contact"
              className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-full hover:bg-slate-100/80 transition-all duration-200"
            >
              Contact
            </a>
          </nav>

          {/* CTA BUTTONS (RIGHT - DESKTOP) */}
          <div className="hidden md:flex items-center space-x-3">
            <a
              href="#login"
              className="text-sm font-medium text-slate-700 hover:text-slate-950 px-4 py-2 rounded-full hover:bg-slate-100/80 transition-all duration-200 focus:outline-none"
            >
              Login
            </a>

            <a
              href="#get-started"
              className="relative inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-slate-950 hover:bg-slate-800 rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 group overflow-hidden focus:outline-none"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center gap-1.5">
                Get Started
                <svg
                  className="w-4 h-4 text-slate-300 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </a>
          </div>

          {/* MOBILE HAMBURGER BUTTON */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition-colors"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Toggle navigation menu</span>
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* MOBILE MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-2xl animate-in slide-in-from-top-3 duration-200">
          <div className="px-4 pt-3 pb-6 space-y-1.5 max-w-lg mx-auto">
            <a
              href="#home"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Home
            </a>

            <div>
              <button
                type="button"
                onClick={() => setIsMobileFeaturesOpen(!isMobileFeaturesOpen)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <span>Features</span>
                <svg
                  className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                    isMobileFeaturesOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isMobileFeaturesOpen && (
                <div className="pl-4 pr-2 py-1 space-y-1">
                  <a
                    href="#features"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-600 hover:text-blue-600"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Smart Queues & Virtual Waitlist
                  </a>
                  <a
                    href="#features"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-600 hover:text-blue-600"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Appointment Scheduling
                  </a>
                  <a
                    href="#features"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-600 hover:text-blue-600"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Real-time Flow Analytics
                  </a>
                </div>
              )}
            </div>

            <a
              href="#how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
            >
              How it Works
            </a>

            <a
              href="#pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Pricing
            </a>

            <a
              href="#faq"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
            >
              FAQ
            </a>

            <a
              href="#contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Contact
            </a>

            {/* Mobile Actions */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col gap-2.5">
              <a
                href="#login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center px-4 py-3 text-base font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Login
              </a>
              <a
                href="#get-started"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center px-4 py-3.5 text-base font-semibold text-white bg-slate-950 hover:bg-slate-900 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                Get Started
                <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
