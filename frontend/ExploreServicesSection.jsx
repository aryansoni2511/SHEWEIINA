import React from 'react';
import { Link } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────────────
   Explore Service Categories — Shewwina Friendly Design
   Displays the 4 categories supported by the platform:
   - Salon & Beauty
   - Clinics
   - Restaurants
   - Retail & Service Centres
   Minimal category cards, subtle green backgrounds, leading to /join/demo
───────────────────────────────────────────────────────────────────── */

const CATEGORIES = [
  {
    id: 'salon',
    title: 'Salon & Beauty',
    description: 'Haircuts, styling, spa sessions, and grooming appointments without waiting in salon chairs.',
    icon: (
      <svg className="w-6 h-6 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 0A3 3 0 104.879 4.879a3 3 0 004.242 4.242zm0 5.758a3 3 0 10-4.242 4.242 3 3 0 004.242-4.242z" />
      </svg>
    ),
    badge: 'Ready to Join',
    link: '/join/demo',
    sampleServices: 'Haircut, Beard Trim, Hair Spa',
  },
  {
    id: 'clinic',
    title: 'Clinics & Healthcare',
    description: 'OPD patient queues, doctor consultations, and diagnostic checkups with live token calls.',
    icon: (
      <svg className="w-6 h-6 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    badge: 'Ready to Join',
    link: '/join/demo',
    sampleServices: 'Doctor OPD, Follow-up Consultation',
  },
  {
    id: 'restaurant',
    title: 'Restaurants & Dining',
    description: 'Digital table waitlists and dining queue passes so guests can browse nearby while waiting.',
    icon: (
      <svg className="w-6 h-6 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    badge: 'Ready to Join',
    link: '/join/demo',
    sampleServices: 'Table Waitlist, Priority Seating',
  },
  {
    id: 'service',
    title: 'Retail & Service Centres',
    description: 'Device repairs, customer service desks, and ticketing lines with transparent ETA estimates.',
    icon: (
      <svg className="w-6 h-6 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    badge: 'Ready to Join',
    link: '/join/demo',
    sampleServices: 'Device Diagnostics, General Support',
  },
];

export default function ExploreServicesSection() {
  return (
    <section
      id="explore-services"
      aria-labelledby="explore-services-title"
      className="py-16 sm:py-20 bg-[#F8FAFC]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs font-bold tracking-wider uppercase text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
            Supported Verticals
          </span>
          <h2
            id="explore-services-title"
            className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-[#172033] tracking-tight"
          >
            Explore Service Categories
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#64748B] leading-relaxed">
            Shewwina powers queue management for essential everyday industries. Select a vertical below to test joining a queue.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                {/* Icon with subtle green background */}
                <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] border border-emerald-200 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  {cat.icon}
                </div>

                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-base font-bold text-[#172033] group-hover:text-emerald-800 transition-colors">
                    {cat.title}
                  </h3>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    {cat.badge}
                  </span>
                </div>

                <p className="text-xs text-[#64748B] leading-relaxed mb-4">
                  {cat.description}
                </p>

                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-5">
                  <strong className="text-slate-700">Services:</strong> {cat.sampleServices}
                </div>
              </div>

              <Link
                to={cat.link}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-semibold rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors group-hover:bg-emerald-800 group-hover:text-white"
              >
                <span>Join {cat.title.split(' ')[0]} Queue</span>
                <span className="text-xs">→</span>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-xs text-[#64748B]">
          Looking to see the queue in action with full control?{' '}
          <Link to="/demo" className="text-emerald-700 font-bold hover:underline">
            Launch the Interactive Queue Simulation
          </Link>
        </div>
      </div>
    </section>
  );
}
