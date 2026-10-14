import React from 'react';

/**
 * Reusable Button component with unified SaaS design tokens
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
    sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[32px]',
    md: 'px-4 py-2.5 text-sm gap-2 min-h-[40px]',
    lg: 'px-5 py-3 text-base gap-2.5 min-h-[48px]',
  };

  const variantClasses = {
    primary:
      'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 focus-visible:ring-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none',
    secondary:
      'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm focus-visible:ring-slate-400 hover:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200',
    dark:
      'bg-slate-900 hover:bg-slate-800 text-white shadow-sm shadow-slate-900/10 focus-visible:ring-slate-700 disabled:bg-slate-800/50 disabled:text-slate-500',
    emerald:
      'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20 focus-visible:ring-emerald-500 disabled:bg-slate-800 disabled:text-slate-500',
    destructive:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 focus-visible:ring-rose-500 disabled:bg-slate-200 disabled:text-slate-400',
    outline:
      'bg-transparent hover:bg-slate-100 text-slate-700 border border-slate-300 focus-visible:ring-slate-400 disabled:text-slate-400 disabled:border-slate-200',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus-visible:ring-slate-400 disabled:text-slate-400',
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
