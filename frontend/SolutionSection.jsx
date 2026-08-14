import React from 'react';

/**
 * Shewwina "How Shewwina Solves It" Section Component
 * 
 * Aesthetic Influence: Stripe & Linear Premium SaaS Product Showcase
 * Displays the 4 Core Solution Modules:
 * 1. Virtual Digital Queueing
 * 2. Smart Online Booking
 * 3. Automated WhatsApp & SMS Alerts
 * 4. Intelligent Analytics Hub
 */
export default function SolutionSection() {
  const solutions = [
    {
      id: '01',
      title: 'Virtual Digital Queueing',
      tagline: 'DIGITAL QUEUE',
      description: 'Customers scan a QR code or tap a link to join your live digital waitlist from anywhere. They can wait in their car, at a nearby cafe, or at home.',
      color: 'blue',
      badgeClass: 'text-blue-600 bg-blue-50 border-blue-100',
      iconBg: 'bg-blue-50 border-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
      hoverBorder: 'hover:border-blue-500/40',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9l-5-5-5 5" />
        </svg>
      ),
      illustration: (
        <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 text-white shadow-inner">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Queue Token
            </span>
            <span className="font-mono text-slate-300">#Q-048</span>
          </div>
          <div className="flex items-center justify-between bg-slate-900 p-3.5 rounded-xl border border-slate-800">
            <div>
              <div className="text-xs text-slate-400">Position in Line</div>
              <div className="text-2xl font-black text-white mt-0.5">#2 Next</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Estimated Wait</div>
              <div className="text-lg font-bold text-blue-400 mt-0.5">6 Mins</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: '02',
      title: 'Smart Online Booking',
      tagline: 'ONLINE APPOINTMENTS',
      description: '24/7 self-service scheduling engine that automatically syncs staff calendars, eliminates double-bookings, and collects deposits effortlessly.',
      color: 'purple',
      badgeClass: 'text-purple-600 bg-purple-50 border-purple-100',
      iconBg: 'bg-purple-50 border-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
      hoverBorder: 'hover:border-purple-500/40',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      illustration: (
        <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 text-white shadow-inner">
          <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
            <span>Select Time Slot &mdash; Today</span>
            <span className="text-purple-400 font-semibold">Staff: Sarah M.</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-center text-xs text-slate-400 line-through">
              10:00 AM
            </div>
            <div className="p-2.5 bg-purple-600 text-white rounded-lg text-center text-xs font-bold shadow-md">
              11:30 AM
            </div>
            <div className="p-2.5 bg-slate-900 border border-purple-500/40 rounded-lg text-center text-xs text-purple-300 font-medium cursor-pointer">
              02:15 PM
            </div>
          </div>
        </div>
      )
    },
    {
      id: '03',
      title: 'Automated WhatsApp & SMS',
      tagline: 'REAL-TIME ALERTS',
      description: 'Automated SMS & WhatsApp turn alerts keep clients informed as their turn approaches. Zero waiting room crowding and zero missed appointments.',
      color: 'emerald',
      badgeClass: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
      hoverBorder: 'hover:border-emerald-500/40',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      illustration: (
        <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 text-white shadow-inner">
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between text-emerald-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd"/></svg>
                WhatsApp Alert
              </span>
              <span className="text-[10px] text-slate-400 font-mono">11:28 AM</span>
            </div>
            <p className="text-slate-200 pt-1 leading-snug">
              "Hi Priya! You're up next at Luxe Salon. Please head to Chair #1 in 3 mins."
            </p>
          </div>
        </div>
      )
    },
    {
      id: '04',
      title: 'Intelligent Analytics Hub',
      tagline: 'BUSINESS DASHBOARD',
      description: 'Real-time control panel gives management full visibility over customer throughput, staff service times, wait-time bottlenecks, and daily revenue.',
      color: 'amber',
      badgeClass: 'text-amber-600 bg-amber-50 border-amber-100',
      iconBg: 'bg-amber-50 border-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
      hoverBorder: 'hover:border-amber-500/40',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      illustration: (
        <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 text-white shadow-inner">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Queue Velocity & Analytics</span>
            <span className="text-emerald-400 font-bold">99.4% CSAT</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400">Total Served</div>
              <div className="text-lg font-black text-white mt-0.5">142 Clients</div>
            </div>
            <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400">Avg Wait Time</div>
              <div className="text-lg font-black text-amber-400 mt-0.5">3.2 Mins</div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section id="solutions" className="py-24 bg-slate-50/60 border-t border-b border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            The Complete Solution
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            How Shewwina{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              Solves It
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-xl text-slate-600 leading-relaxed">
            Four powerful digital modules designed to turn waiting room friction into a smooth, high-converting customer experience.
          </p>
        </div>

        {/* 4 Solution Cards Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {solutions.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-3xl p-8 border border-slate-200/90 shadow-xl shadow-slate-200/50 hover:shadow-2xl ${item.hoverBorder} hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group overflow-hidden relative`}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-colors duration-300 shadow-sm ${item.iconBg}`}>
                    {item.icon}
                  </div>
                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${item.badgeClass}`}>
                    {item.id} &bull; {item.tagline}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-slate-900 transition-colors">
                  {item.title}
                </h3>

                <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Visual Illustration Widget */}
              <div className="mt-8">
                {item.illustration}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Footer */}
        <div className="mt-16 text-center">
          <a
            href="#get-started"
            className="px-8 py-4 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg shadow-blue-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
          >
            Experience Shewwina Solution Free for 14 Days
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>

      </div>
    </section>
  );
}
