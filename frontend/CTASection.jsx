import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle2 } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   SHEWWINA Secondary Business Operator CTA Section (Phase 2)
   Clearly secondary section at the bottom of the customer-first homepage.
   Invites facility operators (hospitals, clinics, salons, kendras) to onboard.
───────────────────────────────────────────────────────────────────────────── */

export default function CTASection() {
  return (
    <section
      id="cta"
      aria-labelledby="cta-heading"
      className="py-16 sm:py-20 bg-[#FAF8F5] border-b border-[#E7E3DC]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#171717] text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden border border-[#262626] shadow-elevated">

          <div className="relative z-10 max-w-3xl">
            {/* Operator Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-semibold mb-6">
              <Building2 className="w-3.5 h-3.5 text-[#C25E38]" />
              <span>For Healthcare Facilities &amp; Service Providers</span>
            </div>

            <h2
              id="cta-heading"
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight"
            >
              Operate an orderly waiting room with SHEWWINA.
            </h2>

            <p className="mt-4 text-base sm:text-lg text-[#A8A29E] leading-relaxed max-w-2xl">
              Equip your hospital OPD, medical clinic, salon, or citizen facilitation kendra with an organized digital queue system.
              Call turns from any browser and give customers real-time peace of mind.
            </p>

            {/* Checklist */}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#E7E3DC] font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                <span>Zero hardware required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                <span>Multi-counter &amp; doctor OPD queues</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
                <span>Instant SMS &amp; browser alerts</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                to="/register-business"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#171717] text-sm font-semibold shadow-xs transition-colors"
              >
                <span>Register Your Facility</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-sm font-semibold transition-colors"
              >
                <span>Operator Sign In</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
