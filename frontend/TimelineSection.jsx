import React from 'react';

/**
 * Shewwina "How Shewwina Works" Timeline Section Component
 * 
 * Aesthetic Influence: Minimalist Stripe & Linear Process Flow
 * Steps:
 * 1. Register Business
 * 2. Add Services & Staff
 * 3. Customer Books Appointment
 * 4. Customer Joins Queue
 * 5. Live Waiting Updates
 * 6. Business Calls Next Customer
 * 7. Service Complete & Feedback
 */
export default function TimelineSection() {
  const steps = [
    {
      step: '01',
      title: '1. Register Business',
      phase: 'SETUP',
      description: 'Create your Shewwina account in under 60 seconds. Set your business operating hours, location details, and chair/counter capacity.',
      color: 'blue',
      badgeClass: 'text-blue-600',
      borderHover: 'hover:border-blue-500/40',
      bgNode: 'bg-blue-600 shadow-blue-500/30',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h1m-1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      step: '02',
      title: '2. Add Services & Staff',
      phase: 'CONFIGURATION',
      description: 'Define your service menu (treatments, consultations, haircuts), assign staff members, and specify estimated duration times.',
      color: 'indigo',
      badgeClass: 'text-indigo-600',
      borderHover: 'hover:border-indigo-500/40',
      bgNode: 'bg-indigo-600 shadow-indigo-500/30',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      step: '03',
      title: '3. Customer Books Appointment',
      phase: 'BOOKING',
      description: 'Clients schedule appointments online 24/7 via your custom link or QR code, selecting their preferred staff member & time slot.',
      color: 'purple',
      badgeClass: 'text-purple-600',
      borderHover: 'hover:border-purple-500/40',
      bgNode: 'bg-purple-600 shadow-purple-500/30',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      step: '04',
      title: '4. Customer Joins Queue',
      phase: 'ARRIVAL',
      description: 'Walk-in or appointment clients scan your lobby QR code or tap their booking link to receive an instant digital token on their smartphone.',
      color: 'cyan',
      badgeClass: 'text-cyan-600',
      borderHover: 'hover:border-cyan-500/40',
      bgNode: 'bg-cyan-600 shadow-cyan-500/30',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      )
    },
    {
      step: '05',
      title: '5. Live Waiting Updates',
      phase: 'ENGAGEMENT',
      description: 'Clients track their live queue position (#2 in line, 6 min wait) on their phone and receive automated WhatsApp & SMS alerts.',
      color: 'amber',
      badgeClass: 'text-amber-600',
      borderHover: 'hover:border-amber-500/40',
      bgNode: 'bg-amber-500 shadow-amber-500/30',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      )
    },
    {
      step: '06',
      title: '6. Business Calls Next Customer',
      phase: 'SERVICE',
      description: 'Staff taps "Call Next" on their dashboard. The client receives an instant mobile notification: "Please head to Chair #1 now."',
      color: 'rose',
      badgeClass: 'text-rose-600',
      borderHover: 'hover:border-rose-500/40',
      bgNode: 'bg-rose-600 shadow-rose-500/30',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    },
    {
      step: '07',
      title: '7. Service Complete & Feedback',
      phase: 'FULFILLMENT',
      description: 'Service completes seamlessly. Client receives an automated receipt & 5-star review request while the next client in line is notified.',
      color: 'emerald',
      badgeClass: 'text-emerald-600',
      borderHover: 'hover:border-emerald-500/40',
      bgNode: 'bg-emerald-600 shadow-emerald-500/30',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-slate-50/70 border-t border-slate-200/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Simple 7-Step Workflow
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            How Shewwina{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              Works
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-xl text-slate-600 leading-relaxed">
            From business setup to completed service &mdash; an effortless, automated customer flow in 7 simple steps.
          </p>
        </div>

        {/* Timeline Container */}
        <div className="mt-20 relative max-w-5xl mx-auto">
          {/* Connector Line */}
          <div className="hidden lg:block absolute left-1/2 top-4 bottom-4 -translate-x-1/2 w-0.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-emerald-500 opacity-30" />

          <div className="space-y-8 lg:space-y-12 relative">
            {steps.map((item, idx) => {
              const isEven = idx % 2 === 0;

              return (
                <div key={item.step} className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12 group">
                  {/* Left Content Column (for even items on desktop) */}
                  <div className={`w-full lg:w-1/2 ${isEven ? 'lg:text-right order-2 lg:order-1' : 'hidden lg:block order-1'}`}>
                    {isEven && (
                      <div className={`p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-200/50 ${item.borderHover} hover:shadow-2xl transition-all duration-300`}>
                        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase mb-2 lg:justify-end">
                          <span className={item.badgeClass}>STEP {item.step}</span>
                          <span>&bull;</span>
                          <span className="text-slate-400">{item.phase}</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Central Node Badge */}
                  <div className={`order-1 lg:order-2 shrink-0 w-14 h-14 rounded-2xl ${item.bgNode} text-white font-display font-extrabold flex items-center justify-center shadow-lg z-20 border-4 border-white group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>

                  {/* Right Content Column (for odd items on desktop) */}
                  <div className={`w-full lg:w-1/2 ${!isEven ? 'order-2 lg:order-3' : 'hidden lg:block order-3'}`}>
                    {!isEven && (
                      <div className={`p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-200/50 ${item.borderHover} hover:shadow-2xl transition-all duration-300`}>
                        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase mb-2">
                          <span className={item.badgeClass}>STEP {item.step}</span>
                          <span>&bull;</span>
                          <span className="text-slate-400">{item.phase}</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
