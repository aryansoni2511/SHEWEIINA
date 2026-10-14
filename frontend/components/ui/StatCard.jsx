import React from 'react';

/**
 * Reusable Metric/Stat Card with SaaS visual polish
 */
export default function StatCard({
  title,
  value,
  subtitle = null,
  icon = null,
  trend = null,
  accent = 'indigo', // 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate'
  className = '',
}) {
  const accentStyles = {
    indigo: {
      border: 'border-slate-200/80 hover:border-indigo-200',
      iconBg: 'bg-indigo-50 text-indigo-600',
      value: 'text-slate-900',
    },
    emerald: {
      border: 'border-slate-200/80 hover:border-emerald-200',
      iconBg: 'bg-emerald-50 text-emerald-600',
      value: 'text-emerald-700',
    },
    amber: {
      border: 'border-slate-200/80 hover:border-amber-200',
      iconBg: 'bg-amber-50 text-amber-600',
      value: 'text-amber-700',
    },
    rose: {
      border: 'border-slate-200/80 hover:border-rose-200',
      iconBg: 'bg-rose-50 text-rose-600',
      value: 'text-rose-700',
    },
    slate: {
      border: 'border-slate-200/80 hover:border-slate-300',
      iconBg: 'bg-slate-100 text-slate-600',
      value: 'text-slate-900',
    },
  };

  const currentAccent = accentStyles[accent] || accentStyles.indigo;

  return (
    <div
      className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 ${currentAccent.border} ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
      <div className="mt-2 flex items-baseline gap-2">
        <div className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${currentAccent.value}`}>
          {value}
        </div>
        {trend && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
            {trend}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-500 font-medium">{subtitle}</p>
      )}
    </div>
  );
}
