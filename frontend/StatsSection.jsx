import React, { useState, useEffect, useRef } from 'react';

/**
 * Shewwina Statistics Section Component
 * 
 * Aesthetic Influence: Stripe & Vercel High-Contrast SaaS Metrics
 * Includes 4 Animated Counter Metrics:
 * 1. 1000+ Businesses
 * 2. 50,000+ Customers Served
 * 3. 30% Reduced Waiting Time
 * 4. 99% Customer Satisfaction
 */
export default function StatsSection() {
  const [hasAnimated, setHasAnimated] = useState(false);
  const [counts, setCounts] = useState({
    businesses: 0,
    customers: 0,
    reducedWait: 0,
    csat: 0
  });

  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animateNumbers();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const animateNumbers = () => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setCounts({
        businesses: Math.floor(1000 * easeOut),
        customers: Math.floor(50000 * easeOut),
        reducedWait: Math.floor(30 * easeOut),
        csat: Math.floor(99 * easeOut)
      });

      if (step >= steps) {
        setCounts({
          businesses: 1000,
          customers: 50000,
          reducedWait: 30,
          csat: 99
        });
        clearInterval(timer);
      }
    }, interval);
  };

  const stats = [
    {
      id: 'businesses',
      value: counts.businesses.toLocaleString(),
      suffix: '+',
      label: 'Businesses',
      badge: 'ACTIVE PARTNERS',
      description: 'Active salons, clinics, and service centers operating on Shewwina.',
      color: 'blue',
      badgeClass: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white',
      hoverBorder: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h1m-1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'customers',
      value: counts.customers.toLocaleString(),
      suffix: '+',
      label: 'Customers Served',
      badge: 'TOTAL QUEUE TOKENS',
      description: 'Virtual queue tokens issued seamlessly without lobby waiting.',
      color: 'purple',
      badgeClass: 'text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20 text-purple-400 group-hover:bg-purple-600 group-hover:text-white',
      hoverBorder: 'hover:border-purple-500/50 hover:shadow-purple-500/10',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'reducedWait',
      value: counts.reducedWait,
      suffix: '%',
      label: 'Reduced Waiting Time',
      badge: 'EFFICIENCY BOOST',
      description: 'Average reduction in lobby wait times recorded across partner locations.',
      color: 'emerald',
      badgeClass: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white',
      hoverBorder: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'csat',
      value: counts.csat,
      suffix: '%',
      label: 'Customer Satisfaction',
      badge: 'CSAT SCORE',
      description: 'CSAT rating based on post-service automated SMS feedback loops.',
      color: 'amber',
      badgeClass: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400 group-hover:bg-amber-600 group-hover:text-white',
      hoverBorder: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    }
  ];

  return (
    <section ref={sectionRef} id="stats" className="py-24 bg-slate-950 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Proven Enterprise Scale
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Transforming Customer Flow <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              At Massive Scale
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-xl text-slate-400 leading-relaxed">
            Real impact numbers generated across hundreds of salons, healthcare clinics, and service hubs.
          </p>
        </div>

        {/* 4 Animated Stat Cards Grid */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((st) => (
            <div
              key={st.id}
              className={`p-8 rounded-3xl bg-slate-900/90 border border-slate-800 ${st.hoverBorder} shadow-xl hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 group text-center relative overflow-hidden flex flex-col justify-between`}
            >
              <div>
                <div className={`w-14 h-14 mx-auto mb-6 rounded-2xl border flex items-center justify-center transition-colors duration-300 shadow-sm ${st.iconBg}`}>
                  {st.icon}
                </div>

                <div className="font-display text-5xl sm:text-6xl font-black tracking-tight text-white group-hover:text-blue-400 transition-colors flex items-center justify-center">
                  <span>{st.value}</span>
                  <span className="text-blue-500">{st.suffix}</span>
                </div>

                <h3 className="mt-3 text-lg font-bold text-slate-200">
                  {st.label}
                </h3>

                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  {st.description}
                </p>
              </div>

              <div className={`mt-6 pt-4 border-t border-slate-800 text-[11px] font-mono font-semibold uppercase tracking-wider ${st.badgeClass}`}>
                {st.badge}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
