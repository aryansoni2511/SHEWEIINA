import React from 'react';

/**
 * Shewwina Features Section Component
 * 
 * Aesthetic Influence: Stripe & Linear SaaS Feature Matrix
 * Includes 8 Core Features:
 * 1. Live Queue Sync
 * 2. Smart Appointments
 * 3. Digital Token System
 * 4. Real-Time ETA Engine
 * 5. Automated WhatsApp & SMS Alerts
 * 6. Automated Reports (PDF/CSV)
 * 7. Flow Analytics
 * 8. Business Dashboard
 */
export default function FeaturesSection() {
  const features = [
    {
      id: '01',
      title: 'Live Queue Sync',
      badge: 'LIVE SYNC',
      category: 'Queue Management',
      description: 'Real-time digital waitlist synchronized across staff devices with instant status updates and priority queuing.',
      color: 'blue',
      badgeClass: 'text-blue-600 bg-blue-50 border-blue-100',
      iconBg: 'bg-blue-50 border-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
      hoverBorder: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
      arrowColor: 'text-blue-600',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      id: '02',
      title: 'Smart Appointments',
      badge: '24/7 BOOKING',
      category: 'Scheduling Engine',
      description: '24/7 self-service scheduling portal allowing clients to book, reschedule, or cancel appointments without phone calls.',
      color: 'purple',
      badgeClass: 'text-purple-600 bg-purple-50 border-purple-100',
      iconBg: 'bg-purple-50 border-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
      hoverBorder: 'hover:border-purple-500/50 hover:shadow-purple-500/10',
      arrowColor: 'text-purple-600',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: '03',
      title: 'Digital Token System',
      badge: 'PAPERLESS',
      category: 'Pass Generation',
      description: 'Instant QR-based digital token issuance sent straight to customer smartphones. Zero paper waste, zero lost tickets.',
      color: 'emerald',
      badgeClass: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
      hoverBorder: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
      arrowColor: 'text-emerald-600',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      )
    },
    {
      id: '04',
      title: 'Real-Time ETA Engine',
      badge: 'AI CALCULATED',
      category: 'Wait Time Engine',
      description: 'Predictive AI algorithms calculate accurate wait times based on service duration, staff speed, and queue velocity.',
      color: 'amber',
      badgeClass: 'text-amber-600 bg-amber-50 border-amber-100',
      iconBg: 'bg-amber-50 border-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
      hoverBorder: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
      arrowColor: 'text-amber-600',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: '05',
      title: 'Automated Alerts',
      badge: 'WHATSAPP & SMS',
      category: 'Turn Reminders',
      description: 'Automated SMS, WhatsApp, and push notifications keep clients informed when their turn is approaching.',
      color: 'cyan',
      badgeClass: 'text-cyan-600 bg-cyan-50 border-cyan-100',
      iconBg: 'bg-cyan-50 border-cyan-100 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white',
      hoverBorder: 'hover:border-cyan-500/50 hover:shadow-cyan-500/10',
      arrowColor: 'text-cyan-600',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
    },
    {
      id: '06',
      title: 'Automated Reports',
      badge: 'EXPORT PDF/CSV',
      category: 'Data Export',
      description: 'Export daily, weekly, and monthly performance reports covering customer volume, peak hours, and staff velocity.',
      color: 'indigo',
      badgeClass: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      iconBg: 'bg-indigo-50 border-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
      hoverBorder: 'hover:border-indigo-500/50 hover:shadow-indigo-500/10',
      arrowColor: 'text-indigo-600',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: '07',
      title: 'Flow Analytics',
      badge: 'PREDICTIVE',
      category: 'Heatmaps & Trends',
      description: 'Gain deep operational visibility with customer flow heatmaps, staff efficiency tracking, and wait time optimization.',
      color: 'pink',
      badgeClass: 'text-pink-600 bg-pink-50 border-pink-100',
      iconBg: 'bg-pink-50 border-pink-100 text-pink-600 group-hover:bg-pink-600 group-hover:text-white',
      hoverBorder: 'hover:border-pink-500/50 hover:shadow-pink-500/10',
      arrowColor: 'text-pink-600',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      )
    },
    {
      id: '08',
      title: 'Business Dashboard',
      badge: 'OWNER HUB',
      category: 'Central Control',
      description: 'A sleek, unified control panel to monitor all chairs, locations, staff members, and live queue states in one place.',
      color: 'slate',
      badgeClass: 'text-slate-900 bg-slate-100 border-slate-200',
      iconBg: 'bg-slate-100 border-slate-200 text-slate-900 group-hover:bg-slate-950 group-hover:text-white',
      hoverBorder: 'hover:border-slate-950 hover:shadow-slate-950/10',
      arrowColor: 'text-slate-950',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      )
    }
  ];

  return (
    <section id="features" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Enterprise Feature Suite
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Everything You Need to <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              Master Customer Flow
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-xl text-slate-600 leading-relaxed">
            Engineered for modern salons, clinics, and service centers. Powerful features designed to eliminate wait times and boost daily revenue.
          </p>
        </div>

        {/* 8 Feature Cards Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feat) => (
            <div
              key={feat.id}
              className={`p-7 rounded-3xl bg-white border border-slate-200/90 ${feat.hoverBorder} shadow-lg shadow-slate-200/40 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-13 h-13 p-3 rounded-2xl border flex items-center justify-center transition-colors duration-300 shadow-sm ${feat.iconBg}`}>
                    {feat.icon}
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${feat.badgeClass}`}>
                    {feat.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 transition-colors">
                  {feat.title}
                </h3>

                <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                  {feat.description}
                </p>
              </div>

              <div className="mt-6 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>{feat.category}</span>
                <span className={`${feat.arrowColor} font-bold group-hover:translate-x-0.5 transition-transform`}>
                  &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
