import React from 'react';

/**
 * Reusable EmptyState component with Editorial design tokens
 */
export default function EmptyState({
  title = 'No records found',
  description = 'There are no active entries to display right now.',
  icon = null,
  action = null,
  className = '',
}) {
  return (
    <div
      className={`py-12 px-4 text-center flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#F5F2EB] text-[#78716C] border border-[#E7E3DC] flex items-center justify-center mb-3">
        {icon || (
          <svg
            className="w-5 h-5 text-[#78716C]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.75"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
      </div>
      <h4 className="text-sm font-semibold text-[#171717]">{title}</h4>
      <p className="mt-1 text-xs text-[#6B665E] max-w-sm leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
