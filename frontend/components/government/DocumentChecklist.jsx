import React, { useState } from 'react';

/**
 * Interactive Document Checklist for Citizen Services
 * Features:
 * - Checkbox tracking for citizen readiness
 * - Original / Photocopy tags
 * - Mandatory vs Optional badges
 * - Readiness score & verification tips
 */
export default function DocumentChecklist({
  documents = [],
  serviceName = 'Government Service',
  onChecklistChange = null,
  showTitle = true,
  className = '',
}) {
  const [checkedItems, setCheckedItems] = useState({});

  const toggleCheck = (idx) => {
    const nextState = {
      ...checkedItems,
      [idx]: !checkedItems[idx],
    };
    setCheckedItems(nextState);
    if (onChecklistChange) {
      const readyCount = documents.filter((_, i) => nextState[i]).length;
      onChecklistChange({
        checkedMap: nextState,
        readyCount,
        totalCount: documents.length,
        isAllMandatoryReady: documents
          .filter((d) => d.mandatory)
          .every((_, i) => nextState[i]),
      });
    }
  };

  const totalDocs = documents.length;
  const readyDocs = documents.filter((_, idx) => checkedItems[idx]).length;
  const mandatoryDocs = documents.filter((d) => d.mandatory);
  const mandatoryReady = mandatoryDocs.filter((d, i) => checkedItems[documents.indexOf(d)]).length;
  const percentReady = totalDocs > 0 ? Math.round((readyDocs / totalDocs) * 100) : 0;

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      {showTitle && (
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900/60 text-blue-200 border border-blue-700/50 mb-1.5">
              📋 Official Document Checklist
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Documents Required for {serviceName}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Tick items as you arrange them to avoid rejection or multiple visits.
            </p>
          </div>

          {/* Readiness Tracker */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-right sm:min-w-[140px]">
            <div className="text-xs text-slate-400 font-medium">Readiness</div>
            <div className="text-xl font-black text-emerald-400">
              {readyDocs} <span className="text-xs text-slate-400 font-normal">/ {totalDocs} ready</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${percentReady}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Advisory Banner */}
      <div className="bg-amber-50 border-b border-amber-200/80 px-5 py-3 flex items-start gap-3">
        <span className="text-base mt-0.5">⚠️</span>
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong>Official Rule:</strong> Always carry <strong>original documents</strong> for physical verification at the Kendra. Photocopies must be legible and self-attested with citizen signature.
        </div>
      </div>

      {/* Checklist items */}
      <div className="divide-y divide-slate-100">
        {documents.map((doc, idx) => {
          const isChecked = !!checkedItems[idx];
          return (
            <div
              key={idx}
              onClick={() => toggleCheck(idx)}
              className={`p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4 transition-colors cursor-pointer select-none ${
                isChecked ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-slate-50'
              }`}
            >
              {/* Checkbox */}
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}} // Controlled by row click
                  className="w-5 h-5 rounded border-slate-300 text-blue-900 focus:ring-blue-800 cursor-pointer accent-blue-900"
                />
              </div>

              {/* Document details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm font-bold ${isChecked ? 'text-slate-900 line-through opacity-75' : 'text-slate-900'}`}>
                    {doc.title}
                  </span>

                  {/* Mandatory Badge */}
                  {doc.mandatory ? (
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                      Mandatory
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-700">
                      Optional / Alternative
                    </span>
                  )}

                  {/* Original Required Badge */}
                  {doc.isOriginalRequired && (
                    <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                      Original Required
                    </span>
                  )}

                  {/* Photocopy Required Badge */}
                  {doc.isPhotocopyRequired && (
                    <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      1 Self-Attested Copy
                    </span>
                  )}
                </div>

                {/* Notes & instructions */}
                {doc.notes && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    💡 {doc.notes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer advice */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>
          {mandatoryReady === mandatoryDocs.length ? (
            <span className="text-emerald-700 font-semibold">✓ All {mandatoryDocs.length} mandatory documents ready</span>
          ) : (
            <span className="text-slate-600">
              Need {mandatoryDocs.length - mandatoryReady} more mandatory document{mandatoryDocs.length - mandatoryReady > 1 ? 's' : ''}
            </span>
          )}
        </span>
        <span className="text-[11px] text-slate-400">
          SHEWWINA document facilitation checklist is advisory. Requirements subject to Kendra rules.
        </span>
      </div>
    </div>
  );
}
