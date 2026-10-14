import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LogoMark from './components/LogoMark';

/* ─── Icon helpers ─────────────────────────────────────────────────── */
function ChevronDown({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
function ArrowRight({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

/* ─── Feature items for mega-menu ─────────────────────────────────── */
const FEATURES = [
  {
    href: '#features',
    label: 'QR Queue Joining',
    desc: 'Customers scan & join a live digital queue instantly.',
    color: 'indigo',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
  },
  {
    href: '#features',
    label: 'Digital Tokens',
    desc: 'Paperless token pass sent straight to smartphones.',
    color: 'emerald',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    href: '#features',
    label: 'Live Queue Status',
    desc: 'Real-time position & ETA tracking without an app.',
    color: 'amber',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: '#features',
    label: 'WhatsApp & SMS Alerts',
    desc: 'Automated turn alerts so clients never miss their call.',
    color: 'rose',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
];

const colorMap = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', hover: 'group-hover/item:bg-indigo-600 group-hover/item:text-white' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', hover: 'group-hover/item:bg-emerald-600 group-hover/item:text-white' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', hover: 'group-hover/item:bg-amber-600 group-hover/item:text-white' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', hover: 'group-hover/item:bg-rose-600 group-hover/item:text-white' },
};

/* ─── Nav link ─────────────────────────────────────────────────────── */
function NavLink({ href, children, onClick }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-all duration-150"
    >
      {children}
    </a>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, isBusiness, logout } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [mobileFeaturesOpen, setMobileFeaturesOpen] = useState(false);
  const megaRef = useRef(null);

  /* Sticky scroll effect */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Close mobile menu on resize */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* Close mega menu on outside click */
  useEffect(() => {
    const onPointerDown = (e) => {
      if (megaRef.current && !megaRef.current.contains(e.target)) setFeaturesOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const closeAll = () => { setMobileOpen(false); setFeaturesOpen(false); };

  return (
    <header
      role="banner"
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-white/92 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_3px_0_rgba(15,23,42,0.05)]'
          : 'bg-white border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[68px]">

          {/* ── Logo ─────────────────────────────────────── */}
          <a
            href="#home"
            onClick={closeAll}
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl p-1 -m-1 transition-transform active:scale-95"
            aria-label="Shewwina — go to top"
          >
            <LogoMark className="w-9 h-9" iconSize="w-5 h-5" />
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-[1.2rem] tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                Shewwina<span className="text-indigo-600">.</span>
              </span>
              <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase hidden sm:block mt-0.5">
                Smart Waiting Platform
              </span>
            </div>
          </a>

          {/* ── Desktop Nav ───────────────────────────────── */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-0.5">
            <NavLink href="#home">Home</NavLink>

            {/* Features dropdown */}
            <div
              ref={megaRef}
              className="relative"
              onMouseEnter={() => setFeaturesOpen(true)}
              onMouseLeave={() => setFeaturesOpen(false)}
            >
              <button
                type="button"
                id="nav-features-btn"
                aria-expanded={featuresOpen}
                aria-haspopup="true"
                onClick={() => setFeaturesOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Features
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${featuresOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Mega Menu */}
              <div
                aria-label="Features menu"
                className={`absolute left-0 md:left-1/2 md:-translate-x-1/2 top-full mt-2 w-[min(520px,calc(100vw-2rem))] transition-all duration-200 ease-out z-50 ${
                  featuresOpen
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 translate-y-2 pointer-events-none'
                }`}
              >
                <div className="p-3 bg-white/98 backdrop-blur-2xl rounded-2xl border border-slate-200/80 shadow-[0_20px_25px_-5px_rgba(15,23,42,0.12),0_8px_10px_-6px_rgba(15,23,42,0.06)]">
                  <div className="grid grid-cols-2 gap-1.5">
                    {FEATURES.map((f) => {
                      const c = colorMap[f.color];
                      return (
                        <a
                          key={f.label}
                          href={f.href}
                          onClick={closeAll}
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group/item"
                        >
                          <div className={`w-9 h-9 rounded-lg ${c.bg} ${c.text} ${c.hover} flex items-center justify-center shrink-0 transition-colors duration-150`}>
                            {f.icon}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800">{f.label}</div>
                            <p className="text-xs text-slate-500 mt-0.5 leading-snug">{f.desc}</p>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between px-1 text-xs">
                    <span className="text-slate-500">Need a custom enterprise setup?</span>
                    <a href="#contact" onClick={closeAll} className="font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                      Contact us <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <NavLink href="#how-it-works">How it Works</NavLink>
            <NavLink href="#industries">Industries</NavLink>
            <NavLink href="#faq">FAQ</NavLink>
          </nav>

          {/* ── Desktop CTAs ──────────────────────────────── */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={isBusiness ? '/dashboard' : '/customer/dashboard'}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 px-4 py-2 rounded-full hover:bg-indigo-50 transition-all"
                >
                  My Dashboard
                </Link>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                  👤 {user?.name}
                </span>
                <button
                  onClick={logout}
                  className="text-sm font-medium text-slate-600 hover:text-rose-600 px-3 py-2 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-full hover:bg-slate-100 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Login
                </Link>
                <Link
                  to="/register-business"
                  id="nav-register-business"
                  className="relative inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-indigo-700 rounded-full shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 overflow-hidden group"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/8 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative">Register Business</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200 relative" />
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile hamburger ──────────────────────────── */}
          <div className="flex md:hidden">
            <button
              type="button"
              id="nav-mobile-menu-btn"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="p-2.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Drawer ────────────────────────────────── */}
      {mobileOpen && (
        <div
          role="navigation"
          aria-label="Mobile navigation"
          className="md:hidden border-b border-slate-200 bg-white/98 backdrop-blur-2xl"
        >
          <div className="px-4 pt-3 pb-6 space-y-1">
            <a href="#home" onClick={closeAll} className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-100 transition-colors">
              Home
            </a>

            {/* Mobile Features Accordion */}
            <div>
              <button
                type="button"
                onClick={() => setMobileFeaturesOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
                aria-expanded={mobileFeaturesOpen}
              >
                <span>Features</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${mobileFeaturesOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileFeaturesOpen && (
                <div className="pl-4 pr-2 py-1.5 space-y-0.5">
                  {FEATURES.map((f) => (
                    <a
                      key={f.label}
                      href={f.href}
                      onClick={closeAll}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      {f.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <a href="#how-it-works" onClick={closeAll} className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-100 transition-colors">
              How it Works
            </a>
            <a href="#industries" onClick={closeAll} className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-100 transition-colors">
              Industries
            </a>
            <a href="#faq" onClick={closeAll} className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-100 transition-colors">
              FAQ
            </a>

            {/* Mobile Auth Actions */}
            <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col gap-2.5">
              {isAuthenticated ? (
                <>
                  <Link
                    to={isBusiness ? '/dashboard' : '/customer/dashboard'}
                    onClick={closeAll}
                    className="w-full text-center px-4 py-3 text-base font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                  >
                    My Dashboard
                  </Link>
                  <button
                    onClick={() => { logout(); closeAll(); }}
                    className="w-full text-center px-4 py-3 text-base font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeAll}
                    className="w-full text-center px-4 py-3 text-base font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register-business"
                    onClick={closeAll}
                    className="w-full text-center px-4 py-3.5 text-base font-semibold text-white bg-slate-900 hover:bg-indigo-700 rounded-xl shadow transition-colors flex items-center justify-center gap-2"
                  >
                    Register Business
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
