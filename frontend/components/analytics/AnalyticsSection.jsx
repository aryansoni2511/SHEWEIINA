import React, { useState, useEffect, useCallback } from 'react';
import AnalyticsCard from './AnalyticsCard';
import ServiceBreakdownChart from './ServiceBreakdownChart';
import QueueLoadChart from './QueueLoadChart';
import RevenueChart from './RevenueChart';
import CustomerFlowChart from './CustomerFlowChart';
import WaitingTimeChart from './WaitingTimeChart';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { getBusinessAnalyticsApi } from '../../services/api';

/**
 * Dedicated Queue & Business Analytics Master Section (Phase 5B)
 * End-to-end connected to the protected /api/v1/business/analytics API.
 * Provides real operational data across Today, 7 Days, and 30 Days.
 */
export default function AnalyticsSection({
  queueData = null,
  waitingTokens = [],
  servicesList = [],
  terms = {
    categoryName: 'General Business',
    customerTerm: 'Customer',
    customerPlural: 'Customers',
    serviceTerm: 'Service',
    servicePlural: 'Services',
    servingTerm: 'Serving',
    queueTerm: 'Queue',
  },
  avgServiceDuration = 15,
}) {
  const [timeframe, setTimeframe] = useState('today');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real analytics data whenever timeframe changes
  const fetchAnalytics = useCallback(async (period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBusinessAnalyticsApi(period);
      if (res && res.data) {
        setAnalyticsData(res.data);
      }
    } catch (err) {
      console.error('[AnalyticsSection] Failed to load business analytics:', err.message);
      setError(err.message || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(timeframe);
  }, [timeframe, fetchAnalytics]);

  // Derived metrics from API payload (or fallback to real active queueData if API pending)
  const summary = analyticsData?.summary || null;
  const totalTokens = summary?.totalTokens ?? (queueData?.tokens?.length || 0);
  const totalRevenue = summary?.totalRevenue ?? (queueData?.estimatedRevenueToday || 0);
  const completionRate = summary?.completionRate ?? 0;
  const avgWaitTime = analyticsData?.waitTime?.avgWaitMinutes ?? null;

  const hasAnyData = analyticsData?.hasData ?? (totalTokens > 0);

  return (
    <section className="mt-10 pt-8 border-t border-slate-200/80" aria-label="Business Analytics">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 tracking-tight">
              Queue &amp; Business Analytics
            </h2>
            <Badge variant={hasAnyData ? 'indigo' : 'slate'} size="sm" dot>
              {loading ? 'Refreshing...' : hasAnyData ? 'Real Data' : 'No Records'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Verified intake velocity, financial performance, and {terms.serviceTerm.toLowerCase()} distribution for {terms.categoryName}.
          </p>
        </div>

        {/* Timeframe Selector Pills */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold self-start sm:self-auto border border-slate-200/60 shadow-inner">
          <button
            type="button"
            onClick={() => setTimeframe('today')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              timeframe === 'today'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Today (Hourly)
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('7d')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              timeframe === '7d'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            7 Days
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('30d')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              timeframe === '30d'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Error Callout with Retry */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchAnalytics(timeframe)}
            className="text-rose-700 border-rose-300 hover:bg-rose-100"
          >
            Retry Analytics
          </Button>
        </div>
      )}

      {/* Loading Skeleton / Overlay Indicator */}
      {loading && !analyticsData && (
        <div className="py-16 text-center text-slate-500">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium">Aggregating {timeframe.toUpperCase()} operational analytics...</p>
        </div>
      )}

      {/* Summary KPI Strip */}
      {(!loading || analyticsData) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-subtle">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {timeframe === 'today' ? "Today's Intake" : `${timeframe.toUpperCase()} Total Intake`}
            </span>
            <span className="font-mono text-2xl font-extrabold text-slate-900 mt-1 block">
              {totalTokens}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Total {terms.customerPlural.toLowerCase()} registered
            </span>
          </div>

          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-subtle">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              {timeframe === 'today' ? "Today's Revenue" : `${timeframe.toUpperCase()} Revenue`}
            </span>
            <span className="font-mono text-2xl font-extrabold text-emerald-700 mt-1 block">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">
              From completed {terms.servicePlural.toLowerCase()}
            </span>
          </div>

          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-subtle">
            <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block">
              Completion Rate
            </span>
            <span className="font-mono text-2xl font-extrabold text-indigo-700 mt-1 block">
              {completionRate}%
            </span>
            <span className="text-[10px] text-indigo-600 font-medium mt-0.5 block">
              {summary?.servedCount ?? 0} served of {totalTokens}
            </span>
          </div>

          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-subtle">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Historical Avg. Wait
            </span>
            <span className="font-mono text-2xl font-extrabold text-slate-900 mt-1 block">
              {avgWaitTime != null ? (
                <>
                  {Math.round(avgWaitTime)} <span className="text-xs font-sans text-slate-500 font-normal">mins</span>
                </>
              ) : (
                <span className="text-sm font-sans text-slate-400 font-normal">Unavailable</span>
              )}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Turnaround efficiency
            </span>
          </div>
        </div>
      )}

      {/* Grid of Analytics Cards */}
      {(!loading || analyticsData) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1. Service Breakdown Chart */}
          <AnalyticsCard
            title={`${terms.serviceTerm} Demand Breakdown`}
            subtitle={`Distribution of ${terms.customerPlural.toLowerCase()} across offerings for ${timeframe}.`}
            metric={totalTokens}
            metricSub={`Total ${terms.customerPlural.toLowerCase()} in period`}
          >
            <ServiceBreakdownChart
              services={analyticsData?.services || []}
              totalTokens={totalTokens}
              timeframe={timeframe}
              tokens={queueData?.tokens || []}
              terms={terms}
            />
          </AnalyticsCard>

          {/* 2. Real-time / Period Queue Load Distribution */}
          <AnalyticsCard
            title={`${terms.queueTerm} Load & Capacity`}
            subtitle={`Lifecycle breakdown across ${timeframe} queue tokens.`}
            metric={summary?.waitingCount ?? (waitingTokens.length)}
            metricSub={`Currently waiting in branch`}
          >
            <QueueLoadChart
              summary={summary}
              queueLoad={analyticsData?.queueLoad}
              waitingCount={waitingTokens.length}
              servingCount={queueData?.servingCount || 0}
              servedCount={queueData?.customersServedToday || 0}
              tokens={queueData?.tokens || []}
              terms={terms}
            />
          </AnalyticsCard>

          {/* 3. Waiting Time & Efficiency Analysis */}
          <AnalyticsCard
            title="Waiting Time & Efficiency"
            subtitle="Actual historical turnaround times and wait distributions."
          >
            <WaitingTimeChart
              waitTimeData={analyticsData?.waitTime}
              serviceDurationData={analyticsData?.serviceDuration}
              waitingTokens={waitingTokens}
              avgServiceDuration={avgServiceDuration}
              terms={terms}
            />
          </AnalyticsCard>

          {/* 4. Revenue & Ticket Performance */}
          <AnalyticsCard
            title="Financial & Service Performance"
            subtitle="Verified revenue and completed customer billing metrics."
          >
            <RevenueChart
              revenueData={analyticsData?.revenue}
              timeframe={timeframe}
              estimatedRevenueToday={queueData?.estimatedRevenueToday || 0}
              customersServedToday={queueData?.customersServedToday || 0}
              terms={terms}
            />
          </AnalyticsCard>

          {/* 5. Customer Flow Velocity (Full-width on 2-col) */}
          <div className="lg:col-span-2">
            <AnalyticsCard
              title={`${terms.customerTerm} Intake Velocity (${timeframe === 'today' ? 'Hourly' : 'Daily'})`}
              subtitle={
                timeframe === 'today'
                  ? "Real intake volume grouped by hour of the day for today's operating cycle."
                  : `Daily intake trends across the past ${timeframe} calendar days.`
              }
            >
              <CustomerFlowChart
                flow={analyticsData?.flow || []}
                timeframe={timeframe}
                peakHour={analyticsData?.peakHour}
                tokens={queueData?.tokens || []}
                terms={terms}
              />
            </AnalyticsCard>
          </div>
        </div>
      )}
    </section>
  );
}
