import React from 'react';

/**
 * Reusable Badge & StatusBadge components with Editorial design tokens
 */
export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-0.5 text-xs gap-1.5',
    lg: 'px-3 py-1 text-xs gap-2',
  };

  const variantClasses = {
    neutral: 'bg-[#F5F2EB] text-[#57534E] border-[#E7E3DC]',
    slate: 'bg-slate-100 text-slate-700 border-slate-200/80',
    charcoal: 'bg-[#171717] text-white border-[#171717]',
    success: 'bg-[#F0FDF4] text-[#166534] border-[#DCFCE7]',
    emerald: 'bg-[#F0FDF4] text-[#166534] border-[#DCFCE7]',
    warning: 'bg-[#FFFBEB] text-[#92400E] border-[#FEF3C7]',
    amber: 'bg-[#FFFBEB] text-[#92400E] border-[#FEF3C7]',
    danger: 'bg-[#FEF2F2] text-[#991B1B] border-[#FEE2E2]',
    rose: 'bg-[#FEF2F2] text-[#991B1B] border-[#FEE2E2]',
    hospital: 'bg-[#EFF6FF] text-[#1E40AF] border-[#DBEAFE]',
    government: 'bg-[#F8FAFC] text-[#0F172A] border-[#E2E8F0]',
    clinic: 'bg-[#F0FDFA] text-[#0F766E] border-[#CCFBF1]',
    salon: 'bg-[#FFFBEB] text-[#78350F] border-[#FEF3C7]',
    terracotta: 'bg-[#FAF0EC] text-[#944428] border-[#F2DDD4]',
    dark: 'bg-[#1C1917] text-[#D8D2C5] border-[#292524]',
  };

  const dotClasses = {
    neutral: 'bg-[#78716C]',
    slate: 'bg-slate-500',
    charcoal: 'bg-white',
    success: 'bg-[#16A34A]',
    emerald: 'bg-[#16A34A]',
    warning: 'bg-[#D97706]',
    amber: 'bg-[#D97706]',
    danger: 'bg-[#DC2626]',
    rose: 'bg-[#DC2626]',
    hospital: 'bg-[#2563EB]',
    government: 'bg-[#0F172A]',
    clinic: 'bg-[#0D9488]',
    salon: 'bg-[#B45309]',
    terracotta: 'bg-[#C25E38]',
    dark: 'bg-[#A8A196]',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.neutral} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotClasses[variant] || dotClasses.neutral}`}
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
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7] ${
            size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          } ${className}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ADE80] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]"></span>
          </span>
          Serving Now
        </span>
      );
    case 'WAITING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-[#FFFBEB] text-[#92400E] border border-[#FEF3C7] ${
            size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          } ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
          Waiting
        </span>
      );
    case 'SERVED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-[#F5F2EB] text-[#57534E] border border-[#E7E3DC] ${
            size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          } ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#78716C]"></span>
          Served
        </span>
      );
    case 'CANCELLED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-[#FEF2F2] text-[#991B1B] border border-[#FEE2E2] ${
            size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          } ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
          Cancelled
        </span>
      );
    case 'SKIPPED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-[#F5F2EB] text-[#78716C] border border-[#E7E3DC] ${
            size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          } ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#A8A196]"></span>
          Skipped
        </span>
      );
    default:
      return (
        <Badge variant="neutral" size={size} className={className}>
          {status}
        </Badge>
      );
  }
}

export default Badge;
