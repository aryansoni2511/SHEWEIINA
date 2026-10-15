import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LogoMark from './components/LogoMark';

function ArrowRight({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, isBusiness, logout } = useAuth();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Sticky scroll effect */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Close mobile menu on resize */
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isHomePage = location.pathname === '/';

  const closeMenu = () => setMobileOpen(false);

  const getHref = (hash) => (isHomePage ? hash : `/${hash}`);

  return (
    <header
      role="banner"
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-[0_1px_4px_0_rgba(22,101,52,0.06)]'
          : 'bg-white border-b border-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[68px]">

          {/* ── Logo ─────────────────────────────────────── */}
          <Link
            to="/"
            onClick={closeMenu}
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl p-1 -m-1 transition-transform active:scale-95"
            aria-label="Shewwina — Home"
          >
            <LogoMark className="w-9 h-9" iconSize="w-5 h-5" />
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-[1.25rem] tracking-tight text-slate-900 group-hover:text-emerald-800 transition-colors">
                Shewwina<span className="text-emerald-600">.</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-emerald-700 uppercase hidden sm:block mt-0.5">
                Smart Waiting Platform
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav ───────────────────────────────── */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
            <a
              href={getHref('#home')}
              className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-emerald-800 rounded-full hover:bg-emerald-50/60 transition-colors"
            >
              Home
            </a>
            <a
              href={getHref('#explore-services')}
              className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-emerald-800 rounded-full hover:bg-emerald-50/60 transition-colors"
            >
              Explore Services
            </a>
            <a
              href={getHref('#how-it-works')}
              className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-emerald-800 rounded-full hover:bg-emerald-50/60 transition-colors"
            >
              How It Works
            </a>
            <a
              href={getHref('#about')}
              className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-emerald-800 rounded-full hover:bg-emerald-50/60 transition-colors"
            >
              About
            </a>

            {/* Try Demo / Playground Highlight Link */}
            <Link
              to="/demo"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 border border-emerald-300/80 rounded-full transition-all ml-1 shadow-sm"
              title="Test interactive queue simulation"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Try Demo</span>
            </Link>
          </nav>

          {/* ── Desktop CTAs ──────────────────────────────── */}
          <div className="hidden md:flex items-center gap-2.5">
            {isAuthenticated ? (
              <>
                <Link
                  to={isBusiness ? '/dashboard' : '/customer/dashboard'}
                  className="text-sm font-semibold text-emerald-800 hover:text-emerald-900 px-4 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200"
                >
                  My Dashboard
                </Link>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                  👋 {user?.name || 'Account'}
                </span>
                <button
                  onClick={logout}
                  className="text-sm font-medium text-slate-500 hover:text-rose-600 px-3 py-2 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-emerald-800 px-4 py-2 rounded-full hover:bg-emerald-50/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  Login
                </Link>
                <Link
                  to="/register-business"
                  id="nav-register-business"
                  className="relative inline-flex items-center gap-1.5 px-4.5 py-2.5 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-full shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <span>Sign Up</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-200" />
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile hamburger ──────────────────────────── */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/demo"
              className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300"
            >
              Demo
            </Link>
            <button
              type="button"
              id="nav-mobile-menu-btn"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="p-2 rounded-xl text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
          className="md:hidden border-b border-emerald-100 bg-white/98 backdrop-blur-xl animate-fade-in"
        >
          <div className="px-4 pt-3 pb-6 space-y-1">
            <a
              href={getHref('#home')}
              onClick={closeMenu}
              className="block px-4 py-2.5 rounded-xl text-base font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
            >
              Home
            </a>
            <a
              href={getHref('#explore-services')}
              onClick={closeMenu}
              className="block px-4 py-2.5 rounded-xl text-base font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
            >
              Explore Services
            </a>
            <a
              href={getHref('#how-it-works')}
              onClick={closeMenu}
              className="block px-4 py-2.5 rounded-xl text-base font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
            >
              How It Works
            </a>
            <a
              href={getHref('#about')}
              onClick={closeMenu}
              className="block px-4 py-2.5 rounded-xl text-base font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
            >
              About
            </a>
            <Link
              to="/demo"
              onClick={closeMenu}
              className="block px-4 py-2.5 rounded-xl text-base font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 transition-colors"
            >
              ⚡ Try Queue Demo / Simulation
            </Link>

            {/* Mobile Auth Actions */}
            <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col gap-2.5">
              {isAuthenticated ? (
                <>
                  <Link
                    to={isBusiness ? '/dashboard' : '/customer/dashboard'}
                    onClick={closeMenu}
                    className="w-full text-center px-4 py-3 text-base font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-200"
                  >
                    My Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      closeMenu();
                    }}
                    className="w-full text-center px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="w-full text-center px-4 py-3 text-base font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register-business"
                    onClick={closeMenu}
                    className="w-full text-center px-4 py-3 text-base font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Sign Up / Register Business</span>
                    <ArrowRight className="w-4 h-4 text-emerald-200" />
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
