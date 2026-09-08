import React from 'react';

/**
 * Shewwina Core Platform Capabilities & Value Section
 *
 * Highlights genuine operational benefits for businesses and customers:
 * - QR virtual check-in
 * - Real-time SMS & WhatsApp alerts
 * - Live browser tracking without app download
 * - Fullscreen TV lobby display
 */
export default function StatsSection() {
  const capabilities = [
    {
      id: 'qr-checkin',
      title: 'QR Virtual Check-In',
      badge: 'ZERO HARDWARE',
      description: 'Customers scan a printed QR code or join online. No thermal paper rolls, ticket dispensers, or buzzer pagers required.',
      color: 'blue',
      badgeClass: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white',
      hoverBorder: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      id: 'automated-alerts',
      title: 'Automated SMS & WhatsApp Alerts',
      badge: 'REAL-TIME UPDATES',
      description: 'Customers receive timely alerts as their turn nears, allowing them to wait nearby instead of crowding your physical reception.',
      color: 'emerald',
      badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white',
      hoverBorder: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      id: 'live-tracking',
      title: 'Live Tracking on Any Device',
      badge: 'NO APP DOWNLOAD',
      description: 'Customers track their position, estimated wait, and live counter call from any mobile browser with audio chimes.',
      color: 'indigo',
      badgeClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white',
      hoverBorder: 'hover:border-indigo-500/50 hover:shadow-indigo-500/10',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="2" />
          <path d="M12 18h.01" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'tv-display',
      title: 'Lobby TV Display Mode',
      badge: 'LARGE SCREEN READY',
      description: 'Cast to any TV or tablet monitor for high-visibility token displays with automatic bilingual voice announcements.',
      color: 'amber',
      badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400 group-hover:bg-amber-600 group-hover:text-white',
      hoverBorder: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
        </svg>
      ),
    },
  ];

  return (
    <section id="stats" className="py-24 bg-slate-950 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Built For Real Operations
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Queue Smarter, <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
              Not Harder
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Everything your business needs to turn chaotic waiting lines into an organized, transparent digital experience.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {capabilities.map((item) => (
            <div
              key={item.id}
              className={`p-8 rounded-3xl bg-slate-900/90 border border-slate-800 ${item.hoverBorder} shadow-xl hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden`}
            >
              <div>
                <div className={`w-14 h-14 mb-6 rounded-2xl border flex items-center justify-center transition-colors duration-300 shadow-sm ${item.iconBg}`}>
                  {item.icon}
                </div>

                <div className="inline-block px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider mb-3 border uppercase">
                  <span className={item.badgeClass.split(' ')[0]}>{item.badge}</span>
                </div>

                <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                  {item.title}
                </h3>

                <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
