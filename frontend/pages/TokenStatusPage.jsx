import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTokenStatus, cancelQueueTokenApi } from '../services/api';
import { subscribeQueueRealtime } from '../services/realtime';
import { playCounterChime, unlockAudio } from '../utils/audioChime';
import { useAuth } from '../context/AuthContext';
import LogoMark from '../components/LogoMark';

// Phase 2 UI Primitives
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

export default function TokenStatusPage() {
  const { tokenId } = useParams();
  const { isAuthenticated, isCustomer } = useAuth();

  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [cancelFeedback, setCancelFeedback] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const hasPlayedChimeRef = useRef(false);
  const isTerminalRef = useRef(false);

  const fetchTokenStatus = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setErrorMessage(null);

    try {
      const res = await getTokenStatus(tokenId);
      const data = res.data;
      setTokenData(data);

      // Stop polling fallback if terminal state is reached
      if (data?.status && ['SERVED', 'CANCELLED', 'SKIPPED'].includes(data.status)) {
        isTerminalRef.current = true;
      }

      // Audio notification trigger: chime when customer is called to SERVING
      if (data?.status === 'SERVING' && !hasPlayedChimeRef.current && soundEnabled) {
        hasPlayedChimeRef.current = true;
        playCounterChime();
      }

      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      setErrorMessage(err.message || 'Unable to fetch token status.');
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Realtime Subscription & Polling Fallback
  useEffect(() => {
    isTerminalRef.current = false;
    hasPlayedChimeRef.current = false;

    fetchTokenStatus();

    // 1. Realtime SSE subscription
    const unsubscribe = subscribeQueueRealtime({
      tokenId,
      onUpdate: () => {
        fetchTokenStatus(false);
      },
    });

    // 2. Resilient Polling Fallback (stops when isTerminalRef is true)
    const interval = setInterval(() => {
      if (isTerminalRef.current) {
        clearInterval(interval);
        return;
      }
      getTokenStatus(tokenId)
        .then((res) => {
          const data = res.data;
          setTokenData(data);
          if (data?.status && ['SERVED', 'CANCELLED', 'SKIPPED'].includes(data.status)) {
            isTerminalRef.current = true;
          }
          if (data?.status === 'SERVING' && !hasPlayedChimeRef.current && soundEnabled) {
            hasPlayedChimeRef.current = true;
            playCounterChime();
          }
        })
        .catch(() => {});
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenId]);

  const handleCancelToken = async () => {
    setCancelling(true);
    setCancelFeedback(null);
    setShowConfirmModal(false);

    try {
      await cancelQueueTokenApi(tokenId);
      setTokenData((prev) => (prev ? { ...prev, status: 'CANCELLED', peopleAhead: 0, estimatedWaitMinutes: 0 } : null));
      setCancelFeedback('Your queue token has been cancelled successfully.');
      setCancelling(false);
    } catch (err) {
      setCancelFeedback(`Cancellation failed: ${err.message}`);
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Verifying Digital Waiting Pass...</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !tokenData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 border border-slate-200 text-center space-y-4 shadow-xl">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-bold text-slate-900">Token Not Found</h1>
          <p className="text-xs text-slate-500 leading-relaxed">{errorMessage}</p>
          <div className="pt-4 flex flex-col gap-2">
            <Button
              variant="primary"
              onClick={() => fetchTokenStatus(true)}
              className="w-full"
            >
              Try Again
            </Button>
            <Link
              to="/"
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors block text-center"
            >
              Back to Shewwina Home
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const isWaiting = tokenData?.status === 'WAITING';
  const isServing = tokenData?.status === 'SERVING';
  const isServed = tokenData?.status === 'SERVED';
  const isCancelled = tokenData?.status === 'CANCELLED' || tokenData?.status === 'SKIPPED';

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8 selection:bg-indigo-600 selection:text-white">
      {/* Subtle ambient lighting */}
      <div
        className={`absolute inset-0 pointer-events-none transition-all duration-500 ${
          isServing
            ? 'bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(16,185,129,0.12),rgba(255,255,255,0))]'
            : isWaiting
            ? 'bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(245,158,11,0.1),rgba(255,255,255,0))]'
            : 'bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(79,70,229,0.08),rgba(255,255,255,0))]'
        }`}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-md w-full">
        {/* Pass Container */}
        <Card className="bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-200/80 overflow-hidden">

          {/* Top Pass Controls Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <LogoMark className="w-7 h-7" variant={isServing ? 'emerald' : 'blue'} iconSize="w-3.5 h-3.5" />
              <span className="text-xs font-bold font-display text-slate-800 tracking-tight">
                Digital Waiting Pass
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Audio Chime Toggle */}
              <button
                type="button"
                onClick={() => {
                  unlockAudio();
                  playCounterChime();
                  setSoundEnabled((prev) => !prev);
                }}
                title={soundEnabled ? 'Chime sound is ON (Click to test/mute)' : 'Chime is MUTED (Click to enable)'}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium border transition-colors flex items-center gap-1.5 ${
                  soundEnabled
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                    : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-700'
                }`}
              >
                {soundEnabled ? (
                  <svg className="w-3 h-3 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                )}
                <span>{soundEnabled ? 'Chime ON' : 'Muted'}</span>
              </button>

              {/* Manual Refresh */}
              <button
                type="button"
                onClick={() => fetchTokenStatus(true)}
                disabled={refreshing}
                title="Sync Token Status"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Refresh Token"
              >
                <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Cancellation Feedback Banner */}
          {cancelFeedback && (
            <div
              role="status"
              className={`p-3.5 mx-5 mt-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                cancelFeedback.includes('failed')
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <span>{cancelFeedback}</span>
              <button onClick={() => setCancelFeedback(null)} className="font-bold">✕</button>
            </div>
          )}

          {/* Live Status Callout Banner */}
          <div className="p-5 sm:p-6 pb-2 text-center">
            {isServing && (
              <div
                role="alert"
                aria-live="assertive"
                className="mb-4 p-4 rounded-2xl bg-emerald-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-500/25 animate-bounce flex items-center justify-center gap-2"
              >
                <span>🎉</span>
                <span>IT'S YOUR TURN! PROCEED TO COUNTER</span>
              </div>
            )}

            {isWaiting && (
              <div
                role="status"
                aria-live="polite"
                className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {tokenData?.peopleAhead != null && tokenData.peopleAhead <= 2
                    ? "You're getting closer! Please stay nearby."
                    : "You're in the queue! We'll help you keep track of your turn."}
                </span>
              </div>
            )}

            {isServed && (
              <div
                role="status"
                className="mb-4 p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <span>✅</span>
                <span>Service completed. Thank you for your visit!</span>
              </div>
            )}

            {isCancelled && (
              <div
                role="status"
                className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <span>🚫</span>
                <span>Queue token inactive. You have left this queue.</span>
              </div>
            )}

            {/* Central Boarding-Pass Notch Card */}
            <div className="rounded-3xl bg-slate-50/70 border border-slate-200/80 p-6 relative overflow-hidden">
              <div className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-1">
                Your Token Number
              </div>

              <div className="text-5xl sm:text-6xl font-black text-slate-900 font-mono tracking-tight my-2">
                #{tokenData?.tokenNumber || 'S-101'}
              </div>

              <div className="mt-3">
                <Badge
                  variant={
                    isServing
                      ? 'emerald'
                      : isWaiting
                      ? 'amber'
                      : isServed
                      ? 'slate'
                      : 'rose'
                  }
                  size="md"
                  dot={isWaiting || isServing}
                >
                  {tokenData?.status === 'WAITING'
                    ? 'IN QUEUE · WAITING'
                    : tokenData?.status === 'SERVING'
                    ? 'CALLING NOW'
                    : tokenData?.status}
                </Badge>
              </div>

              {/* Subtle Decorative Side Notches */}
              <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200/80" />
              <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200/80" />
            </div>

            {/* Real-time KPI Stats Grid (Visible for WAITING and SERVING) */}
            {(isWaiting || isServing) && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                    People Ahead
                  </span>
                  <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">
                    {tokenData?.peopleAhead ?? 0}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {tokenData?.position ? `Position #${tokenData.position}` : 'In sequence'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider block">
                    Estimated Wait
                  </span>
                  <span className="text-2xl font-black text-indigo-600 font-mono mt-0.5 block">
                    ~{tokenData?.estimatedWaitMinutes ?? 0} <span className="text-xs font-sans font-medium">min</span>
                  </span>
                  {tokenData?.aiEstimatedWaitMinutes != null && isWaiting ? (
                    <span className="text-[10px] text-indigo-600 font-semibold mt-0.5 block">
                      🤖 AI: ~{tokenData.aiEstimatedWaitMinutes} min
                    </span>
                  ) : (
                    <span className="text-[10px] text-indigo-400 mt-0.5 block">
                      Live sync
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Ticket Info Metadata */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-200/70 text-left text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-semibold text-slate-800">{tokenData?.service || 'General Service'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800">{tokenData?.customerName || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-[11px] text-slate-400">
                <span>Real-time Status</span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live updates
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-5 sm:p-6 pt-2 space-y-2.5">
            {/* Cancel Action (WAITING only & authenticated customer) */}
            {isWaiting && isAuthenticated && isCustomer && (
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowConfirmModal(true)}
                disabled={cancelling}
                className="w-full text-rose-700 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
              >
                {cancelling ? 'Cancelling Token...' : 'Cancel My Waiting Token'}
              </Button>
            )}

            {isAuthenticated && isCustomer && (
              <Link
                to="/customer/dashboard"
                className="block w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs text-center border border-indigo-200/80 transition-colors"
              >
                View Customer Dashboard →
              </Link>
            )}

            <Link
              to="/"
              className="block w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl text-xs text-center transition-colors"
            >
              Back to Shewwina Home
            </Link>
          </div>

        </Card>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Cancel Queue Token?"
        description={`Are you sure you want to leave the queue? You will forfeit token #${tokenData?.tokenNumber} and your position in line.`}
        maxWidth="max-w-xs"
      >
        <div className="flex gap-2 pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowConfirmModal(false)}
            className="w-1/2"
          >
            Keep Token
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleCancelToken}
            className="w-1/2"
          >
            Yes, Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
