import React from 'react';

/**
 * Shewwina "Problem We Solve" Section Component
 * 
 * Aesthetic Influence: Linear & Stripe SaaS Dark Mode Section
 * Displays the 6 major friction points faced by salons and clinics:
 * 1. Long waiting time
 * 2. Paper token system
 * 3. Angry customers
 * 4. No queue visibility
 * 5. Staff confusion
 * 6. Lost customers
 */
export default function ProblemSection() {
  const problems = [
    {
      id: '01',
      title: 'Unpredictable Long Waits',
      badge: 'Friction #1',
      description: 'Clients wait 45+ minutes in crowded lobbies with zero visibility on when their turn will actually come, causing intense boredom and anxiety.',
      impact: '68% abandon wait > 20 min',
      color: 'rose',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: '02',
      title: 'Outdated Paper Tokens',
      badge: 'Friction #2',
      description: 'Physical paper tickets get lost, crushed, or stolen. Staff struggle to call out numbers verbally over noise, leading to skipped turns and confusion.',
      impact: '0% Digital tracking',
      color: 'amber',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      )
    },
    {
      id: '03',
      title: 'Angry & Frustrated Clients',
      badge: 'Friction #3',
      description: 'Lack of transparency turns waiting rooms into hostile environments. Frustrated clients badger receptionists every 5 minutes and leave negative 1-star reviews.',
      impact: '1-Star Google Reviews',
      color: 'red',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      )
    },
    {
      id: '04',
      title: 'Zero Queue Visibility',
      badge: 'Friction #4',
      description: 'Neither managers nor clients can see real-time queue length, average service speed, or staff throughput. Operating blindly without actionable data.',
      impact: 'No Analytics / Bottlenecks',
      color: 'purple',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.007 10.007 0 013.682-.763c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
        </svg>
      )
    },
    {
      id: '05',
      title: 'Staff Overwhelm & Chaos',
      badge: 'Friction #5',
      description: 'Receptionists waste up to 40% of their workday answering "When is my turn?" instead of attending to clients, managing appointments, or driving sales.',
      impact: '-40% Productivity Lost',
      color: 'orange',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      id: '06',
      title: 'Silent Revenue & Client Loss',
      badge: 'Friction #6',
      description: 'Impatient walk-in clients turn around and leave when they see a packed lobby. Competitors with smooth digital booking capture your lost revenue.',
      impact: 'Up to 30% Revenue Lost',
      color: 'pink',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      )
    }
  ];

  return (
    <section id="problems" className="py-24 bg-slate-900 text-white relative overflow-hidden">
      {/* Background radial spotlights */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            The Queue Crisis
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Traditional Waiting is{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-amber-300 to-orange-400">
              Killing Business Growth
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-xl text-slate-400 leading-relaxed">
            Paper slips, overcrowded waiting rooms, and angry phone calls cost salons and clinics thousands in lost revenue and burnt-out staff every month.
          </p>
        </div>

        {/* 6 Problem Cards Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {problems.map((prob) => (
            <div
              key={prob.id}
              className="p-7 rounded-3xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-500/50 hover:bg-slate-800 transition-all duration-300 group shadow-lg hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300">
                    {prob.icon}
                  </div>
                  <span className="text-xs font-mono font-semibold text-rose-400 bg-rose-950/80 border border-rose-800/60 px-3 py-1 rounded-full">
                    {prob.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white group-hover:text-rose-300 transition-colors">
                  {prob.title}
                </h3>

                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  {prob.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                <span>Impact Metric</span>
                <span className="font-bold text-rose-400">{prob.impact}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Transition Banner */}
        <div className="mt-16 p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 border border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="max-w-2xl text-center md:text-left">
            <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">The Shewwina Shift</div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Replace Queue Chaos with Digital Precision
            </h3>
            <p className="text-slate-300 text-sm sm:text-base mt-2">
              Transform physical waiting rooms into a seamless, virtual queue experience. Clients wait wherever they want while your staff works stress-free.
            </p>
          </div>

          <a href="#how-it-works" className="px-7 py-3.5 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-full shadow-lg hover:scale-105 transition-all inline-flex items-center gap-2 shrink-0">
            See How It Works
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>

      </div>
    </section>
  );
}
