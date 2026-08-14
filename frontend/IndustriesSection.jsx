import React from 'react';

/**
 * Shewwina "Industries We Serve" Section Component
 * 
 * Aesthetic Influence: Stripe & Linear Modern SaaS Industry Matrix
 * Includes 7 Core Industries:
 * 1. Salons & Spas
 * 2. Clinics & OPDs
 * 3. Hospitals & Diagnostics
 * 4. Restaurants & Cafes
 * 5. Banks & Financial Services
 * 6. Government Offices
 * 7. Service Centers
 */
export default function IndustriesSection() {
  const industries = [
    {
      id: 'salon',
      title: 'Salons & Spas',
      tagline: 'HAIR & BEAUTY',
      description: 'Eliminate crowded waiting chairs. Allow clients to browse nearby shops until their stylist or therapist is ready.',
      color: 'blue',
      badgeClass: 'text-blue-600 bg-blue-50 border-blue-100',
      iconBg: 'bg-blue-50 border-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
      hoverBorder: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
      footerLabel: 'Stylist Flow Sync',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 0A3 3 0 104.879 4.879a3 3 0 004.242 4.242zm0 5.758a3 3 0 10-4.242 4.242 3 3 0 004.242-4.242z" />
        </svg>
      )
    },
    {
      id: 'clinic',
      title: 'Clinics & OPDs',
      tagline: 'HEALTHCARE',
      description: 'Reduce patient anxiety in waiting rooms with live digital queue tracking, SMS alerts, and smart doctor scheduling.',
      color: 'purple',
      badgeClass: 'text-purple-600 bg-purple-50 border-purple-100',
      iconBg: 'bg-purple-50 border-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white',
      hoverBorder: 'hover:border-purple-500/50 hover:shadow-purple-500/10',
      footerLabel: 'Doctor Queue Engine',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    },
    {
      id: 'hospital',
      title: 'Hospitals & Labs',
      tagline: 'HIGH VOLUME',
      description: 'Streamline high-volume patient flow across lab tests, pharmacy pickups, and multi-department specialist visits.',
      color: 'emerald',
      badgeClass: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
      hoverBorder: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
      footerLabel: 'Multi-Dept Routing',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h1m-1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'restaurant',
      title: 'Restaurants & Cafes',
      tagline: 'HOSPITALITY',
      description: 'Replace bulky buzzer pagers with direct WhatsApp waitlist notifications so guests can enjoy their wait time nearby.',
      color: 'amber',
      badgeClass: 'text-amber-600 bg-amber-50 border-amber-100',
      iconBg: 'bg-amber-50 border-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
      hoverBorder: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
      footerLabel: 'Table Seating Sync',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      id: 'bank',
      title: 'Banks & Financial',
      tagline: 'FINANCE',
      description: 'Manage counter queues, teller routing, and VIP customer appointments with real-time wait analytics and audit logs.',
      color: 'cyan',
      badgeClass: 'text-cyan-600 bg-cyan-50 border-cyan-100',
      iconBg: 'bg-cyan-50 border-cyan-100 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white',
      hoverBorder: 'hover:border-cyan-500/50 hover:shadow-cyan-500/10',
      footerLabel: 'Teller & Counter Routing',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      )
    },
    {
      id: 'government',
      title: 'Government Offices',
      tagline: 'PUBLIC SECTOR',
      description: 'Organize public queue lines for license renewals, documentation counters, and municipal services with digital precision.',
      color: 'indigo',
      badgeClass: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      iconBg: 'bg-indigo-50 border-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
      hoverBorder: 'hover:border-indigo-500/50 hover:shadow-indigo-500/10',
      footerLabel: 'Public Counter Engine',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      )
    },
    {
      id: 'service',
      title: 'Service Centers',
      tagline: 'ELECTRONICS & AUTO',
      description: 'Notify customers instantly when their device, car, or item is ready for pickup or bench assignment.',
      color: 'slate',
      badgeClass: 'text-slate-900 bg-slate-100 border-slate-200',
      iconBg: 'bg-slate-100 border-slate-200 text-slate-900 group-hover:bg-slate-950 group-hover:text-white',
      hoverBorder: 'hover:border-slate-950 hover:shadow-slate-950/10',
      footerLabel: 'Pickup & Service Status',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  return (
    <section id="industries" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h1m-1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Tailored Flow Intelligence
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Industries We{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              Serve
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-xl text-slate-600 leading-relaxed">
            From boutique salons to high-volume diagnostic clinics and public service hubs &mdash; Shewwina optimizes customer flow everywhere waiting exists.
          </p>
        </div>

        {/* 7 Industry Cards Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {industries.map((ind) => (
            <div
              key={ind.id}
              className={`p-7 rounded-3xl bg-white border border-slate-200/90 ${ind.hoverBorder} shadow-lg shadow-slate-200/40 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-14 h-14 p-3 rounded-2xl border flex items-center justify-center transition-colors duration-300 shadow-sm ${ind.iconBg}`}>
                    {ind.icon}
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${ind.badgeClass}`}>
                    {ind.tagline}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {ind.title}
                </h3>

                <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                  {ind.description}
                </p>
              </div>

              <div className="mt-6 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>{ind.footerLabel}</span>
                <span className="text-blue-600 font-bold group-hover:translate-x-1 transition-transform">
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
