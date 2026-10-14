import React from 'react';
import EmptyState from '../ui/EmptyState';

/**
 * Reusable Service Breakdown Chart (Phase 5B)
 * Displays real service-level distribution with counts, percentages, and revenue.
 */
export default function ServiceBreakdownChart({
  services = [],
  totalTokens = 0,
  timeframe = 'today',
  tokens = [],
  terms = { serviceTerm: 'Service', servicePlural: 'Services', customerPlural: 'Customers' },
}) {
  let displayServices = Array.isArray(services) && services.length > 0 ? services : [];

  // Fallback to client-side tokens calculation if services array is empty
  if (displayServices.length === 0 && Array.isArray(tokens) && tokens.length > 0) {
    const serviceCounts = {};
    tokens.forEach((tok) => {
      const svc = tok.service || 'General Service';
      serviceCounts[svc] = (serviceCounts[svc] || 0) + 1;
    });
    const total = tokens.length;
    displayServices = Object.entries(serviceCounts).map(([name, count]) => ({
      serviceName: name,
      tokens: count,
      percentage: Math.round((count / total) * 100),
      served: 0,
      revenue: 0,
    }));
  }

  if (displayServices.length === 0) {
    return (
      <EmptyState
        title={`No ${terms.serviceTerm.toLowerCase()} activity recorded`}
        description={`When ${terms.customerPlural.toLowerCase()} register for specific offerings, the breakdown will chart here automatically.`}
        className="py-8"
      />
    );
  }

  const colors = [
    'bg-indigo-600',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-sky-500',
    'bg-purple-500',
    'bg-rose-500',
  ];

  return (
    <div className="space-y-4 py-1">
      {/* Visual Stacked Progress Bar */}
      <div className="h-2.5 w-full bg-slate-100 rounded-full flex overflow-hidden shadow-inner">
        {displayServices.map((svc, idx) => (
          <div
            key={svc.serviceId || svc.serviceName}
            style={{ width: `${svc.percentage}%` }}
            className={`${colors[idx % colors.length]} transition-all duration-300`}
            title={`${svc.serviceName}: ${svc.tokens} (${svc.percentage}%)`}
          />
        ))}
      </div>

      {/* Itemized Service List */}
      <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
        {displayServices.map((svc, idx) => (
          <div key={svc.serviceId || svc.serviceName} className="py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 max-w-[60%]">
              <span className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]} flex-shrink-0`} />
              <div className="truncate">
                <span className="font-semibold text-slate-900 block truncate" title={svc.serviceName}>
                  {svc.serviceName}
                </span>
                {svc.revenue != null && svc.revenue > 0 && (
                  <span className="text-[10px] text-emerald-600 font-mono font-medium block">
                    ₹{svc.revenue.toLocaleString('en-IN')} revenue
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono">
              <span className="text-slate-500">
                {svc.tokens} {svc.tokens === 1 ? 'token' : 'tokens'}
              </span>
              <span className="font-bold text-slate-800 w-10 text-right">
                {svc.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
