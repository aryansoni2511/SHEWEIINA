import React from 'react';
import { Search, Stethoscope, Ticket, Clock, ArrowRight } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   SHEWWINA How It Works Section (Phase 2)
   Editorial 4-Step Customer Flow:
   1. Discover — Find nearby verified providers.
   2. Choose Service — Select doctor, OPD department, treatment, or citizen desk.
   3. Take Digital Pass — Instant browser pass without app download or paper tokens.
   4. Track Turn & Arrive — Real-time position and wait estimation.
───────────────────────────────────────────────────────────────────────────── */

const STEPS = [
  {
    step: '01',
    title: 'Search & Discover',
    description: 'Find active queues at nearby hospitals, medical clinics, grooming salons, or citizen facilitation centres.',
    icon: Search,
  },
  {
    step: '02',
    title: 'Select Your Service',
    description: 'Choose your medical specialty, consulting doctor, grooming service, or citizen document desk.',
    icon: Stethoscope,
  },
  {
    step: '03',
    title: 'Receive Digital Pass',
    description: 'Get an instant digital token pass in your smartphone browser with no app installation required.',
    icon: Ticket,
  },
  {
    step: '04',
    title: 'Track Live & Arrive',
    description: 'Monitor your queue position in real time. Receive arrival notifications and arrive right when called.',
    icon: Clock,
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="py-16 sm:py-24 bg-white border-b border-[#E7E3DC]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E7E3DC] text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-3">
            <span>Simple 4-Step Process</span>
          </div>
          <h2
            id="how-it-works-title"
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#171717] tracking-tight"
          >
            How SHEWWINA Works for Customers
          </h2>
          <p className="mt-4 text-base text-[#57534E] leading-relaxed">
            Eliminate standing in crowded waiting rooms with a transparent, easy-to-follow process designed for every smartphone.
          </p>
        </div>

        {/* 4-Step Grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative p-6 rounded-2xl bg-[#FAF8F5] border border-[#E7E3DC] hover:border-[#171717] transition-all duration-150 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-[#E7E3DC]/80 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#E7E3DC] flex items-center justify-center text-[#171717] group-hover:bg-[#171717] group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-2xl font-bold text-[#A8A29E] group-hover:text-[#171717] tabular-nums transition-colors">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-[#171717] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#57534E] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-[#E7E3DC]/60 flex items-center text-[11px] font-semibold text-[#171717]">
                  <span>Step {index + 1} of 4</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
