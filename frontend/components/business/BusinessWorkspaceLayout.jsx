import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LogoMark from '../LogoMark';
import { getUserDisplayRole } from '../../utils/navigation';
import {
  LayoutDashboard,
  Users,
  Layers,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Building2,
  Landmark,
  Stethoscope,
  Scissors,
  QrCode,
  BarChart3,
  ChevronDown,
  User,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

/**
 * Premium Editorial Business Workspace Shell
 * Reusable layout for Hospital, Government, Clinic, and Salon operators
 */
export default function BusinessWorkspaceLayout({
  children,
  activeModule = 'business', // 'hospital' | 'government' | 'clinic' | 'salon' | 'business'
  activeTab = 'overview',
  onTabChange = null,
  customNavItems = null,
  establishmentName = null,
  establishmentCode = null,
  isQueueOpen = true,
  onToggleQueue = null,
}) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const displayRole = getUserDisplayRole(user);

  // Industry styling tokens
  const moduleStyles = {
    hospital: {
      badgeBg: 'bg-[#EFF6FF] text-[#1E40AF] border-[#DBEAFE]',
      icon: <Building2 className="w-4 h-4 text-[#1E40AF]" />,
      label: 'Hospital OPD',
      accent: '#1E3A8A',
    },
    government: {
      badgeBg: 'bg-[#F8FAFC] text-[#0F172A] border-[#E2E8F0]',
      icon: <Landmark className="w-4 h-4 text-[#0F172A]" />,
      label: 'Govt Kendra',
      accent: '#0F172A',
    },
    clinic: {
      badgeBg: 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]',
      icon: <Stethoscope className="w-4 h-4 text-[#0F766E]" />,
      label: 'Clinic',
      accent: '#0F766E',
    },
    salon: {
      badgeBg: 'bg-[#FFFBEB] text-[#78350F] border-[#FEF3C7]',
      icon: <Scissors className="w-4 h-4 text-[#78350F]" />,
      label: 'Salon',
      accent: '#78350F',
    },
    business: {
      badgeBg: 'bg-[#F5F2EB] text-[#171717] border-[#E7E3DC]',
      icon: <LayoutDashboard className="w-4 h-4 text-[#171717]" />,
      label: 'Business',
      accent: '#171717',
    },
  };

  const currentModule = moduleStyles[activeModule] || moduleStyles.business;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#171717] flex flex-col antialiased selection:bg-[#171717] selection:text-white">
      {/* ── Top Workspace Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E7E3DC] shadow-subtle">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Left: Hamburger & Brand */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl text-[#171717] hover:bg-[#F5F2EB] transition-colors"
                aria-label="Toggle navigation drawer"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <Link to="/" className="flex items-center gap-2.5 group">
                <LogoMark className="w-8 h-8" iconSize="w-4 h-4" />
                <div className="hidden sm:flex flex-col leading-none">
                  <span className="font-display font-bold text-lg text-[#171717] tracking-tight">
                    Shewwina<span className="text-[#C25E38]">.</span>
                  </span>
                  <span className="text-[9px] font-semibold tracking-wider text-[#78716C] uppercase">
                    Operator Workspace
                  </span>
                </div>
              </Link>

              <span className="hidden sm:inline text-[#D8D2C5]">/</span>

              {/* Establishment Title & Module Badge */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentModule.badgeBg}`}>
                  {currentModule.icon}
                  <span>{currentModule.label}</span>
                </span>
                {establishmentName && (
                  <span className="text-xs font-semibold text-[#171717] hidden md:inline truncate max-w-xs">
                    {establishmentName}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Multi-Module Switcher, Queue Toggle, Notifications & Profile */}
            <div className="flex items-center gap-3">
              {/* Multi-Module Switcher for operators owning both Hospital & Government Kendra */}
              {user?.isMultiModule && (
                <div className="hidden md:flex items-center gap-1 bg-[#FAF8F5] border border-[#E7E3DC] p-1 rounded-xl text-xs font-semibold">
                  <Link
                    to="/hospital/dashboard"
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                      location.pathname.startsWith('/hospital')
                        ? 'bg-white text-[#1E40AF] shadow-xs'
                        : 'text-[#57534E] hover:text-[#171717]'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Hospital</span>
                  </Link>
                  <Link
                    to="/government/dashboard"
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                      location.pathname.startsWith('/government')
                        ? 'bg-white text-[#0F172A] shadow-xs'
                        : 'text-[#57534E] hover:text-[#171717]'
                    }`}
                  >
                    <Landmark className="w-3.5 h-3.5" />
                    <span>Govt Kendra</span>
                  </Link>
                </div>
              )}

              {/* Status Pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F5F2EB] border border-[#E7E3DC] text-[#57534E]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isQueueOpen ? 'bg-[#15803D]' : 'bg-[#B91C1C]'
                  }`}
                />
                <span className="hidden sm:inline">{isQueueOpen ? 'Queue Open' : 'Queue Paused'}</span>
              </div>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#F5F2EB] transition-colors text-xs font-medium text-[#171717]"
                  aria-expanded={profileOpen}
                >
                  <div className="w-6 h-6 rounded-lg bg-[#171717] text-white flex items-center justify-center text-[11px] font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline font-semibold">{user?.name?.split(' ')[0] || 'Operator'}</span>
                  <ChevronDown className="w-3 h-3 text-[#78716C]" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E7E3DC] rounded-2xl shadow-modal p-2 z-50 animate-fade-in text-xs">
                    <div className="p-3 border-b border-[#F0ECE4] mb-1">
                      <p className="font-semibold text-[#171717] truncate">{user?.name || 'Operator'}</p>
                      <p className="text-[#6B665E] text-[11px] truncate">{user?.email || ''}</p>
                      <span className="mt-1.5 inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FAF8F5] border border-[#E7E3DC] text-[#57534E]">
                        {displayRole || 'Operator'}
                      </span>
                    </div>

                    <Link
                      to="/"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-[#57534E] hover:text-[#171717] hover:bg-[#FAF8F5] rounded-xl transition-colors"
                    >
                      <span>Public Platform</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[#B91C1C] hover:bg-[#FEF2F2] rounded-xl transition-colors font-medium text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* ── Main Workspace Body with Sidebar & Content ──────────────────── */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">

        {/* ── Desktop & Mobile Responsive Sidebar ────────────────────────── */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E7E3DC] p-5 flex flex-col justify-between transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:z-auto lg:rounded-2xl lg:border lg:shadow-subtle lg:p-4 lg:w-60 lg:h-fit ${
            sidebarOpen ? 'translate-x-0 shadow-modal' : '-translate-x-full'
          }`}
        >
          <div className="space-y-6">
            {/* Mobile Sidebar Close Button */}
            <div className="flex items-center justify-between lg:hidden pb-3 border-b border-[#F0ECE4]">
              <span className="text-xs font-semibold text-[#78716C] uppercase tracking-wider">
                Workspace Menu
              </span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-[#171717] hover:bg-[#F5F2EB]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Custom or Contextual Navigation Items */}
            <nav className="space-y-1">
              {customNavItems ? (
                customNavItems
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onTabChange && onTabChange('overview')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                      activeTab === 'overview'
                        ? 'bg-[#171717] text-white font-semibold shadow-xs'
                        : 'text-[#57534E] hover:text-[#171717] hover:bg-[#F5F2EB]'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Overview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onTabChange && onTabChange('queue')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                      activeTab === 'queue'
                        ? 'bg-[#171717] text-white font-semibold shadow-xs'
                        : 'text-[#57534E] hover:text-[#171717] hover:bg-[#F5F2EB]'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Live Queue</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onTabChange && onTabChange('services')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                      activeTab === 'services'
                        ? 'bg-[#171717] text-white font-semibold shadow-xs'
                        : 'text-[#57534E] hover:text-[#171717] hover:bg-[#F5F2EB]'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Services</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onTabChange && onTabChange('analytics')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                      activeTab === 'analytics'
                        ? 'bg-[#171717] text-white font-semibold shadow-xs'
                        : 'text-[#57534E] hover:text-[#171717] hover:bg-[#F5F2EB]'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Analytics</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onTabChange && onTabChange('settings')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                      activeTab === 'settings'
                        ? 'bg-[#171717] text-white font-semibold shadow-xs'
                        : 'text-[#57534E] hover:text-[#171717] hover:bg-[#F5F2EB]'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Sidebar Footer Info */}
          <div className="pt-4 border-t border-[#F0ECE4] text-[11px] text-[#78716C] space-y-2">
            <div className="flex items-center gap-1.5 text-[#15803D] font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Operator</span>
            </div>
            <p className="text-[#A8A196]">Shewwina Flow v2.0</p>
          </div>
        </aside>

        {/* Backdrop for mobile drawer */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-[#171717]/40 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── Main Workspace Content Area ─────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          {children}
        </main>

      </div>
    </div>
  );
}
