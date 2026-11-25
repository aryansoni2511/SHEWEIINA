import React from 'react';

/**
 * Reusable Input component with Editorial styling
 */
export default function Input({
  label,
  id,
  error,
  helperText,
  icon = null,
  rightElement = null,
  className = '',
  wrapperClassName = '',
  required = false,
  type = 'text',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-[#171717] mb-1.5"
        >
          {label} {required && <span className="text-[#B91C1C]">*</span>}
        </label>
      )}
      <div className="relative rounded-xl">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#78716C]">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          required={required}
          aria-invalid={!!error}
          className={`w-full ${
            icon ? 'pl-10' : 'pl-3.5'
          } ${rightElement ? 'pr-11' : 'pr-3.5'} py-2.5 bg-white border text-sm text-[#171717] rounded-xl placeholder:text-[#A8A196] focus:outline-none transition-all ${
            error
              ? 'border-[#B91C1C] focus:border-[#B91C1C] focus:ring-1 focus:ring-[#B91C1C]'
              : 'border-[#E7E3DC] focus:border-[#171717] focus:ring-1 focus:ring-[#171717] hover:border-[#D8D2C5]'
          } disabled:bg-[#FAF8F5] disabled:text-[#A8A196] disabled:border-[#E7E3DC] ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
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
