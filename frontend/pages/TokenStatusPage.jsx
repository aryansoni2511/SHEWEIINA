import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTokenStatus, cancelQueueTokenApi } from '../services/api';
import { subscribeQueueRealtime } from '../services/realtime';
import { playCounterChime, unlockAudio } from '../utils/audioChime';
import { useAuth } from '../context/AuthContext';

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
  // Stable ref for terminal-state tracking inside the polling closure.
  // Using a ref (not state) avoids stale closure issues without extra renders.
  const isTerminalRef = useRef(false);

  const fetchTokenStatus = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setErrorMessage(null);

    try {
      const res = await getTokenStatus(tokenId);
      const data = res.data;
      setTokenData(data);

      // Mark terminal so polling fallback stops on its next tick.
      if (data?.status && ['SERVED', 'CANCELLED', 'SKIPPED'].includes(data.status)) {
        isTerminalRef.current = true;
      }

      // Audio notification trigger: when status is SERVING and hasn't chimed yet
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

  // Initial Fetch, Realtime Subscription & Polling Fallback
  useEffect(() => {
    // Reset per-token refs whenever tokenId changes (e.g. user navigates to a new token).
    isTerminalRef.current = false;
    hasPlayedChimeRef.current = false;

    // Initial data fetch on mount / tokenId change.
    fetchTokenStatus();

    // 1. Realtime SSE subscription: instantly updates token on queue events.
    // The subscription is kept alive for the full lifetime of this tokenId.
    // It is NOT torn down on status changes — doing so caused a race condition
    // where isMounted became false before the async fetch resolved, silently
    // suppressing the state update that shows SERVING to the customer.
    const unsubscribe = subscribeQueueRealtime({
      tokenId,
      onUpdate: () => {
        // No isMounted guard here. fetchTokenStatus is safe to call after
        // unmount (React 18 suppresses the harmless no-op warning) and the
        // freshly mounted effect's subscription handles subsequent events.
        fetchTokenStatus(false);
      },
    });

    // 2. Resilient Polling Fallback: runs every 5 s in case SSE is interrupted.
    // Uses isTerminalRef (a stable ref) instead of tokenData (a stale closure)
    // to decide when to stop — avoids the original stale-closure bug.
    const interval = setInterval(() => {
      if (isTerminalRef.current) {
        clearInterval(interval);
        return;
      }
      getTokenStatus(tokenId)
        .then((res) => {
          const data = res.data;
          setTokenData(data);
          // Mark terminal so the next tick short-circuits cleanly.
          if (data?.status && ['SERVED', 'CANCELLED', 'SKIPPED'].includes(data.status)) {
            isTerminalRef.current = true;
          }
          // Audio chime (reads soundEnabled from the live closure — still valid
          // because soundEnabled is state, not a stale capture from this effect).
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
  // Effect is intentionally scoped to tokenId only:
  // - soundEnabled is read directly inside fetchTokenStatus (not a dep of this effect)
  // - tokenData?.status must NOT be a dep — it would teardown/recreate the SSE
  //   subscription on every status change, causing the isMounted race condition.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenId]);

  const handleCancelToken = async () => {
    setCancelling(true);
    setCancelFeedback(null);
    setShowConfirmModal(false);

    try {
      const res = await cancelQueueTokenApi(tokenId);
      setTokenData((prev) => (prev ? { ...prev, status: 'CANCELLED', peopleAhead: 0, estimatedWaitMinutes: 0 } : null));
      setCancelFeedback('Token cancelled successfully.');
      setCancelling(false);
    } catch (err) {
      setCancelFeedback(`Cancellation failed: ${err.message}`);
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-400">Fetching Your Live Token Status...</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !tokenData) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 border border-slate-700 text-center space-y-4">
          <div className="text-4xl mb-2">⚠️</div>
          <h1 className="text-xl font-bold text-slate-100">Token Not Found</h1>
          <p className="text-xs text-slate-400 leading-relaxed">{errorMessage}</p>
          <div className="pt-4 flex flex-col gap-2">
            <button
              onClick={() => fetchTokenStatus(true)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Try Again
            </button>
            <Link
              to="/"
              className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded-xl text-sm transition-colors block"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isWaiting = tokenData?.status === 'WAITING';
  const isServing = tokenData?.status === 'SERVING';
  const isServed = tokenData?.status === 'SERVED';
  const isCancelled = tokenData?.status === 'CANCELLED' || tokenData?.status === 'SKIPPED';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-blue-600 selection:text-white">
      <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl text-center relative overflow-hidden">
        
        {/* Subtle Ambient Glow */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none blur-3xl opacity-20 ${
            isServing ? 'bg-emerald-500' : isServed ? 'bg-blue-500' : isCancelled ? 'bg-rose-500' : 'bg-amber-500'
          }`}
        />

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
          <span className="text-xs font-mono text-slate-400">Shewwina Live Token</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                unlockAudio();
                playCounterChime();
                setSoundEnabled((prev) => !prev);
              }}
              title={soundEnabled ? 'Sound is ON (Click to toggle/test)' : 'Sound is MUTED (Click to enable)'}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition-colors flex items-center gap-1 ${
                soundEnabled
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{soundEnabled ? '🔔 Sound ON' : '🔕 Muted'}</span>
            </button>
            <button
              onClick={() => fetchTokenStatus(true)}
              disabled={refreshing}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <span className={refreshing ? 'animate-spin' : ''}>🔄</span> Refresh
            </button>
          </div>
        </div>

        {/* Action / Feedback Alert */}
        {cancelFeedback && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
              cancelFeedback.includes('failed')
                ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
            }`}
          >
            <span>{cancelFeedback}</span>
            <button onClick={() => setCancelFeedback(null)} className="font-bold ml-2">✕</button>
          </div>
        )}

        {/* Token Status Banner */}
        {isServing && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-pulse">
            🎉 IT'S YOUR TURN! Please proceed to the service desk.
          </div>
        )}

        {isServed && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
            ✅ Service Completed. Thank you for using Shewwina!
          </div>
        )}

        {isCancelled && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-semibold">
            ❌ Token Cancelled. You have left this queue.
          </div>
        )}

        {/* Main Token Display */}
        <div className="my-2">
          <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
            Token Number
          </div>
          <div className="text-6xl font-black text-white font-mono tracking-wider">
            #{tokenData?.tokenNumber || 'S-101'}
          </div>
        </div>

        {/* Status Badge */}
        <div className="my-4">
          <span
            className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
              isServing
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : isServed
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                : isCancelled
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
            }`}
          >
            STATUS: {tokenData?.status || 'WAITING'}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 my-6">
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">People Ahead</div>
            <div className="text-2xl font-extrabold text-white font-mono mt-1">
              {tokenData?.peopleAhead ?? 0}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-800 text-center relative">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estimated Wait</div>
            <div className="text-2xl font-extrabold text-blue-400 font-mono mt-1">
              {tokenData?.estimatedWaitMinutes ?? 0} <span className="text-xs text-slate-400 font-normal">min</span>
            </div>
            {tokenData?.aiEstimatedWaitMinutes != null && isWaiting && (
              <div className="mt-1.5 text-[10px] font-semibold text-indigo-300 bg-indigo-950/70 border border-indigo-800/60 rounded-lg py-0.5 px-2 inline-flex items-center gap-1">
                <span>🤖 AI Wait: ~{tokenData.aiEstimatedWaitMinutes} min</span>
              </div>
            )}
          </div>
        </div>

        {/* Customer & Service Info Card */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 text-left text-xs space-y-2 mb-6 text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-500">Customer:</span>
            <span className="font-semibold text-slate-200">{tokenData?.customerName || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Service:</span>
            <span className="font-semibold text-slate-200">{tokenData?.service || 'General Service'}</span>
          </div>
          <div className="flex justify-between border-t border-slate-800 pt-2 text-[11px] text-slate-500">
            <span>Auto-Refreshing</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Live (5s)
            </span>
          </div>
        </div>

        {/* Cancel Queue Action (Only for WAITING status) */}
        {isWaiting && isAuthenticated && isCustomer && (
          <div className="mb-4">
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={cancelling}
              className="w-full py-3 bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-semibold border border-rose-800/80 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
            >
              {cancelling ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
                  <span>Cancelling Token...</span>
                </>
              ) : (
                <span>🚫 Cancel My Queue Token</span>
              )}
            </button>
          </div>
        )}

        {/* Return Button */}
        <div className="space-y-2">
          {isAuthenticated && isCustomer && (
            <Link
              to="/customer/dashboard"
              className="block w-full py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-semibold rounded-xl text-sm border border-blue-500/30 transition-colors mb-2"
            >
              My Customer Dashboard
            </Link>
          )}
          <Link
            to="/"
            className="block w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl">
              <div className="text-3xl">⚠️</div>
              <h3 className="text-base font-bold text-white">Cancel Queue Token?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to cancel token <strong className="text-white">#{tokenData?.tokenNumber}</strong>? You will lose your position in line.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Keep Token
                </button>
                <button
                  onClick={handleCancelToken}
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

