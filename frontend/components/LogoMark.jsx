import React from 'react';

/**
 * Reusable Shewwina Brand Logo Mark SVG
 *
 * @param {Object} props
 * @param {string} [props.className] - Container dimension/layout class (default: 'w-12 h-12')
 * @param {'blue'|'emerald'} [props.variant] - Gradient theme ('blue' for customer/app, 'emerald' for business)
 * @param {string} [props.iconSize] - Sizing class for inner SVG glyph (default: 'w-6 h-6')
 */
export default function LogoMark({ className = 'w-12 h-12', variant = 'blue', iconSize = 'w-6 h-6' }) {
  const gradientClass =
    variant === 'emerald'
      ? 'from-emerald-500 via-teal-500 to-cyan-600 shadow-emerald-500/20'
      : 'from-blue-600 via-indigo-600 to-purple-600 shadow-blue-500/20';

  const overlayGradient =
    variant === 'emerald' ? 'from-emerald-500/30' : 'from-blue-600/30';

  return (
    <div
      className={`${className} rounded-2xl bg-gradient-to-tr ${gradientClass} p-0.5 shadow-lg flex items-center justify-center relative overflow-hidden group flex-shrink-0`}
    >
      <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-tr ${overlayGradient} to-transparent opacity-70`} />
        <svg
          className={`${iconSize} text-white relative z-10 transform group-hover:rotate-6 transition-transform duration-300`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
    </div>
  );
}
