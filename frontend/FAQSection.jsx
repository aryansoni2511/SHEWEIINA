import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────────────
   FAQ Section — Shewwina Friendly Design
   Fresh green palette, accessible accordion, clear beginner-friendly answers
───────────────────────────────────────────────────────────────────── */

const FAQS = [
  {
    id: 'what-is',
    question: 'What is Shewwina?',
    answer:
      'Shewwina is a smart waiting platform designed for everyday service businesses like salons, clinics, restaurants, and retail service centers. It replaces physical waiting lines and paper tokens with a live digital queue that customers can track on their smartphone.',
  },
  {
    id: 'how-queue',
    question: 'How does a customer join the queue?',
    answer:
      'A customer visits the business page or scans an in-store QR code, selects the service they need, and enters their name and phone number. They instantly receive a digital token pass with their queue number, current line position, and estimated wait time.',
  },
  {
    id: 'app-required',
    question: 'Do customers need to download a mobile app?',
    answer:
      'No app download is required. Everything runs inside any standard mobile browser (Chrome, Safari, Firefox). Customers can bookmark or keep the browser tab open to watch their position advance in real time.',
  },
  {
    id: 'demo-mode',
    question: 'What is the Interactive Queue Simulation / Demo Mode?',
    answer:
      'Demo Mode is an in-memory testing environment designed for student presentations and evaluation. It lets you simulate queue actions (Call Next, Mark Served, Add Customer, Auto-Run) safely with sample customers without touching or modifying real database records.',
  },
  {
    id: 'wait-calc',
    question: 'How is the estimated waiting time calculated?',
    answer:
      'The estimated wait is calculated as: (Number of customers ahead) × (Average service duration). For example, if 2 customers are ahead and each service takes ~5 minutes, the estimated wait is approximately 10 minutes. This is shown as an operational estimate.',
  },
  {
    id: 'hardware',
    question: 'Does a business need special hardware?',
    answer:
      'No specialized ticket dispensers, pagers, or thermal printers are needed. Business staff manage tokens directly from a smartphone, tablet, or laptop dashboard.',
  },
];

function ChevronDown({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function AccordionPanel({ isOpen, id, labelId, children }) {
  const panelRef = useRef(null);
  const [height, setHeight] = useState(0);

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
        transition: 'max-height 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.2s ease',
        opacity: isOpen ? 1 : 0,
      }}
      className="motion-reduce:transition-none"
    >
      <div ref={panelRef}>{children}</div>
    </div>
  );
}

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const toggle = (idx) => setOpenIdx(openIdx === idx ? null : idx);

  return (
    <section id="faq" aria-labelledby="faq-heading" className="py-16 sm:py-20 bg-white relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>Got Questions?</span>
          </div>

          <h2 id="faq-heading" className="font-display text-3xl sm:text-4xl font-extrabold text-[#172033] tracking-tight">
            Frequently Asked Questions
          </h2>

          <p className="mt-3 text-sm sm:text-base text-[#64748B] leading-relaxed max-w-xl mx-auto">
            Clear, straightforward answers about how Shewwina manages queues for customers and businesses.
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
                className={`rounded-2xl border overflow-hidden transition-colors duration-200 ${
                  isOpen
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-slate-200 bg-white hover:border-emerald-200'
                }`}
              >
                <button
                  type="button"
                  id={btnId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl"
                >
                  <span className="font-semibold text-[#172033] text-sm sm:text-base leading-snug">
                    {faq.question}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'bg-emerald-800 text-white rotate-180'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                    aria-hidden="true"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AccordionPanel isOpen={isOpen} id={panelId} labelId={btnId}>
                  <div className="px-6 pb-5">
                    <div className="pt-2 border-t border-emerald-100/60">
                      <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </AccordionPanel>
              </div>
            );
          })}
        </div>

        {/* Try Simulation Callout Banner */}
        <div className="mt-10 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-emerald-950">Want to test the queue without signing up?</h3>
            <p className="text-xs text-emerald-800/80 mt-0.5">
              Launch our live simulation to call next, mark served, and test wait calculations.
            </p>
          </div>
          <Link
            to="/demo"
            className="shrink-0 px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-colors shadow-xs"
          >
            Open Queue Playground →
          </Link>
        </div>
      </div>
    </section>
  );
}
