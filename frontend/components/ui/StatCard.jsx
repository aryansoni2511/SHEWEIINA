import React from 'react';

/**
 * Reusable Metric/Stat Card with Editorial visual polish and tabular numerals
 */
export default function StatCard({
  title,
  value,
  subtitle = null,
  icon = null,
  trend = null,
  accent = 'neutral', // 'neutral' | 'hospital' | 'government' | 'clinic' | 'salon' | 'emerald' | 'amber' | 'rose'
  className = '',
}) {
  const accentStyles = {
    neutral: {
      border: 'border-[#E7E3DC] hover:border-[#D8D2C5]',
      iconBg: 'bg-[#F5F2EB] text-[#171717]',
      value: 'text-[#171717]',
    },
    hospital: {
      border: 'border-[#E7E3DC] hover:border-[#93C5FD]',
      iconBg: 'bg-[#EFF6FF] text-[#1E40AF]',
      value: 'text-[#1E40AF]',
    },
    government: {
      border: 'border-[#E7E3DC] hover:border-[#CBD5E1]',
      iconBg: 'bg-[#F8FAFC] text-[#0F172A]',
      value: 'text-[#0F172A]',
    },
    clinic: {
      border: 'border-[#E7E3DC] hover:border-[#99F6E4]',
      iconBg: 'bg-[#F0FDFA] text-[#0F766E]',
      value: 'text-[#0F766E]',
    },
    salon: {
      border: 'border-[#E7E3DC] hover:border-[#FDE68A]',
      iconBg: 'bg-[#FFFBEB] text-[#78350F]',
      value: 'text-[#78350F]',
    },
    emerald: {
      border: 'border-[#E7E3DC] hover:border-[#BBF7D0]',
      iconBg: 'bg-[#F0FDF4] text-[#166534]',
      value: 'text-[#166534]',
    },
    amber: {
      border: 'border-[#E7E3DC] hover:border-[#FDE68A]',
      iconBg: 'bg-[#FFFBEB] text-[#92400E]',
      value: 'text-[#92400E]',
    },
    rose: {
      border: 'border-[#E7E3DC] hover:border-[#FECDD3]',
      iconBg: 'bg-[#FEF2F2] text-[#991B1B]',
      value: 'text-[#991B1B]',
    },
    slate: {
      border: 'border-[#E7E3DC] hover:border-[#CBD5E1]',
      iconBg: 'bg-[#F1F5F9] text-[#334155]',
      value: 'text-[#0F172A]',
    },
  };

  const currentAccent = accentStyles[accent] || accentStyles.neutral;

  return (
    <div
      className={`bg-white border rounded-2xl p-5 shadow-subtle hover:shadow-card-hover transition-all duration-200 ${currentAccent.border} ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-[#6B665E] uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${currentAccent.iconBg}`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${currentAccent.value}`}>
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-semibold flex items-center gap-0.5 ${
              trend.isPositive ? 'text-[#15803D]' : 'text-[#B91C1C]'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.text}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-[#78716C] mt-1.5">{subtitle}</p>
      )}
    </div>
  );
}
