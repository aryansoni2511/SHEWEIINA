import React, { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';

/**
 * QRPanel — Customer Entry QR Code for Business Dashboard (Phase 10)
 *
 * Reads businessId from the authenticated user's JWT payload via useAuth().
 * Computes the public join URL from window.location.origin so it works
 * on localhost AND any deployed domain without hardcoding.
 *
 * Security guarantees:
 * - Encodes only the public businessId (already visible in the URL when customers join)
 * - No JWT, session, credentials, or PII encoded in QR
 * - Business owner only sees their own QR (businessId sourced from their auth token)
 */
export default function QRPanel({ onClose, businessDisplayName }) {
  const { user } = useAuth();
  const businessId = user?.businessId || '';
  // businessDisplayName is passed in from the dashboard (from live queueData.business.name)
  // Fallback to user.name then generic label
  const businessName = businessDisplayName || user?.name || 'Your Business';

  // Build the customer join URL using the current host — production-safe
  const joinUrl = businessId
    ? `${window.location.origin}/join/${businessId}`
    : '';

  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
    } catch {
      // Fallback for browsers blocking clipboard API
      const el = document.createElement('textarea');
      el.value = joinUrl;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [joinUrl]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (!businessId) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center">
          <p className="text-rose-400 text-sm font-semibold">
            Business ID not found. Please log in again.
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ─── Print Styles — only active during window.print() ─────────────────── */}
      <style>{`
        @media print {
          body > *:not(.shewwina-print-poster) { display: none !important; }
          .shewwina-print-poster {
            display: flex !important;
            position: fixed !important;
            inset: 0 !important;
            align-items: center !important;
            justify-content: center !important;
            background: white !important;
            z-index: 99999 !important;
          }
        }
        .shewwina-print-poster { display: none; }
      `}</style>

      {/* ─── Print Poster (screen-hidden, print-visible) ───────────────────────── */}
      <div className="shewwina-print-poster" aria-hidden="true">
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '56px 48px', background: 'white',
          borderRadius: '24px', maxWidth: '440px', width: '100%',
          border: '2px solid #e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.15em', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
            Shewwina
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginBottom: '4px', textAlign: 'center', lineHeight: 1.2 }}>
            {businessName}
          </div>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px', textAlign: 'center' }}>
            Skip the waiting room
          </div>
          <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '3px solid #0f172a' }}>
            <QRCodeSVG value={joinUrl} size={220} bgColor="#ffffff" fgColor="#0f172a" level="M" />
          </div>
          <div style={{ marginTop: '28px', fontSize: '24px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.02em' }}>
            Scan to Join Queue
          </div>
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#94a3b8', wordBreak: 'break-all', textAlign: 'center', maxWidth: '340px', lineHeight: 1.4 }}>
            {joinUrl}
          </div>
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', width: '100%', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>
            Powered by Shewwina — India's Waiting Platform
          </div>
        </div>
      </div>

      {/* ─── Dashboard Modal ─────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">

          {/* Close button */}
          <button
            onClick={onClose}
            id="qr-panel-close"
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-lg font-bold"
            aria-label="Close QR panel"
          >
            ✕
          </button>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-xl shrink-0">
                📱
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">Customer QR Code</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Display or print so customers can scan and join your queue directly.
                </p>
              </div>
            </div>
          </div>

          {/* QR Code Display */}
          <div className="flex flex-col items-center bg-white rounded-2xl p-6 mb-5 shadow-inner">
            <QRCodeSVG
              value={joinUrl}
              size={200}
              bgColor="#ffffff"
              fgColor="#0f172a"
              level="M"
              id="business-qr-code"
            />
            <p className="mt-3 text-[11px] text-slate-400 font-mono text-center break-all max-w-[220px]">
              {joinUrl}
            </p>
          </div>

          {/* Business Badge */}
          <div className="mb-5 px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Business</div>
              <div className="text-sm font-bold text-white">{businessName}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400">Live Queue</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              id="qr-copy-url"
              onClick={handleCopy}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                copied
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
              }`}
            >
              <span className="text-lg">{copied ? '✅' : '📋'}</span>
              <span>{copied ? 'Copied!' : 'Copy URL'}</span>
            </button>

            <a
              id="qr-open-link"
              href={joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white text-xs font-semibold transition-all no-underline"
            >
              <span className="text-lg">🔗</span>
              <span>Open Link</span>
            </a>

            <button
              id="qr-print-poster"
              onClick={handlePrint}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white text-xs font-semibold transition-all"
            >
              <span className="text-lg">🖨️</span>
              <span>Print Poster</span>
            </button>
          </div>

          {/* Security Notice */}
          <div className="px-4 py-3 rounded-xl bg-blue-950/30 border border-blue-900/40">
            <p className="text-[11px] text-blue-300/80 leading-relaxed">
              <span className="font-bold text-blue-300">🔒 Safe to share publicly.</span>{' '}
              This QR only contains your public queue link — no credentials, tokens, or customer data.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
