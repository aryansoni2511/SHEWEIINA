import React from 'react';
import EmptyState from '../ui/EmptyState';

/**
 * Reusable Revenue & Service Financial Performance Component (Phase 5B)
 * Displays verified revenue, average ticket size, and multi-day revenue trends.
 * Strictly counts SERVED tokens using the service_price_at_join snapshot.
 */
export default function RevenueChart({
  revenueData = null,
  timeframe = 'today',
  estimatedRevenueToday = 0,
  customersServedToday = 0,
  terms = { customerTerm: 'Customer', customerPlural: 'Customers', serviceTerm: 'Service' },
}) {
  const totalRevenue = revenueData?.totalRevenue ?? Number(estimatedRevenueToday || 0);
  const servedCount = revenueData?.servedCustomerCount ?? Number(customersServedToday || 0);
  const avgTicket = revenueData?.avgTicketValue ?? (servedCount > 0 ? Math.round(totalRevenue / servedCount) : 0);
  const dailyBreakdown = revenueData?.daily || [];

  const hasDailyTrend = Array.isArray(dailyBreakdown) && dailyBreakdown.length > 1;
  const maxDailyRev = hasDailyTrend ? Math.max(...dailyBreakdown.map((d) => d.revenue || 0), 1) : 1;

  return (
    <div className="space-y-4 py-1">
      {/* Real Summary Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/70 rounded-2xl">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
            {timeframe === 'today' ? "Today's Revenue" : `${timeframe.toUpperCase()} Total Revenue`}
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-emerald-700 mt-1 block">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-emerald-600/90 font-medium mt-0.5 block">
            {servedCount} {servedCount === 1 ? terms.customerTerm.toLowerCase() : terms.customerPlural.toLowerCase()} completed
          </span>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
            Avg. Ticket Value
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-slate-800 mt-1 block">
            ₹{avgTicket.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
            Per completed {terms.serviceTerm.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Multi-Day Revenue Trend Chart (When 7d or 30d is selected) */}
      {hasDailyTrend ? (
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium text-slate-700">Daily Revenue Performance</span>
            <span className="font-mono text-[11px]">Peak: ₹{maxDailyRev.toLocaleString('en-IN')}</span>
          </div>

          <div className="h-28 flex items-end justify-between gap-1 pt-3 pb-1 border-b border-slate-100 overflow-x-auto">
            {dailyBreakdown.map((d, idx) => {
              const rev = d.revenue || 0;
              const heightPct = Math.round((rev / maxDailyRev) * 100);
              return (
                <div
                  key={d.date || idx}
                  className="flex-1 min-w-[20px] max-w-[36px] flex flex-col items-center h-full justify-end group relative"
                >
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded-lg shadow-lg pointer-events-none transition-opacity z-20 whitespace-nowrap">
                    ₹{rev.toLocaleString('en-IN')} ({d.served || 0} served)
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${Math.max(heightPct, 6)}%` }}
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      rev > 0 ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-100'
                    }`}
                  />

                  {/* Date Label */}
                  <span className="text-[9px] font-medium text-slate-400 mt-1 font-mono truncate max-w-full">
                    {d.dayLabel || d.date?.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : totalRevenue === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
          <p className="text-xs font-semibold text-slate-600">No revenue recorded for this period</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Revenue aggregates automatically as customers reach completed status.
          </p>
        </div>
      ) : null}
    </div>
  );
}
