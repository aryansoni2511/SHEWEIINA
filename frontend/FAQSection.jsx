import React, { useState, useRef, useEffect } from 'react';

/* ─────────────────────────────────────────────────────────────────────
   FAQ Section — Phase 3 Redesign
   Accessible accordion with smooth expand/collapse animation.
   Uses max-height CSS transition (no dependency).
   Respects prefers-reduced-motion.
   Preserves aria-expanded and aria-controls.
───────────────────────────────────────────────────────────────────── */

const FAQS = [
  {
    id: 'what-is',
    question: 'What is Shewwina?',
    answer:
      'Shewwina is a digital queue management platform for salons, clinics, restaurants, and service businesses. It replaces paper tokens and crowded lobbies with a live virtual queue — customers join via QR code, track their position on their phone, and receive WhatsApp or SMS alerts when their turn arrives.',
  },
  {
    id: 'how-queue',
    question: 'How does the queue work?',
    answer:
      'When a customer arrives, they scan your lobby QR code or tap your booking link to receive a digital token with a live position and estimated wait time. As staff call customers forward on their Shewwina dashboard, the queue advances and automated alerts are sent to the next person in line.',
  },
  {
    id: 'remote-join',
    question: 'Can customers join remotely?',
    answer:
      "Yes. Customers can join your digital queue before they even arrive — from your website, social media link, or by scanning a QR code at your entrance. They see their live position and wait time on their phone. When it's nearly their turn, they get a WhatsApp or SMS alert to head in.",
  },
  {
    id: 'app-required',
    question: 'Do customers need to download an app?',
    answer:
      'No. Everything works in any mobile browser. Customers access their live queue pass, see their position, and receive alerts without installing anything. Businesses manage the queue from a web dashboard that also works on tablets and desktops.',
  },
  {
    id: 'revenue',
    question: 'What does the Revenue Tracking feature do?',
    answer:
      "Shewwina captures the service price at the moment a customer joins the queue. When that token is marked SERVED, the price is added to your today's estimated revenue dashboard — even if you later change the service price. This gives you accurate daily revenue data regardless of price updates.",
  },
  {
    id: 'setup',
    question: 'How quickly can I set up Shewwina?',
    answer:
      'Most businesses are live in under 60 seconds. Register your business, add your services and pricing, and share your queue link or print your QR code. Customers can start joining your digital queue immediately — no hardware, no installation, no IT department required.',
  },
];

function ChevronDown({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

/* ─── Animated panel wrapper ──────────────────────────────────────── */
function AccordionPanel({ isOpen, id, labelId, children }) {
  const panelRef = useRef(null);
  const [height, setHeight] = useState(0);

  /* Measure content height whenever open state changes */
  useEffect(() => {
    if (panelRef.current) {
      setHeight(isOpen ? panelRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div
      id={id}
      role="region"
      aria-labelledby={labelId}
      style={{
        maxHeight: `${height}px`,
        overflow: 'hidden',
        transition: 'max-height 0.32s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease',
        opacity: isOpen ? 1 : 0,
      }}
      /* Respect prefers-reduced-motion — instant toggle */
      className="motion-reduce:transition-none"
    >
      <div ref={panelRef}>
        {children}
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const toggle = (idx) => setOpenIdx(openIdx === idx ? null : idx);

  return (
    <section id="faq" aria-labelledby="faq-heading" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Got Questions?
          </div>

          <h2 id="faq-heading" className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Frequently Asked{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Questions
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Everything you need to know about setting up Shewwina for your business.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3" role="list">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            const btnId = `faq-btn-${faq.id}`;
            const panelId = `faq-panel-${faq.id}`;

            return (
              <div
                key={faq.id}
                role="listitem"
                className={`rounded-xl border overflow-hidden transition-colors duration-200 ${
                  isOpen
                    ? 'border-indigo-200 bg-indigo-50/40'
                    : 'border-slate-200/80 bg-slate-50/60 hover:border-indigo-200/60'
                }`}
              >
                {/* Trigger */}
                <button
                  type="button"
                  id={btnId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 rounded-xl"
                >
                  <span className="font-semibold text-slate-900 text-base leading-snug">{faq.question}</span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isOpen
                        ? 'bg-indigo-600 text-white rotate-180'
                        : 'bg-white border border-slate-200 text-slate-400'
                    }`}
                    aria-hidden="true"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {/* Animated panel — always rendered, height transitions 0 → full */}
                <AccordionPanel isOpen={isOpen} id={panelId} labelId={btnId}>
                  <div className="px-6 pb-6">
                    <div className="pt-1 border-t border-slate-200/60">
                      <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </AccordionPanel>
              </div>
            );
          })}
        </div>

        {/* Support footer */}
        <div className="mt-12 p-7 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xl">
          <div>
            <h3 className="text-base font-bold text-white">Still have questions?</h3>
            <p className="text-sm text-slate-400 mt-1">Reach our product team directly — we respond fast.</p>
          </div>
          <a
            href="#contact"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-full shadow transition-all"
          >
            Contact Support →
          </a>
        </div>
      </div>
    </section>
  );
}
