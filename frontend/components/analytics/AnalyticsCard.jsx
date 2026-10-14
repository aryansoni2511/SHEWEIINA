import React from 'react';

/**
 * Reusable Container for Dashboard Analytics Cards & Charts
 */
export default function AnalyticsCard({
  title,
  subtitle = null,
  metric = null,
  metricSub = null,
  badge = null,
  action = null,
  children,
  className = '',
}) {
  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 flex flex-col justify-between transition-all duration-150 hover:border-slate-300 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      {/* Optional Top Metric Highlight */}
      {metric !== null && (
        <div className="mb-4 pb-3 border-b border-slate-100 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {metric}
          </span>
          {metricSub && (
            <span className="text-xs text-slate-500 font-medium">
              {metricSub}
            </span>
          )}
        </div>
      )}

      {/* Main Chart/Visualization Body */}
      <div className="flex-1 w-full flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
}
