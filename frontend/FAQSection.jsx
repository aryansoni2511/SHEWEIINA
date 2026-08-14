import React, { useState } from 'react';

/**
 * Shewwina FAQ Section Component
 * 
 * Aesthetic Influence: Stripe & Linear Accordion Component
 * Includes 6 Core Accordion Questions:
 * 1. What is Shewwina?
 * 2. How does the queue work?
 * 3. Can customers join remotely?
 * 4. Can I manage multiple branches?
 * 5. Is payment supported?
 * 6. Is it mobile friendly?
 */
export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0); // Default first item open

  const faqs = [
    {
      id: 'what-is-shewwina',
      question: 'What is Shewwina?',
      answer: 'Shewwina is an all-in-one Operating System for Customer Flow. It helps salons, healthcare clinics, restaurants, and service centers manage digital waitlists, online appointment scheduling, and automated customer notifications to eliminate lobby waiting times and boost daily operational revenue.'
    },
    {
      id: 'how-does-queue-work',
      question: 'How does the queue work?',
      answer: 'When a customer arrives or visits your booking link, they receive a digital queue token with a real-time estimated wait time. As staff call customers forward on their Shewwina dashboard, the system automatically sends WhatsApp & SMS alerts to notify the next person in line.'
    },
    {
      id: 'remote-join',
      question: 'Can customers join remotely?',
      answer: 'Yes! Customers can join your digital queue remotely by scanning a QR code on your storefront, clicking a link on your website or social media profiles, or receiving an SMS link. They can wait in their car, at home, or at a nearby cafe until their turn approaches.'
    },
    {
      id: 'multi-branch',
      question: 'Can I manage multiple branches?',
      answer: 'Absolutely. Shewwina is built with multi-location enterprise support. Business owners and managers can switch between branches, monitor centralized real-time queue dashboards, compare location metrics, and manage staff schedules from a single admin panel.'
    },
    {
      id: 'payments',
      question: 'Is payment supported?',
      answer: 'Yes! Shewwina integrates with popular payment gateways (UPI, Credit/Debit cards, Razorpay, Stripe, and Apple Pay). You can collect booking deposits, service pre-payments, or full digital invoices directly through the customer queue interface.'
    },
    {
      id: 'mobile-friendly',
      question: 'Is it mobile friendly?',
      answer: '100% mobile responsive. No customer app download is required—clients access their live queue pass directly in any mobile web browser. For business owners and staff, Shewwina works seamlessly on smartphones, tablets, iPads, and desktop browsers without requiring expensive hardware.'
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Got Questions? We Have Answers.
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Frequently Asked{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              Questions
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Everything you need to know about setting up Shewwina for your salon, clinic, or business.
          </p>
        </div>

        {/* Accordion Container */}
        <div className="mt-14 space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={faq.id}
                className="bg-slate-50/80 border border-slate-200/90 rounded-2xl overflow-hidden hover:border-blue-500/40 transition-colors shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 text-left font-display text-lg font-bold text-slate-900 flex items-center justify-between gap-4 focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <div
                    className={`w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-blue-50 border-blue-200 text-blue-600' : ''
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-sm sm:text-base text-slate-600 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="pt-2 border-t border-slate-200/60">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Footer */}
        <div className="mt-14 p-8 rounded-3xl bg-slate-900 text-white text-center flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="text-left max-w-lg">
            <h3 className="text-xl font-bold text-white">Still have questions?</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">Can't find the answer you're looking for? Speak directly to our product support team.</p>
          </div>
          <a href="#contact" className="px-6 py-3 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-full shadow transition-all shrink-0">
            Contact Support &rarr;
          </a>
        </div>

      </div>
    </section>
  );
}
