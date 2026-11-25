import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LogoMark from './components/LogoMark';
import { resolveDashboardRoute, getUserDisplayRole } from './utils/navigation';
import {
  Menu,
  X,
  Compass,
  Building2,
  Stethoscope,
  Scissors,
  Landmark,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  ArrowRight,
  User,
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isHomePage = location.pathname === '/';
  const closeMenu = () => setMobileOpen(false);
  const getHref = (hash) => (isHomePage ? hash : `/${hash}`);

  const dashboardRoute = resolveDashboardRoute(user);
  const displayRole = getUserDisplayRole(user);

  return (
    <header
      role="banner"
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E7E3DC] shadow-subtle'
          : 'bg-[#FAF8F5] border-b border-[#E7E3DC]/80'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[72px]">

          {/* ── Brand Lockup (Left) ─────────────────────────────────── */}
          <Link
            to="/"
            onClick={closeMenu}
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] rounded-xl p-1 -m-1 transition-transform active:scale-95"
            aria-label="Shewwina — Home"
          >
            <LogoMark className="w-9 h-9" iconSize="w-5 h-5" />
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-[1.3rem] tracking-tight text-[#171717] group-hover:text-[#000000] transition-colors">
                Shewwina<span className="text-[#C25E38]">.</span>
              </span>
              <span className="text-[10px] font-medium tracking-wider text-[#6B665E] uppercase mt-0.5">
                Customer Flow &amp; Smart Queue
              </span>
            </div>
          </Link>

          {/* ── Desktop Editorial Navigation (Center) ────────────────── */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                location.pathname === '/'
                  ? 'text-[#171717] bg-[#EAE6DF]'
                  : 'text-[#57534E] hover:text-[#171717] hover:bg-[#F5F2EB]'
              }`}
            >
              Home
            </Link>

            <Link
              to="/explore"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/explore' && !location.search
                  ? 'text-[#171717] bg-[#EAE6DF]'
                  : 'text-[#57534E] hover:text-[#171717] hover:bg-[#F5F2EB]'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#78716C]" />
              <span>Explore</span>
            </Link>

            <Link
              to="/hospitals"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname.startsWith('/hospital')
                  ? 'text-[#1E40AF] bg-[#EFF6FF]'
                  : 'text-[#57534E] hover:text-[#171717] hover:bg-[#F5F2EB]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#1E40AF]" />
              <span>Hospitals</span>
            </Link>

            <Link
              to="/explore?category=clinic"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/explore' && location.search.includes('clinic')
                  ? 'text-[#0F766E] bg-[#F0FDFA]'
                  : 'text-[#57534E] hover:text-[#171717] hover:bg-[#F5F2EB]'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Clinics</span>
            </Link>

            <Link
              to="/explore?category=salon"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/explore' && location.search.includes('salon')
                  ? 'text-[#78350F] bg-[#FEF3C7]'
                  : 'text-[#57534E] hover:text-[#171717] hover:bg-[#F5F2EB]'
              }`}
            >
              <Scissors className="w-3.5 h-3.5 text-[#78350F]" />
              <span>Salons</span>
            </Link>

            <Link
              to="/government-services"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname.startsWith('/government')
                  ? 'text-[#0F172A] bg-[#F1F5F9]'
                  : 'text-[#57534E] hover:text-[#171717] hover:bg-[#F5F2EB]'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 text-[#0F172A]" />
              <span>Govt Services</span>
            </Link>

            <a
              href={getHref('#how-it-works')}
              className="px-3 py-1.5 text-xs font-semibold text-[#57534E] hover:text-[#171717] rounded-lg hover:bg-[#F5F2EB] transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#78716C]" />
              <span>How It Works</span>
            </a>
          </nav>

          {/* ── User & CTA Block (Right) ─────────────────────────────── */}
          <div className="hidden lg:flex items-center gap-2.5">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Multi-module dual navigation pills */}
                {user?.isMultiModule ? (
                  <div className="flex items-center gap-1.5 bg-white border border-[#E7E3DC] p-1 rounded-xl shadow-xs">
                    <Link
                      to="/hospital/dashboard"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#EFF6FF] text-[#1E40AF] hover:bg-[#DBEAFE] transition-colors"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Hospital OPD</span>
                    </Link>
                    <Link
                      to="/government/dashboard"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-[#F8FAFC] text-[#0F172A] hover:bg-[#E2E8F0] transition-colors"
                    >
                      <Landmark className="w-3.5 h-3.5" />
                      <span>Govt Kendra</span>
                    </Link>
                  </div>
                ) : (
                  <Link
                    to={dashboardRoute}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#171717] bg-white border border-[#E7E3DC] hover:border-[#D8D2C5] hover:bg-[#F5F2EB] transition-all shadow-xs"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#171717]" />
                    <span>{displayRole || 'Dashboard'}</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={logout}
                  className="p-2 text-[#78716C] hover:text-[#B91C1C] hover:bg-[#FEF2F2] rounded-xl transition-colors"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-[#171717] hover:text-[#000000] rounded-xl hover:bg-[#F5F2EB] transition-colors"
                >
                  Sign In
                </Link>

                <Link
                  to="/register-business"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#171717] hover:bg-[#262626] rounded-xl shadow-xs transition-all active:scale-[0.98]"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white/80" />
                </Link>
              </div>
            )}
          </div>

          {/* ── Mobile Menu Toggle ──────────────────────────────────── */}
          <div className="flex items-center gap-2 lg:hidden">
            {isAuthenticated && (
              <Link
                to={dashboardRoute}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#E7E3DC] text-[#171717]"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2.5 rounded-xl text-[#171717] bg-white border border-[#E7E3DC] hover:bg-[#F5F2EB] transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Drawer / Menu ────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#E7E3DC] bg-[#FAF8F5] px-4 pt-3 pb-6 space-y-4 animate-fade-in shadow-modal">
          <div className="space-y-1">
            <Link
              to="/"
              onClick={closeMenu}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-[#171717] hover:bg-white rounded-xl transition-colors"
            >
              <Compass className="w-4 h-4 text-[#78716C]" />
              <span>Home</span>
            </Link>

            <Link
              to="/explore"
              onClick={closeMenu}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-[#171717] hover:bg-white rounded-xl transition-colors"
            >
              <Compass className="w-4 h-4 text-[#78716C]" />
              <span>Explore Services</span>
            </Link>

            <Link
              to="/hospitals"
              onClick={closeMenu}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-[#1E40AF] hover:bg-[#EFF6FF] rounded-xl transition-colors"
            >
              <Building2 className="w-4 h-4 text-[#1E40AF]" />
              <span>Hospitals &amp; OPD</span>
            </Link>

            <Link
              to="/explore?category=clinic"
              onClick={closeMenu}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-[#0F766E] hover:bg-[#F0FDFA] rounded-xl transition-colors"
            >
              <Stethoscope className="w-4 h-4 text-[#0F766E]" />
              <span>Clinics</span>
            </Link>

            <Link
              to="/explore?category=salon"
              onClick={closeMenu}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-[#78350F] hover:bg-[#FFFBEB] rounded-xl transition-colors"
            >
              <Scissors className="w-4 h-4 text-[#78350F]" />
              <span>Salons</span>
            </Link>

            <Link
              to="/government-services"
              onClick={closeMenu}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] rounded-xl transition-colors"
            >
              <Landmark className="w-4 h-4 text-[#0F172A]" />
              <span>Citizen &amp; Govt Services</span>
            </Link>

            <a
              href={getHref('#how-it-works')}
              onClick={closeMenu}
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-[#57534E] hover:bg-white rounded-xl transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-[#78716C]" />
              <span>How It Works</span>
            </a>
          </div>

          <div className="pt-3 border-t border-[#E7E3DC] space-y-2">
            {isAuthenticated ? (
              <div className="space-y-2">
                {user?.isMultiModule ? (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-[#6B665E] uppercase tracking-wider px-1">
                      Your Workspaces
                    </p>
                    <Link
                      to="/hospital/dashboard"
                      onClick={closeMenu}
                      className="flex items-center justify-between p-3 bg-white border border-[#E7E3DC] rounded-xl text-xs font-semibold text-[#1E40AF]"
                    >
                      <span className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#1E40AF]" />
                        <span>Hospital OPD Dashboard</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to="/government/dashboard"
                      onClick={closeMenu}
                      className="flex items-center justify-between p-3 bg-white border border-[#E7E3DC] rounded-xl text-xs font-semibold text-[#0F172A]"
                    >
                      <span className="flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-[#0F172A]" />
                        <span>Govt Kendra Dashboard</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <Link
                    to={dashboardRoute}
                    onClick={closeMenu}
                    className="flex items-center justify-between p-3 bg-white border border-[#E7E3DC] rounded-xl text-sm font-semibold text-[#171717]"
                  >
                    <span className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>{displayRole || 'Open Dashboard'}</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#78716C]" />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 text-xs font-semibold text-[#B91C1C] hover:bg-[#FEF2F2] rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex items-center justify-center py-2.5 px-3 text-xs font-semibold text-[#171717] bg-white border border-[#E7E3DC] rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  to="/register-business"
                  onClick={closeMenu}
                  className="flex items-center justify-center py-2.5 px-3 text-xs font-semibold text-white bg-[#171717] rounded-xl"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
