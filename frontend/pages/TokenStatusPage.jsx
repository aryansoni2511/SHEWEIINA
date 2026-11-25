import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTokenStatus, cancelQueueTokenApi } from '../services/api';
import { subscribeQueueRealtime } from '../services/realtime';
import { playCounterChime, unlockAudio } from '../utils/audioChime';
import { useAuth } from '../context/AuthContext';
import Navbar from '../Navbar';
import FooterSection from '../FooterSection';
import DigitalTokenPass from '../components/DigitalTokenPass';

// Phase 1 UI Primitives
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';

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
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const hasPlayedChimeRef = useRef(false);
  const isTerminalRef = useRef(false);

  const fetchTokenStatus = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setErrorMessage(null);

    try {
      const res = await getTokenStatus(tokenId);
      const data = res.data;
      setTokenData(data);
      setLastRefreshed(new Date());

      // Stop polling fallback if terminal state is reached
      if (data?.status && ['SERVED', 'COMPLETED', 'CANCELLED', 'SKIPPED'].includes(data.status)) {
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

    // 2. Resilient Polling Fallback (every 6s; stops when isTerminalRef is true)
    const interval = setInterval(() => {
      if (isTerminalRef.current) {
        clearInterval(interval);
        return;
      }
      getTokenStatus(tokenId)
        .then((res) => {
          const data = res.data;
          setTokenData(data);
          setLastRefreshed(new Date());
          if (data?.status && ['SERVED', 'COMPLETED', 'CANCELLED', 'SKIPPED'].includes(data.status)) {
            isTerminalRef.current = true;
          }
          if (data?.status === 'SERVING' && !hasPlayedChimeRef.current && soundEnabled) {
            hasPlayedChimeRef.current = true;
            playCounterChime();
          }
        })
        .catch(() => {});
    }, 6000);

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

  const handleToggleSound = () => {
    unlockAudio();
    if (!soundEnabled) {
      playCounterChime();
    }
    setSoundEnabled((prev) => !prev);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans selection:bg-[#171717] selection:text-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#171717] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-[#171717]">Verifying Digital Token Pass...</p>
            <p className="text-xs text-[#78716C]">Connecting to Shewwina live queue sync</p>
          </div>
        </main>
        <FooterSection />
      </div>
    );
  }

  if (errorMessage && !tokenData) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans selection:bg-[#171717] selection:text-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#E7E3DC] rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 bg-[#FAF8F5] border border-[#E7E3DC] rounded-2xl flex items-center justify-center mx-auto text-xl">
              🎫
            </div>
            <h1 className="text-xl font-bold text-[#171717] font-editorial">Token Not Found</h1>
            <p className="text-xs text-[#78716C] leading-relaxed">
              {errorMessage || 'This queue token reference is invalid or has expired.'}
            </p>
            <div className="pt-3 flex flex-col gap-2">
              <Button
                variant="primary"
                onClick={() => fetchTokenStatus(true)}
                className="w-full"
              >
                Try Again
              </Button>
              <Link
                to="/explore"
                className="w-full py-2.5 bg-[#FAF8F5] hover:bg-[#F5F2EB] text-[#171717] border border-[#E7E3DC] font-semibold rounded-xl text-xs transition-colors block text-center"
              >
                Explore Services &amp; Find a Queue
              </Link>
            </div>
          </div>
        </main>
        <FooterSection />
      </div>
    );
  }

  const moduleType = (tokenData?.businessCategory || 'salon').toLowerCase();

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans selection:bg-[#171717] selection:text-white">
      <Navbar />

      <main className="flex-1 py-6 sm:py-12 px-3 sm:px-6 lg:px-8 pb-28 lg:pb-12">
        <div className="max-w-md mx-auto space-y-4">

          {/* Cancellation Feedback Message */}
          {cancelFeedback && (
            <div
              role="status"
              className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn ${
                cancelFeedback.includes('failed')
                  ? 'bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B]'
                  : 'bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]'
              }`}
            >
              <span>{cancelFeedback}</span>
              <button
                type="button"
                onClick={() => setCancelFeedback(null)}
                className="font-bold text-sm px-1"
                aria-label="Dismiss feedback"
              >
                ✕
              </button>
            </div>
          )}

          {/* Mobile-First Royal Blue Digital Token Pass */}
          <DigitalTokenPass
            module={moduleType}
            tokenNumber={tokenData?.tokenNumber}
            status={tokenData?.status}
            position={tokenData?.position}
            peopleAhead={tokenData?.peopleAhead}
            estimatedWaitMinutes={tokenData?.estimatedWaitMinutes}
            aiEstimatedWaitMinutes={tokenData?.aiEstimatedWaitMinutes}
            currentlyServing={tokenData?.currentlyServing || tokenData?.currentlyServingToken || (tokenData?.status === 'SERVING' ? tokenData?.tokenNumber : null)}
            customerPhone={tokenData?.customerPhone}
            providerName={tokenData?.businessName || 'Shewwina Express Queue'}
            providerAddress={tokenData?.businessAddress}
            providerPhone={tokenData?.businessPhone}
            serviceName={tokenData?.service}
            customerName={tokenData?.customerName}
            qrValue={typeof window !== 'undefined' ? `${window.location.origin}/token/${tokenId}` : ''}
            lastRefreshed={lastRefreshed}
            isRefreshing={refreshing}
            onRefresh={() => fetchTokenStatus(true)}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            canCancel={Boolean(isAuthenticated && isCustomer)}
            isCancelling={cancelling}
            onCancel={() => setShowConfirmModal(true)}
            dashboardLink={isAuthenticated && isCustomer ? '/customer/dashboard' : null}
            backLink={{ to: '/explore', label: 'Explore Other Services' }}
          />

        </div>
      </main>

      <FooterSection />

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Cancel Queue Token?"
        description={`Are you sure you want to leave the queue? You will forfeit token #${tokenData?.tokenNumber} and your position in line.`}
        maxWidth="max-w-xs"
      >
        <div className="flex gap-2 pt-3">
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
