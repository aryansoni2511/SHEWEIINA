import React from 'react';
import EmptyState from '../ui/EmptyState';

/**
 * Reusable Queue Load & Status Distribution Chart (Phase 5B)
 * Real-time and historical breakdown across queue token states:
 * Waiting, Serving, Served, Cancelled, and Skipped.
 */
export default function QueueLoadChart({
  summary = null,
  queueLoad = null,
  waitingCount = 0,
  servingCount = 0,
  servedCount = 0,
  tokens = [],
  terms = { customerTerm: 'Customer', customerPlural: 'Customers', queueTerm: 'Queue' },
}) {
  const waiting = queueLoad?.currentWaiting ?? summary?.waitingCount ?? waitingCount;
  const serving = queueLoad?.currentServing ?? summary?.servingCount ?? servingCount;
  const served = queueLoad?.currentServed ?? summary?.servedCount ?? servedCount;
  const cancelled = queueLoad?.currentCancelled ?? summary?.cancelledCount ?? 0;
  const skipped = queueLoad?.currentSkipped ?? summary?.skippedCount ?? 0;

  const total = summary?.totalTokens ?? (waiting + serving + served + cancelled + skipped);

  if (total === 0) {
    return (
      <EmptyState
        title={`${terms.queueTerm} is currently clear`}
        description={`Status breakdowns will appear as ${terms.customerPlural.toLowerCase()} are added, served, or completed.`}
        className="py-8"
      />
    );
  }

  const completionRate = summary?.completionRate ?? (total > 0 ? Math.round((served / total) * 100) : 0);
  const cancellationRate = summary?.cancellationRate ?? (total > 0 ? Math.round((cancelled / total) * 100) : 0);

  const statuses = [
    {
      label: 'Waiting in Line',
      count: waiting,
      color: 'bg-amber-500',
      textColor: 'text-amber-700',
      badgeBg: 'bg-amber-50 border-amber-200/70',
    },
    {
      label: 'Currently Serving',
      count: serving,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 border-emerald-200/70',
    },
    {
      label: 'Served & Completed',
      count: served,
      color: 'bg-indigo-600',
      textColor: 'text-indigo-700',
      badgeBg: 'bg-indigo-50 border-indigo-200/70',
    },
    {
      label: 'Cancelled / Skipped',
      count: cancelled + skipped,
      color: 'bg-rose-400',
      textColor: 'text-rose-700',
      badgeBg: 'bg-rose-50 border-rose-200/70',
    },
  ];

  return (
    <div className="space-y-4 py-1">
      {/* Visual Proportional Bar */}
      <div className="h-3 w-full bg-slate-100 rounded-full flex overflow-hidden shadow-inner">
        {statuses.map((st) => {
          const pct = total > 0 ? (st.count / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={st.label}
              style={{ width: `${pct}%` }}
              className={`${st.color} transition-all duration-300`}
              title={`${st.label}: ${st.count} (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>

      {/* Grid of Status Indicators */}
      <div className="grid grid-cols-2 gap-2.5">
        {statuses.map((st) => {
          const pct = total > 0 ? Math.round((st.count / total) * 100) : 0;
          return (
            <div
              key={st.label}
              className={`p-3 rounded-xl border ${st.badgeBg} flex flex-col justify-between`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${st.color}`} />
                <span className="text-[11px] font-semibold text-slate-700 truncate">
                  {st.label}
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <span className="font-mono text-base font-bold text-slate-900">
                  {st.count}
                </span>
                <span className={`font-mono text-xs font-semibold ${st.textColor}`}>
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Efficiency Metrics */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Completion: <strong className="text-emerald-700 font-mono">{completionRate}%</strong></span>
        <span>Drop-off / Cancel: <strong className="text-rose-700 font-mono">{cancellationRate}%</strong></span>
      </div>
    </div>
  );
}
