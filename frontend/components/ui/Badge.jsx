import React from 'react';

/**
 * Reusable Badge & StatusBadge components
 */
export function Badge({
  children,
  variant = 'slate',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  const variantClasses = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200/60',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/60',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/60',
    sky: 'bg-sky-50 text-sky-700 border-sky-200/60',
    dark: 'bg-slate-800 text-slate-200 border-slate-700',
  };

  const dotClasses = {
    slate: 'bg-slate-400',
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    sky: 'bg-sky-500',
    dark: 'bg-emerald-400',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.slate} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotClasses[variant] || dotClasses.slate}`}
        />
      )}
      {children}
    </span>
  );
}

/**
 * Specific Token Status Badge mapped to Shewwina token lifecycle
 */
export function StatusBadge({ status, size = 'md', className = '' }) {
  const normalized = (status || '').toUpperCase();

  switch (normalized) {
    case 'SERVING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${
            size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          } ${className}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Serving Now
        </span>
      );
    case 'WAITING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${
            size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          } ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Waiting
        </span>
      );
    case 'SERVED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${
            size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          } ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Served
        </span>
      );
    case 'CANCELLED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${
            size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          } ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Cancelled
        </span>
      );
    case 'SKIPPED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${
            size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          } ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Skipped
        </span>
      );
    default:
      return (
        <Badge variant="slate" size={size} className={className}>
          {status}
        </Badge>
      );
  }
}

export default Badge;
