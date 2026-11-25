import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   SHEWWINA FAQ Section (Phase 2)
   Frequently Asked Questions for Patients, Customers, and Citizens
───────────────────────────────────────────────────────────────────────────── */

const FAQS = [
  {
    id: 'what-is',
    question: 'What is SHEWWINA?',
    answer:
      'SHEWWINA is an operating system for customer flow and queue management in India. It connects patients with hospital OPDs, citizens with government facilitation kendras, and customers with local medical clinics and salons through live digital queue passes.',
  },
  {
    id: 'how-to-join',
    question: 'How do I join a queue and receive a token?',
    answer:
      'Find your preferred hospital, clinic, salon, or citizen centre on SHEWWINA. Select the required service or doctor, enter your name and mobile number, and receive an instant digital token pass. You can also scan the QR code posted at the counter when you arrive.',
  },
  {
    id: 'app-download',
    question: 'Do I need to download a separate mobile application?',
    answer:
      'No application download is necessary. SHEWWINA runs completely inside any standard mobile web browser (Chrome, Safari, Firefox). You can bookmark your token link or leave the tab open to watch your queue position advance in real time.',
  },
  {
    id: 'wait-time-calc',
    question: 'How are estimated waiting times calculated?',
    answer:
      'Wait estimates are calculated continuously using actual service pacing: (number of customers ahead in queue) × (historical average consultation duration). The estimate automatically adapts as counters call and complete tickets.',
  },
  {
    id: 'arrival-notification',
    question: 'How will I know when my turn is approaching?',
    answer:
      'Your digital token screen clearly indicates your position in line (e.g. "#2 in Line") and highlights when your turn is approaching. You also receive an instant SMS notification when your token is called to proceed to the service counter.',
  },
  {
    id: 'cost-for-customer',
    question: 'Is there any fee for customers to join a queue on SHEWWINA?',
    answer:
      'Joining a digital queue and tracking your token status is completely free for customers and patients. You only pay for the actual medical consultation or service provided by the facility.',
  },
];

export default function FAQSection() {
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section
      id="faq"
      aria-labelledby="faq-section-title"
      className="py-16 sm:py-24 bg-white border-b border-[#E7E3DC]"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E7E3DC] text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Questions & Answers</span>
          </div>
          <h2
            id="faq-section-title"
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#171717] tracking-tight"
          >
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base text-[#57534E] leading-relaxed">
            Everything you need to know about joining queues, tracking digital tokens, and visiting service facilities.
          </p>
        </div>

        {/* Accordion List */}
        <div className="mt-12 space-y-4">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-2xl border border-[#E7E3DC] bg-[#FAF8F5] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggle(faq.id)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-base sm:text-lg font-bold text-[#171717]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#57534E] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#171717]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-sm text-[#57534E] leading-relaxed border-t border-[#E7E3DC]/60 bg-white">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
