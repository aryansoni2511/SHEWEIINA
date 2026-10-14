import React from 'react';
import EmptyState from '../ui/EmptyState';

/**
 * Reusable Customer Flow Chart (Phase 5B)
 * Visualizes real intake volume across timeframes:
 * - Today: Hourly flow distribution (e.g. 9am, 10am, 11am)
 * - 7 Days / 30 Days: Daily volume trend by calendar day
 */
export default function CustomerFlowChart({
  flow = [],
  timeframe = 'today',
  peakHour = null,
  tokens = [],
  terms = { customerTerm: 'Customer', customerPlural: 'Customers' },
}) {
  // If flow array is empty, fallback to calculating from tokens (if available) or show EmptyState
  let displayData = Array.isArray(flow) && flow.length > 0 ? flow : [];

  if (displayData.length === 0 && Array.isArray(tokens) && tokens.length > 0) {
    const hoursMap = {};
    tokens.forEach((tok) => {
      if (tok.createdAt) {
        try {
          const date = new Date(tok.createdAt);
          const hour = date.getHours();
          hoursMap[hour] = (hoursMap[hour] || 0) + 1;
        } catch (_) {}
      }
    });
    const activeHours = Object.keys(hoursMap).map(Number).sort((a, b) => a - b);
    const minH = activeHours.length > 0 ? Math.max(0, Math.min(...activeHours) - 1) : 8;
    const maxH = activeHours.length > 0 ? Math.min(23, Math.max(...activeHours) + 1) : 20;

    for (let h = minH; h <= maxH; h++) {
      displayData.push({
        hour: h,
        label: `${h === 0 ? 12 : h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}`,
        tokensCreated: hoursMap[h] || 0,
        served: 0,
        cancelled: 0,
        skipped: 0,
      });
    }
  }

  const totalVolume = displayData.reduce((sum, d) => sum + (d.tokensCreated || 0), 0);

  if (displayData.length === 0 || totalVolume === 0) {
    return (
      <EmptyState
        title={timeframe === 'today' ? 'No customer flow recorded today' : `No flow data in past ${timeframe}`}
        description={`Hourly and daily ${terms.customerPlural.toLowerCase()} intake velocity will appear here as customers join the queue.`}
        className="py-8"
      />
    );
  }

  const maxCount = Math.max(...displayData.map((d) => d.tokensCreated || 0), 1);

  return (
    <div className="space-y-4 py-1">
      {/* Chart Header Meta */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-600" />
          <span className="font-semibold text-slate-700">
            {timeframe === 'today' ? "Today's Hourly Intake" : `${timeframe.toUpperCase()} Daily Volume`}
          </span>
          {peakHour && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 font-medium text-[10px]">
              {peakHour.label ? `Busiest: ${peakHour.label} (${peakHour.tokensCreated} ${terms.customerPlural.toLowerCase()})` : ''}
            </span>
          )}
        </div>
        <span className="font-mono text-slate-600">
          Total: <strong>{totalVolume}</strong> {totalVolume === 1 ? terms.customerTerm.toLowerCase() : terms.customerPlural.toLowerCase()}
        </span>
      </div>

      {/* Responsive Bar Chart Container */}
      <div className="h-32 flex items-end justify-between gap-1 sm:gap-1.5 pt-4 pb-1 px-1 border-b border-slate-100 overflow-x-auto">
        {displayData.map((d, idx) => {
          const count = d.tokensCreated || 0;
          const heightPct = Math.round((count / maxCount) * 100);
          const barLabel = d.dayLabel || d.label || `${d.hour}:00`;
          const key = d.date || d.hour || idx;

          return (
            <div
              key={key}
              className="flex-1 min-w-[20px] max-w-[40px] flex flex-col items-center h-full justify-end group relative"
            >
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded-lg shadow-lg pointer-events-none transition-opacity z-20 whitespace-nowrap">
                {count} {count === 1 ? terms.customerTerm.toLowerCase() : terms.customerPlural.toLowerCase()}
                {d.served != null && d.served > 0 ? ` (${d.served} served)` : ''}
              </div>

              {/* Bar */}
              <div
                style={{ height: `${Math.max(heightPct, 6)}%` }}
                className={`w-full rounded-t-md transition-all duration-300 ${
                  count > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-100'
                }`}
              />

              {/* Axis Label */}
              <span className="text-[10px] font-medium text-slate-400 mt-1.5 font-mono truncate max-w-full">
                {barLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
