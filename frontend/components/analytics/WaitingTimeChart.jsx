import React from 'react';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';

/**
 * Reusable Waiting Time Trend & Queue Efficiency Component (Phase 5B)
 * Displays actual historical waiting time, service duration, and wait time distribution.
 * Clearly separates actual historical wait from current estimated line wait.
 */
export default function WaitingTimeChart({
  waitTimeData = null,
  serviceDurationData = null,
  waitingTokens = [],
  avgServiceDuration = 15,
  terms = { customerTerm: 'Customer', customerPlural: 'Customers', queueTerm: 'Queue' },
}) {
  const avgWait = waitTimeData?.avgWaitMinutes != null ? Math.round(waitTimeData.avgWaitMinutes) : null;
  const minWait = waitTimeData?.minWaitMinutes != null ? Math.round(waitTimeData.minWaitMinutes) : null;
  const maxWait = waitTimeData?.maxWaitMinutes != null ? Math.round(waitTimeData.maxWaitMinutes) : null;

  const avgDuration = serviceDurationData?.avgDurationMinutes != null ? Math.round(serviceDurationData.avgDurationMinutes) : null;
  const isDurationMeasurable = serviceDurationData?.isMeasurable ?? (avgDuration !== null);

  const distribution = waitTimeData?.distribution || null;
  const totalInDist = distribution
    ? (distribution.under10m + distribution.m10to20m + distribution.m20to30m + distribution.over30m)
    : 0;

  return (
    <div className="space-y-4 py-1">
      {/* Real Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Actual Avg. Wait
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-indigo-700 mt-1 block">
            {avgWait !== null ? (
              <>
                {avgWait} <span className="text-xs font-sans text-slate-500 font-normal">mins</span>
              </>
            ) : (
              <span className="text-sm font-sans text-slate-400 font-normal">Unavailable</span>
            )}
          </span>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
            From join to counter call
          </span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Max Wait Recorded
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-slate-800 mt-1 block">
            {maxWait !== null ? (
              <>
                {maxWait} <span className="text-xs font-sans text-slate-500 font-normal">mins</span>
              </>
            ) : (
              <span className="text-sm font-sans text-slate-400 font-normal">—</span>
            )}
          </span>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
            Peak wait duration
          </span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Actual Service Time
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-slate-800 mt-1 block">
            {isDurationMeasurable && avgDuration !== null ? (
              <>
                ~{avgDuration} <span className="text-xs font-sans text-slate-500 font-normal">mins</span>
              </>
            ) : (
              <span className="text-sm font-sans text-slate-400 font-normal">~{avgServiceDuration}m (est)</span>
            )}
          </span>
          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
            {isDurationMeasurable ? 'Measured turnaround' : 'Configured duration'}
          </span>
        </div>
      </div>

      {/* Wait Time Distribution Histogram (When distribution has data) */}
      {distribution && totalInDist > 0 ? (
        <div className="pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-700 block mb-2">
            Wait Time Distribution (Completed Calls)
          </span>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
              <span className="text-[10px] font-bold text-emerald-800 block">&lt;10 mins</span>
              <span className="font-mono text-base font-bold text-emerald-700 mt-0.5 block">
                {distribution.under10m}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-200/60">
              <span className="text-[10px] font-bold text-blue-800 block">10–20 mins</span>
              <span className="font-mono text-base font-bold text-blue-700 mt-0.5 block">
                {distribution.m10to20m}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/60">
              <span className="text-[10px] font-bold text-amber-800 block">20–30 mins</span>
              <span className="font-mono text-base font-bold text-amber-700 mt-0.5 block">
                {distribution.m20to30m}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-200/60">
              <span className="text-[10px] font-bold text-rose-800 block">&gt;30 mins</span>
              <span className="font-mono text-base font-bold text-rose-700 mt-0.5 block">
                {distribution.over30m}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-xs text-slate-500">
          <p className="font-medium text-slate-600">Historical wait distribution unavailable</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Will record automatically as customers are called to the counter.
          </p>
        </div>
      )}
    </div>
  );
}
