import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getPublicQueueDisplayApi } from '../services/api';
import { subscribeQueueRealtime } from '../services/realtime';
import { playCounterChime, unlockAudio } from '../utils/audioChime';

/**
 * PublicDisplayPage — Phase 12 Public Live Waiting Room Display & TV Counter Signage
 *
 * Dedicated digital signage view designed for Smart TVs, monitors, and reception kiosks.
 *
 * Privacy & Security Guarantees:
 * - Unauthenticated, read-only: No passwords, JWTs, or admin controls on the TV.
 * - Strict PII Protection: Zero customer phone numbers, zero user IDs.
 * - Customer names are masked (e.g. "Rahul S.").
 *
 * Realtime & Physical Presence:
 * - Connects to SSE (/api/v1/queue/stream) for instant 0ms updates when receptionist calls next.
 * - Dual audio: Pleasant counter bell chime + synthesized speech announcement.
 * - Embedded high-contrast QR code for walk-in check-in directly from the waiting room.
 * - Fullscreen toggle for clean smart TV deployment.
 */
export default function PublicDisplayPage() {
  const { businessId } = useParams();

  const [displayData, setDisplayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Digital Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Audio & Announcer State
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(true);
  const lastServingTokenIdRef = useRef(null);
  const isFirstLoadRef = useRef(true);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Digital Clock Tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Announce Token (Chime + Speech Synthesis)
  const announceToken = useCallback((token) => {
    if (!token) return;

    // 1. Play Counter Chime
    playCounterChime().catch(() => {});

    // 2. Browser Voice Announcement
    if (speechEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // Clear any pending speech
        const text = `Now serving token ${token.tokenNumber}. ${token.customerName}, please proceed to service.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.lang = 'en-IN';
        window.speechSynthesis.speak(utterance);
      } catch (_) {}
    }
  }, [speechEnabled]);

  // Fetch Display Data
  const fetchDisplayData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await getPublicQueueDisplayApi(businessId);
      const data = res.data;
      setDisplayData(data);
      setErrorMessage(null);
      setLoading(false);

      // Check if a new token is being served
      const currentServingId = data?.serving?.tokenId || null;
      if (
        !isFirstLoadRef.current &&
        currentServingId &&
        currentServingId !== lastServingTokenIdRef.current
      ) {
        announceToken(data.serving);
      }

      lastServingTokenIdRef.current = currentServingId;
      isFirstLoadRef.current = false;
    } catch (err) {
      setErrorMessage(err.message || 'Unable to connect to live queue display.');
      setLoading(false);
    }
  }, [businessId, announceToken]);

  // Initial Load & Realtime SSE Subscription
  useEffect(() => {
    let isMounted = true;

    fetchDisplayData(false);

    // 1. Realtime SSE Subscription
    let unsubscribe = () => {};
    if (businessId) {
      unsubscribe = subscribeQueueRealtime({
        businessId,
        onUpdate: () => {
          if (isMounted) fetchDisplayData(true);
        },
      });
    }

    // 2. Fallback polling every 5 seconds
    const interval = setInterval(() => {
      if (isMounted) fetchDisplayData(true);
    }, 5000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(interval);
    };
  }, [businessId, fetchDisplayData]);

  // Unlock Audio on User Gesture
  const handleEnableAudio = async () => {
    const unlocked = await unlockAudio();
    if (unlocked) {
      setAudioEnabled(true);
      setNeedsAudioUnlock(false);
      playCounterChime(); // Audio feedback confirmation
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Listen for fullscreen change events (e.g. Esc key pressed)
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const business = displayData?.business;
  const queue = displayData?.queue;
  const serving = displayData?.serving;
  const waiting = displayData?.waiting || [];
  const stats = displayData?.stats || {};

  // Join URL for the On-Screen QR Code
  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${business?.slug || businessId}`
    : '';

  if (loading && !displayData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h1 className="text-2xl font-bold tracking-tight">Connecting to Live Waiting Room Display...</h1>
          <p className="text-sm text-slate-400 font-mono">Channel: {businessId}</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !displayData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-bold text-rose-400">Display Unavailable</h1>
          <p className="text-sm text-slate-400 leading-relaxed">{errorMessage}</p>
          <div className="pt-2">
            <button
              onClick={() => fetchDisplayData(false)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden selection:bg-transparent">

      {/* ─── Top Banner: Audio Unlock Prompt (if browser blocked sound) ───── */}
      {needsAudioUnlock && (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 px-4 py-2.5 text-center text-xs font-bold text-white flex items-center justify-center gap-3 shadow-md z-50">
          <span>🔊 Audio announcements are paused by browser policy.</span>
          <button
            onClick={handleEnableAudio}
            className="px-3.5 py-1 bg-white text-blue-900 text-xs font-black rounded-lg hover:bg-blue-50 shadow transition-all active:scale-95"
          >
            Enable Sound
          </button>
        </div>
      )}

      {/* ─── Header Bar: Branding, Live Clock & TV Controls ────────────────── */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800/80 px-6 lg:px-10 py-4 flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Venue Identity */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20">
            S
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight leading-tight">
                {business?.name || 'Shewwina Express Queue'}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase border ${
                  queue?.isOpen
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${queue?.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                {queue?.isOpen ? 'LIVE' : 'CLOSED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {business?.category ? `${business.category.toUpperCase()} • ` : ''}
              {business?.city || 'Digital Flow OS'}
              {queue?.name ? ` • Queue: ${queue.name}` : ''}
            </p>
          </div>
        </div>

        {/* Right: Digital Clock & Smart TV Controls */}
        <div className="flex items-center gap-3 lg:gap-5">
          {/* Digital Clock */}
          <div className="text-right font-mono bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-2xl">
            <div className="text-lg lg:text-xl font-black text-white tracking-widest">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Audio Announcer Toggle */}
          <button
            onClick={() => {
              if (needsAudioUnlock) handleEnableAudio();
              setSpeechEnabled(!speechEnabled);
            }}
            title={speechEnabled ? 'Mute voice announcements' : 'Enable voice announcements'}
            className={`p-2.5 rounded-xl border text-sm font-bold transition-colors flex items-center gap-1.5 ${
              speechEnabled && !needsAudioUnlock
                ? 'bg-indigo-950/80 border-indigo-800 text-indigo-300 hover:bg-indigo-900'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span>{speechEnabled && !needsAudioUnlock ? '🔊' : '🔇'}</span>
            <span className="hidden sm:inline text-xs font-semibold">
              {speechEnabled && !needsAudioUnlock ? 'Voice On' : 'Muted'}
            </span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (TV Mode)'}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-sm font-bold transition-colors flex items-center gap-1.5"
          >
            <span>{isFullscreen ? '⤓' : '⛶'}</span>
            <span className="hidden sm:inline text-xs font-semibold">
              {isFullscreen ? 'Exit' : 'TV Mode'}
            </span>
          </button>
        </div>
      </header>

      {/* ─── Main Display Grid ────────────────────────────────────────────── */}
      <main className="flex-1 p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* LEFT COLUMN: Spotlight "NOW SERVING" + On-Screen QR (Col 1-7) ─── */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* Giant NOW SERVING Card */}
          <section
            aria-label="Currently Serving Token"
            className={`relative rounded-3xl p-8 lg:p-12 border transition-all duration-300 ${
              serving
                ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-emerald-500/40 shadow-2xl shadow-emerald-500/10 ring-1 ring-emerald-500/20'
                : 'bg-slate-900/60 border-slate-800 text-center py-16'
            }`}
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${serving ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                <span className="text-xs lg:text-sm uppercase font-black tracking-widest text-emerald-400">
                  Now Serving
                </span>
              </div>
              {serving?.calledAt && (
                <div className="text-xs font-mono font-medium text-slate-400">
                  Called: {new Date(serving.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>

            {serving ? (
              <div className="space-y-4">
                {/* Giant Token Number */}
                <div className="flex items-baseline gap-4">
                  <span className="text-7xl lg:text-9xl font-black font-mono tracking-tight text-white drop-shadow-md">
                    #{serving.tokenNumber}
                  </span>
                </div>

                {/* Customer Name & Service Details */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Client</div>
                    <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                      {serving.customerName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Service</div>
                    <div className="text-lg lg:text-xl font-bold text-indigo-300">
                      {serving.service}
                    </div>
                  </div>
                </div>

                {/* Status Indicator Banner */}
                <div className="mt-4 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-center gap-2 text-emerald-300 text-xs lg:text-sm font-bold">
                  <span>🛎️ Please proceed to the service counter</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-6xl text-slate-600">✨</div>
                <h2 className="text-2xl font-bold text-slate-300">Counter is Ready</h2>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  {waiting.length > 0
                    ? 'Next customer will be called shortly.'
                    : 'No customers currently waiting in the queue.'}
                </p>
              </div>
            )}
          </section>

          {/* On-Screen QR Code Card for Walk-In Joining */}
          <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950 border border-blue-800 text-blue-300 text-xs font-bold uppercase tracking-wider">
                <span>📱 Scan to Join</span>
              </div>
              <h2 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight">
                Skip the Physical Line
              </h2>
              <p className="text-xs lg:text-sm text-slate-400 max-w-sm leading-relaxed">
                Scan this QR code with your phone camera to register and track your place in the live digital queue.
              </p>
              <div className="text-[11px] font-mono text-slate-500 truncate max-w-xs pt-1">
                {joinUrl}
              </div>
            </div>

            {/* High-Contrast Vector QR */}
            <div className="bg-white p-3.5 rounded-2xl shadow-xl border-4 border-slate-800 shrink-0">
              <QRCodeSVG
                value={joinUrl}
                size={140}
                bgColor="#ffffff"
                fgColor="#020617"
                level="M"
                id="tv-display-qr-code"
              />
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: "UP NEXT" Waiting List Column (Col 8-12) ────────── */}
        <div className="lg:col-span-5">
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-7 shadow-2xl flex flex-col">
            
            {/* Column Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">📋</span>
                <h2 className="text-base lg:text-lg font-bold text-white tracking-tight">
                  Up Next in Line
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
                {waiting.length} Waiting
              </span>
            </div>

            {/* Waiting List Rows */}
            {waiting.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm space-y-2">
                <div className="text-4xl">🎉</div>
                <p className="font-semibold text-slate-400">The line is clear!</p>
                <p className="text-xs">Scan the QR code to be the first in line.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {waiting.map((tok, idx) => (
                  <div
                    key={tok.tokenId}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                      idx === 0
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Position & Token */}
                    <div className="flex items-center gap-3.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs font-mono ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        #{tok.position}
                      </div>
                      <div>
                        <div className="font-mono font-black text-white text-base lg:text-lg">
                          #{tok.tokenNumber}
                        </div>
                        <div className="text-xs font-semibold text-slate-300">
                          {tok.customerName}
                        </div>
                      </div>
                    </div>

                    {/* Service & Wait Time */}
                    <div className="text-right">
                      <div className="text-xs font-medium text-slate-400 truncate max-w-[120px]">
                        {tok.service}
                      </div>
                      <div className="text-xs font-bold font-mono text-blue-400 mt-0.5">
                        ~{tok.estimatedWaitMinutes}m wait
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AI Queue Insights Badge */}
            {stats && (
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-medium">
                <div className="flex items-center gap-2">
                  <span>Speed:</span>
                  <span className="font-bold text-white uppercase">{stats.loadLevel || 'OPTIMAL'}</span>
                </div>
                <div>
                  <span>Total Today:</span>{' '}
                  <strong className="text-white font-mono">{stats.totalTokensToday ?? 0}</strong>
                </div>
              </div>
            )}

          </section>
        </div>

      </main>

      {/* ─── Footer: Branding & Real-Time Sync Indicator ─────────────────── */}
      <footer className="bg-slate-900/60 border-t border-slate-800/60 px-6 py-3 flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Realtime Synchronized (SSE + 5s Polling Fallback)</span>
        </div>
        <div>
          Powered by <strong className="text-slate-300 font-semibold">Shewwina Operating System</strong>
        </div>
      </footer>

    </div>
  );
}
