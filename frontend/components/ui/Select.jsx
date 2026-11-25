import React from 'react';

/**
 * Reusable Select component with Editorial styling and custom arrow
 */
export default function Select({
  label,
  id,
  error,
  helperText,
  children,
  className = '',
  wrapperClassName = '',
  required = false,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-[#171717] mb-1.5"
        >
          {label} {required && <span className="text-[#B91C1C]">*</span>}
        </label>
      )}
      <div className="relative rounded-xl">
        <select
          id={selectId}
          required={required}
          aria-invalid={!!error}
          className={`w-full appearance-none pl-3.5 pr-10 py-2.5 bg-white border text-sm text-[#171717] rounded-xl focus:outline-none transition-all cursor-pointer ${
            error
              ? 'border-[#B91C1C] focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C]'
              : 'border-[#E7E3DC] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] hover:border-[#D8D2C5]'
          } disabled:bg-[#FAF8F5] disabled:text-[#A8A196] disabled:border-[#E7E3DC] ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#78716C]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-[#B91C1C] font-medium flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-[#6B665E]">{helperText}</p>
      )}
    </div>
  );
}
