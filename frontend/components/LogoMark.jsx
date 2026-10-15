import React from 'react';

/**
 * Reusable Shewwina Brand Logo Mark SVG
 * Fresh green visual identity: #166534 (Primary), #22C55E (Bright Accent), #DCFCE7 (Soft Green)
 *
 * @param {Object} props
 * @param {string} [props.className] - Container dimension/layout class (default: 'w-12 h-12')
 * @param {'green'|'emerald'|'blue'} [props.variant] - Gradient theme (defaults to 'green')
 * @param {string} [props.iconSize] - Sizing class for inner SVG glyph (default: 'w-6 h-6')
 */
export default function LogoMark({ className = 'w-10 h-10', variant = 'green', iconSize = 'w-5 h-5' }) {
  const gradientClass =
    variant === 'blue'
      ? 'from-blue-600 via-indigo-600 to-emerald-600 shadow-blue-500/20'
      : 'from-emerald-800 via-emerald-600 to-green-500 shadow-emerald-700/20';

  const overlayGradient =
    variant === 'blue'
      ? 'from-blue-600/30'
      : 'from-emerald-700/40 via-green-500/30';

  return (
    <div
      className={`${className} rounded-2xl bg-gradient-to-tr ${gradientClass} p-0.5 shadow-md flex items-center justify-center relative overflow-hidden group flex-shrink-0 transition-transform hover:scale-105`}
    >
      <div className="w-full h-full bg-[#172033] rounded-[14px] flex items-center justify-center relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-tr ${overlayGradient} to-transparent opacity-80`} />
        {/* Soft green highlight dot */}
        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#22C55E] opacity-75" />
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
