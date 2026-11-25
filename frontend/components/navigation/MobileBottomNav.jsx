import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, Ticket, Clock, User, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getCustomerActiveTokenApi } from '../../services/api';

/**
 * SHEWWINA Modern Mobile Bottom Navigation Bar
 *
 * Modern application-like fixed navigation for mobile viewports (< lg).
 * Directly maps to primary customer flows:
 * 1. Explore (Service & Map Discovery) -> /explore
 * 2. My Queue (Live Token Pass / Active Wait) -> /customer/dashboard (or active token)
 * 3. History (Past Token Visits & Records) -> /customer/dashboard?tab=history
 * 4. Profile / Sign In -> /customer/dashboard?tab=profile or /login
 */
export default function MobileBottomNav() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [activeTokenId, setActiveTokenId] = useState(null);
  const [activeTokenNumber, setActiveTokenNumber] = useState(null);

  // Hidden on operator workspaces and TV displays
  const isOperatorRoute =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/hospital/dashboard') ||
    location.pathname.startsWith('/government/dashboard') ||
    location.pathname.startsWith('/display') ||
    location.pathname.startsWith('/live');

  // Check if customer has an active token in progress
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated) {
      getCustomerActiveTokenApi()
        .then((res) => {
          if (!isMounted) return;
          if (res?.data?.tokenId) {
            setActiveTokenId(res.data.tokenId);
            setActiveTokenNumber(res.data.tokenNumber);
          } else {
            setActiveTokenId(null);
            setActiveTokenNumber(null);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [location.pathname, isAuthenticated]);

  if (isOperatorRoute) {
    return null;
  }

  const isExploreActive =
    location.pathname === '/explore' ||
    location.pathname === '/' ||
    location.pathname.startsWith('/hospitals') ||
    location.pathname.startsWith('/government-services');

  const isQueueActive =
    location.pathname.startsWith('/token/') ||
    location.pathname.startsWith('/join/') ||
    location.pathname.startsWith('/hospital/token/') ||
    location.pathname.startsWith('/government/token/') ||
    (location.pathname === '/customer/dashboard' && (!location.search || location.search.includes('tab=active')));

  const isHistoryActive =
    location.pathname === '/customer/dashboard' && location.search.includes('tab=history');

  const isProfileActive =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    (location.pathname === '/customer/dashboard' && location.search.includes('tab=profile'));

  const queueDestination = activeTokenId
    ? `/token/${activeTokenId}`
    : (isAuthenticated ? '/customer/dashboard?tab=active' : '/explore');

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E7E3DC] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe transition-transform duration-200"
    >
      <div className="grid grid-cols-4 max-w-md mx-auto h-16 items-center px-2">
        {/* 1. Explore */}
        <Link
          to="/explore"
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all active-press ${
            isExploreActive ? 'text-[#2563EB]' : 'text-[#78716C] hover:text-[#171717]'
          }`}
          aria-label="Explore Services & Map"
        >
          <div className="relative">
            <Compass className={`w-5 h-5 transition-transform ${isExploreActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'}`} />
          </div>
          <span className={`text-[10px] mt-1 tracking-tight ${isExploreActive ? 'font-bold text-[#2563EB]' : 'font-medium'}`}>
            Explore
          </span>
        </Link>

        {/* 2. My Queue / Token */}
        <Link
          to={queueDestination}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all active-press relative ${
            isQueueActive ? 'text-[#2563EB]' : 'text-[#78716C] hover:text-[#171717]'
          }`}
          aria-label="My Live Queue Token"
        >
          <div className="relative">
            <Ticket className={`w-5 h-5 transition-transform ${isQueueActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'}`} />
            {activeTokenNumber && (
              <span className="absolute -top-1 -right-2 flex h-3.5 px-1 items-center justify-center rounded-full bg-[#2563EB] text-white text-[8px] font-bold shadow-xs animate-pulse">
                {activeTokenNumber}
              </span>
            )}
          </div>
          <span className={`text-[10px] mt-1 tracking-tight ${isQueueActive ? 'font-bold text-[#2563EB]' : 'font-medium'}`}>
            My Queue
          </span>
        </Link>

        {/* 3. Visit History */}
        <Link
          to={isAuthenticated ? '/customer/dashboard?tab=history' : '/login?redirect=/customer/dashboard?tab=history'}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all active-press ${
            isHistoryActive ? 'text-[#2563EB]' : 'text-[#78716C] hover:text-[#171717]'
          }`}
          aria-label="Visit History & Receipts"
        >
          <div className="relative">
            <Clock className={`w-5 h-5 transition-transform ${isHistoryActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'}`} />
          </div>
          <span className={`text-[10px] mt-1 tracking-tight ${isHistoryActive ? 'font-bold text-[#2563EB]' : 'font-medium'}`}>
            History
          </span>
        </Link>

        {/* 4. Profile / Account */}
        <Link
          to={isAuthenticated ? '/customer/dashboard?tab=profile' : '/login'}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all active-press ${
            isProfileActive ? 'text-[#2563EB]' : 'text-[#78716C] hover:text-[#171717]'
          }`}
          aria-label="Customer Profile & Settings"
        >
          <div className="relative">
            <User className={`w-5 h-5 transition-transform ${isProfileActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.8]'}`} />
          </div>
          <span className={`text-[10px] mt-1 tracking-tight ${isProfileActive ? 'font-bold text-[#2563EB]' : 'font-medium'}`}>
            {isAuthenticated ? 'Profile' : 'Sign In'}
          </span>
        </Link>
      </div>
    </nav>
  );
}
