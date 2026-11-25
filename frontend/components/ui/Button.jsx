import React from 'react';

/**
 * Reusable Button component with Premium Editorial design tokens
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  icon = null,
  iconPosition = 'left',
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[34px]',
    md: 'px-4 py-2.5 text-sm gap-2 min-h-[42px]',
    lg: 'px-5 py-3 text-base gap-2.5 min-h-[48px]',
  };

  const variantClasses = {
    primary:
      'bg-[#171717] hover:bg-[#262626] active:bg-[#000000] text-white border border-[#171717] shadow-xs focus-visible:ring-[#171717] disabled:bg-[#E7E3DC] disabled:border-[#E7E3DC] disabled:text-[#A8A196]',
    secondary:
      'bg-white hover:bg-[#F5F2EB] active:bg-[#EAE6DF] text-[#171717] border border-[#E7E3DC] hover:border-[#D8D2C5] shadow-xs focus-visible:ring-[#171717] disabled:bg-[#FAF8F5] disabled:text-[#A8A196] disabled:border-[#E7E3DC]',
    dark:
      'bg-[#171717] hover:bg-[#262626] text-white border border-[#292524] shadow-xs focus-visible:ring-[#171717] disabled:bg-[#292524] disabled:text-[#78716C]',
    outline:
      'bg-transparent hover:bg-[#F5F2EB] active:bg-[#EAE6DF] text-[#171717] border border-[#E7E3DC] hover:border-[#D8D2C5] focus-visible:ring-[#171717] disabled:text-[#A8A196] disabled:border-[#E7E3DC]',
    ghost:
      'bg-transparent hover:bg-[#F5F2EB] active:bg-[#EAE6DF] text-[#57534E] hover:text-[#171717] focus-visible:ring-[#171717] disabled:text-[#A8A196]',
    terracotta:
      'bg-[#C25E38] hover:bg-[#A84A28] active:bg-[#8F3C1E] text-white shadow-xs focus-visible:ring-[#C25E38] disabled:bg-[#E7E3DC] disabled:text-[#A8A196]',
    hospital:
      'bg-[#1E3A8A] hover:bg-[#1E40AF] active:bg-[#172554] text-white shadow-xs focus-visible:ring-[#1E3A8A] disabled:bg-[#E2E8F0] disabled:text-[#94A3B8]',
    government:
      'bg-[#0F172A] hover:bg-[#1E293B] active:bg-[#020617] text-white shadow-xs focus-visible:ring-[#0F172A] disabled:bg-[#E2E8F0] disabled:text-[#94A3B8]',
    clinic:
      'bg-[#0F766E] hover:bg-[#115E59] active:bg-[#134E4A] text-white shadow-xs focus-visible:ring-[#0F766E] disabled:bg-[#CCFBF1] disabled:text-[#99F6E4]',
    destructive:
      'bg-[#B91C1C] hover:bg-[#991B1B] active:bg-[#7F1D1D] text-white shadow-xs focus-visible:ring-[#B91C1C] disabled:bg-[#FEE2E2] disabled:text-[#FCA5A5]',
    emerald:
      'bg-[#15803D] hover:bg-[#166534] active:bg-[#14532D] text-white shadow-xs focus-visible:ring-[#15803D] disabled:bg-[#DCFCE7] disabled:text-[#86EFAC]',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="w-4 h-4 animate-spin text-current"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              strokeLinecap="round"
              stroke="currentColor"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
}
