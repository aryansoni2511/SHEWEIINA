import React from 'react';
import LogoMark from './components/LogoMark';

/* ─────────────────────────────────────────────────────────────────────
   Footer Section — Phase 3 Redesign
   Fixed: JSX className (was `class`), LogoMark reuse, clean links
───────────────────────────────────────────────────────────────────── */

const LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Industries', href: '#industries' },
    { label: 'FAQ', href: '#faq' },
  ],
  Company: [
    { label: 'About Us', href: '#about' },
    { label: 'Contact', href: '#contact' },
    { label: 'Privacy Policy', href: '#privacy' },
    { label: 'Terms of Service', href: '#terms' },
  ],
  Connect: [
    { label: 'Email Support', href: 'mailto:hello@shewwina.com', external: false },
    { label: 'LinkedIn', href: 'https://linkedin.com', external: true },
    { label: 'GitHub', href: 'https://github.com', external: true },
  ],
};

function FooterLink({ href, children, external }) {
  return (
    <li>
      <a
        href={href}
        className="text-sm text-slate-400 hover:text-white transition-colors duration-150 flex items-center gap-1.5"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
        {external && (
          <svg className="w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        )}
      </a>
    </li>
  );
}

export default function FooterSection() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-white border-t border-slate-800/80 pt-16 pb-10 relative overflow-hidden">
      {/* Subtle grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right,rgba(226,232,240,0.5) 1px,transparent 1px),linear-gradient(to bottom,rgba(226,232,240,0.5) 1px,transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800/60">

          {/* Brand column */}
          <div className="lg:col-span-2 space-y-4">
            <a
              href="#home"
              className="inline-flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
              aria-label="Shewwina — return to top"
            >
              <LogoMark className="w-9 h-9" iconSize="w-4 h-4" />
              <span className="font-display font-extrabold text-xl tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                Shewwina<span className="text-indigo-500">.</span>
              </span>
            </a>

            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
              India's Smart Waiting Platform. Making lobby waiting rooms invisible for salons, clinics, restaurants, and service businesses.
            </p>

            {/* Status pill */}
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-mono font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                All Systems Operational
              </span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group} className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                {group}
              </h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <FooterLink key={item.label} href={item.href} external={item.external}>
                    {item.label}
                  </FooterLink>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {year} Shewwina. Built for Indian businesses.</p>
          <div className="flex items-center gap-5">
            <span className="hidden sm:inline">Designed with care for real operations</span>
            <a
              href="#home"
              className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
              aria-label="Back to top"
            >
              Back to top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
