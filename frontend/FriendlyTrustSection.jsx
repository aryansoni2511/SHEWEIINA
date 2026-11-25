import React from 'react';
import { Eye, Clock, ShieldCheck, Smartphone, CheckCircle2 } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   SHEWWINA Customer Benefits Section (Phase 2)
   Highlights real customer value:
   1. Real-time browser token tracking
   2. Reliable waiting time visibility
   3. Less physical waiting room congestion
   4. Secure, privacy-conscious customer experience
───────────────────────────────────────────────────────────────────────────── */

const BENEFITS = [
  {
    title: 'Live Browser Token Tracking',
    description: 'Monitor your exact position in line directly from your smartphone browser. You are free to wait outside, in a nearby café, or in your vehicle.',
    icon: Smartphone,
    tag: 'Zero App Required',
  },
  {
    title: 'Transparent Wait-Time Estimates',
    description: 'See dynamic wait calculations based on live counter throughput and doctor consultation pacing, not guesswork or static estimates.',
    icon: Clock,
    tag: 'Dynamic Calculations',
  },
  {
    title: 'Reduced Waiting Room Congestion',
    description: 'Arrive at the healthcare facility or facilitation desk right when your turn is approaching, reducing crowded indoor waiting halls.',
    icon: Eye,
    tag: 'Safer Waiting',
  },
  {
    title: 'Private & Secure Queue Tracking',
    description: 'Your telephone number and consultation details remain private. Service counters identify you strictly by your digital token number.',
    icon: ShieldCheck,
    tag: 'Data Protected',
  },
];

export default function FriendlyTrustSection() {
  return (
    <section
      id="about"
      aria-labelledby="trust-section-title"
      className="py-16 sm:py-24 bg-[#FAF8F5] border-b border-[#E7E3DC]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E7E3DC] text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-3">
            <span>Customer-First Design</span>
          </div>
          <h2
            id="trust-section-title"
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#171717] tracking-tight"
          >
            Why Customers Rely on SHEWWINA
          </h2>
          <p className="mt-4 text-base text-[#57534E] leading-relaxed">
            Waiting in lines shouldn&apos;t mean losing your entire day. Here is how modern digital queue management transforms daily visits.
          </p>
        </div>

        {/* Benefits 4-Card Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {BENEFITS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="p-6 rounded-2xl bg-white border border-[#E7E3DC] hover:border-[#171717] hover:shadow-card transition-all duration-150 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E7E3DC] flex items-center justify-center text-[#171717]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-[#57534E] uppercase tracking-wider bg-[#FAF8F5] px-2.5 py-1 rounded-md border border-[#E7E3DC]">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-[#171717] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#57534E] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-[#E7E3DC] flex items-center gap-1.5 text-xs font-semibold text-[#15803D]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Available on all devices</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
