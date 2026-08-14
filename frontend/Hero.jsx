import React from 'react';

/**
 * Shewwina SaaS Hero Section Component
 * 
 * Aesthetic Influence: Linear, Stripe, Vercel & Notion
 * Features:
 * - Headline: "Stop Waiting. Start Living."
 * - Subheading: "Shewwina helps salons and clinics manage appointments and live queues digitally..."
 * - Primary CTA: "Get Started"
 * - Secondary CTA: "Book Demo"
 * - Multi-node visual illustration showing Customer, Queue, Salon, Mobile App, and Dashboard.
 */
export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 lg:pt-20 pb-24 bg-white text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Grid Pattern & Ambient Glows */}
      <div 
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(226, 232, 240, 0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(226, 232, 240, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle 600px at 50% 150px, rgba(0, 102, 255, 0.12), transparent 70%)'
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* HERO HEADER TEXT */}
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Pill Announcement Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/5 border border-slate-900/10 text-slate-700 text-xs sm:text-sm font-medium mb-8 hover:bg-slate-900/10 transition-colors shadow-sm cursor-pointer">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="font-semibold text-slate-900">Shewwina 2.0</span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-600">The Next-Gen Digital Queue Engine for Salons & Clinics</span>
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-black text-slate-900 tracking-tight leading-[1.05]">
            Stop Waiting. <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              Start Living.
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-8 text-lg sm:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-normal">
            Shewwina helps salons and clinics manage appointments and live queues digitally, reducing waiting time and improving customer experience.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
            {/* Primary Button */}
            <a
              href="#get-started"
              className="w-full sm:w-auto px-8 py-4 text-base sm:text-lg font-semibold text-white bg-slate-950 hover:bg-slate-800 rounded-full shadow-xl shadow-slate-950/20 hover:shadow-2xl hover:shadow-slate-950/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200 flex items-center justify-center gap-2.5 group"
            >
              <span>Get Started</span>
              <svg className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>

            {/* Secondary Button */}
            <a
              href="#book-demo"
              className="w-full sm:w-auto px-8 py-4 text-base sm:text-lg font-semibold text-slate-700 hover:text-slate-950 bg-white/80 hover:bg-slate-100/80 border border-slate-200/90 rounded-full shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2.5 backdrop-blur-sm"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Book Demo</span>
            </a>
          </div>

          {/* Social Proof */}
          <div className="mt-10 flex items-center justify-center gap-8 text-xs sm:text-sm text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              No hardware setup required
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              14-Day Free Trial
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              WhatsApp & SMS Sync
            </div>
          </div>

        </div>

        {/* HERO MODERN ILLUSTRATION SHOWCASE */}
        <div className="mt-16 sm:mt-20 max-w-6xl mx-auto relative">
          
          {/* Outer Glass Frame */}
          <div className="relative rounded-3xl p-3 sm:p-5 bg-gradient-to-b from-slate-200/80 via-slate-100/40 to-slate-200/60 shadow-2xl shadow-slate-900/10 border border-slate-200/80">
            
            {/* Inner Dark Glass Container */}
            <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 text-white p-6 sm:p-10">
              
              {/* Window Controls Header */}
              <div className="flex items-center justify-between pb-6 mb-8 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-400 ml-3 hidden sm:inline-block">app.shewwina.com &mdash; Live Customer Flow Network</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Queue Engine Active
                </span>
              </div>

              {/* 5 NODE INTERACTIVE ILLUSTRATION GRID */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10 items-stretch">
                
                {/* NODE 1 & 2: CUSTOMER & MOBILE APP */}
                <div className="md:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl group hover:border-blue-500/50 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        1. Customer & Mobile App
                      </span>
                      <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800/80 px-2 py-0.5 rounded-full font-mono">Mobile UI</span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Shewwina Pass</span>
                        <span className="text-emerald-400 font-mono">#Q-042</span>
                      </div>
                      <div className="p-3 bg-gradient-to-r from-blue-950/80 to-indigo-950/80 rounded-lg border border-blue-800/40">
                        <div className="text-xs text-blue-300 font-medium">Luxe Salon & Spa</div>
                        <div className="text-2xl font-black text-white mt-1">Position #2 in Line</div>
                        <div className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Est. Wait: <span className="font-bold text-white">8 minutes</span>
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-lg text-xs text-slate-300 flex items-center justify-between border border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          WhatsApp Notification Sent
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">Just now</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Customer joins via QR / Link</span>
                    <span className="text-blue-400 font-semibold">&rarr; Queue Node</span>
                  </div>
                </div>

                {/* NODE 3: DIGITAL QUEUE ENGINE */}
                <div className="md:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl group hover:border-purple-500/50 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        2. Live Queue Engine
                      </span>
                      <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800/80 px-2 py-0.5 rounded-full font-mono">AI Queue</span>
                    </div>

                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono font-bold text-[10px]">NOW SERVING</span>
                          <span className="font-medium text-white">Rahul S.</span>
                        </div>
                        <span className="text-emerald-400 font-mono text-[11px]">Chair #1</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/50 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded font-mono font-bold text-[10px]">#2 NEXT</span>
                          <span className="font-medium text-white">Priya K.</span>
                        </div>
                        <span className="text-blue-300 font-mono text-[11px]">~4 min wait</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs opacity-75">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded font-mono text-[10px]">#3 QUEUE</span>
                          <span className="font-medium text-slate-300">Amit M.</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">~12 min wait</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Automated flow management</span>
                    <span className="text-purple-400 font-semibold">&rarr; Salon & Dashboard</span>
                  </div>
                </div>

                {/* NODE 4 & 5: SALON / CLINIC & DASHBOARD */}
                <div className="md:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl group hover:border-emerald-500/50 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h1m-1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        3. Salon & Dashboard
                      </span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded-full font-mono">Owner Hub</span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-left">
                        <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-medium">Daily Served</div>
                          <div className="text-xl font-bold text-white mt-0.5">84 Clients</div>
                        </div>
                        <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                          <div className="text-[10px] text-slate-400 font-medium">Avg Wait Time</div>
                          <div className="text-xl font-bold text-emerald-400 mt-0.5">3.8 mins</div>
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                          <span>Today's Customer Flow</span>
                          <span className="text-emerald-400 font-bold">+24% Peak</span>
                        </div>
                        <div className="flex items-end gap-1.5 h-10 pt-2">
                          <div className="bg-blue-500/40 w-full h-[40%] rounded-t" />
                          <div className="bg-blue-500/60 w-full h-[65%] rounded-t" />
                          <div className="bg-blue-500/80 w-full h-[85%] rounded-t" />
                          <div className="bg-blue-500 w-full h-[100%] rounded-t" />
                          <div className="bg-purple-500 w-full h-[75%] rounded-t" />
                          <div className="bg-emerald-500 w-full h-[90%] rounded-t" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Zero no-shows</span>
                    <span className="text-emerald-400 font-semibold">100% Control</span>
                  </div>
                </div>

              </div>

              {/* Graphic Illustration Card Banner */}
              <div className="mt-8 rounded-2xl overflow-hidden border border-slate-800/90 shadow-2xl relative group">
                <img
                  src="./shewwina_hero_illustration.jpg"
                  alt="Shewwina SaaS Dashboard, Customer App, Queue & Salon Architecture Visual"
                  className="w-full h-auto object-cover max-h-[380px] rounded-2xl transform group-hover:scale-[1.01] transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-xs text-white/90">
                  <span className="font-semibold tracking-wide">
                    Shewwina Ecosystem: Customer &rarr; Live Mobile Queue &rarr; Salon / Clinic Dashboard
                  </span>
                  <span className="hidden sm:inline-block px-3 py-1 bg-slate-900/80 backdrop-blur rounded-full border border-slate-700/80 text-[11px]">
                    Stripe & Linear Aesthetic
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
