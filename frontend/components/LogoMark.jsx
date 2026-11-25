import React from 'react';

/**
 * Reusable Shewwina Brand Logo Mark SVG
 * Premium Editorial visual identity: Deep Charcoal & Terracotta Accent
 */
export default function LogoMark({ className = 'w-10 h-10', variant = 'editorial', iconSize = 'w-5 h-5' }) {
  const isEditorial = variant === 'editorial' || variant === 'green' || variant === 'emerald';

  const gradientClass = isEditorial
    ? 'from-[#171717] via-[#262626] to-[#404040] shadow-xs'
    : 'from-blue-900 via-indigo-900 to-slate-900 shadow-xs';

  return (
    <div
      className={`${className} rounded-2xl bg-gradient-to-tr ${gradientClass} p-0.5 shadow-subtle flex items-center justify-center relative overflow-hidden group flex-shrink-0 transition-transform active:scale-95`}
    >
      <div className="w-full h-full bg-[#171717] rounded-[14px] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#C25E38]/20 to-transparent opacity-80" />
        {/* Subtle terracotta indicator dot */}
        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#C25E38] opacity-90" />
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
