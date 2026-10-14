import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { getPublicQueueDisplayApi } from '../services/api';
import { subscribeQueueRealtime } from '../services/realtime';
import { playCounterChime, unlockAudio } from '../utils/audioChime';
import { getIndustryConfig } from '../config/industryTerminology';
import LogoMark from '../components/LogoMark';

/**
 * PublicDisplayPage — Phase 7 Public Live Waiting Room & TV Queue Screen Redesign
 *
 * Dedicated digital signage view designed for Smart TVs, reception monitors, tablets,
 * and high-visibility lobby kiosks.
 *
 * Primary Objectives:
 * - Ultra-high distance readability (legible from 4-6 meters).
 * - Dominant NOW SERVING token spotlight with "Your Turn" visual attention states.
 * - Clean WAITING queue list with generous spacing and privacy protection (zero phone numbers or IDs).
 * - High-contrast on-screen QR Code for walk-in check-in directly from the waiting room.
 * - Dynamic industry terminology configuration (Salon, Hospital, Clinic, Bank, Gov, etc.).
 * - IST live digital clock & date display.
 * - Resilient realtime sync: SSE + 5-second polling fallback with graceful reconnecting indicator.
 * - Preserved Web Audio API counter chime + voice announcement with autoplay unlock.
 * - Fullscreen toggle with keyboard accessibility and sync across devices.
 */
export default function PublicDisplayPage() {
  const { businessId } = useParams();

  const [displayData, setDisplayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Digital Clock (IST)
  const [currentTime, setCurrentTime] = useState(new Date());

  // Audio & Announcer State
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(true);
  const [servingChanged, setServingChanged] = useState(false);
  const lastServingTokenIdRef = useRef(null);
  const isFirstLoadRef = useRef(true);
  const displayDataRef = useRef(null);

  // Keep displayDataRef in sync
  useEffect(() => {
    displayDataRef.current = displayData;
  }, [displayData]);

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
    if (!isSilent && !displayDataRef.current) {
      setLoading(true);
    }
    try {
      const res = await getPublicQueueDisplayApi(businessId);
      const data = res.data;
      setDisplayData(data);
      setErrorMessage(null);
      setIsReconnecting(false);
      setLoading(false);

      // Check if a new token is being served
      const currentServingId = data?.serving?.tokenId || null;
      if (
        !isFirstLoadRef.current &&
        currentServingId &&
        currentServingId !== lastServingTokenIdRef.current
      ) {
        announceToken(data.serving);
        setServingChanged(true);
        setTimeout(() => setServingChanged(false), 8000);
      }

      lastServingTokenIdRef.current = currentServingId;
      isFirstLoadRef.current = false;
    } catch (err) {
      if (displayDataRef.current) {
        // Non-intrusive background reconnecting status without blanking screen
        setIsReconnecting(true);
      } else {
        setErrorMessage(err.message || 'Unable to connect to live queue display.');
      }
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
        isPublic: true,
        onUpdate: () => {
          if (isMounted) fetchDisplayData(true);
        },
      });
    }

    // 2. Resilient fallback polling every 5 seconds
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

  // Listen for fullscreen change events (e.g. Esc key pressed on keyboard or remote)
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

  // Dynamic industry terminology
  const industry = getIndustryConfig(business?.category);

  // Join URL for the On-Screen QR Code
  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${business?.slug || businessId}`
    : '';

  // Formatted IST Time & Date
  const formattedTime = currentTime.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = currentTime.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Initial Loading Screen
  if (loading && !displayData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h1 className="text-2xl font-bold font-display tracking-tight text-white">
            Connecting to Live Queue Screen
          </h1>
          <p className="text-sm text-slate-400 font-mono">
            {businessId}
          </p>
        </div>
      </div>
    );
  }

  // Initial Error Screen (Only when no prior data exists)
  if (errorMessage && !displayData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center text-2xl mx-auto">
            ⚠️
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold font-display text-rose-400">Display Unavailable</h1>
            <p className="text-sm text-slate-400 leading-relaxed">{errorMessage}</p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => fetchDisplayData(false)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30"
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
        <aside
          aria-label="Audio permission banner"
          className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-700 px-4 py-2 text-center text-xs font-bold text-white flex items-center justify-center gap-3 shadow-md z-50 shrink-0"
        >
          <span>🔊 Sound announcements require browser permission.</span>
          <button
            onClick={handleEnableAudio}
            className="px-3 py-1 bg-white text-indigo-900 text-xs font-black rounded-lg hover:bg-indigo-50 shadow transition-all active:scale-95 cursor-pointer"
          >
            Enable Sound
          </button>
        </aside>
      )}

      {/* ─── Header Bar: Branding, Live Clock & TV Controls ────────────────── */}
      <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800/90 px-6 lg:px-10 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">

        {/* Left: Venue Identity */}
        <div className="flex items-center gap-4">
          <LogoMark className="w-11 h-11 shrink-0" variant="blue" />
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl lg:text-2xl font-black font-display text-white tracking-tight leading-tight">
                {business?.name || 'Shewwina Express Queue'}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${
                  queue?.isOpen
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full motion-reduce:animate-none ${
                    queue?.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                  }`}
                />
                {queue?.isOpen ? 'LIVE' : 'CLOSED'}
              </span>

              {/* Reconnecting Badge (Non-blocking) */}
              {isReconnecting && (
                <span
                  role="status"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping motion-reduce:animate-none" />
                  Reconnecting...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {industry.categoryName} • {business?.city || 'Digital Flow OS'}
              {queue?.name ? ` • ${queue.name}` : ''}
            </p>
          </div>
        </div>

        {/* Right: Digital Clock & Smart TV Controls */}
        <div className="flex items-center gap-3 lg:gap-5">
          {/* Large Readable IST Digital Clock */}
          <div className="text-right font-mono bg-slate-950 border border-slate-800 px-4 py-2 rounded-2xl shadow-inner">
            <div className="text-lg lg:text-2xl font-black text-white tracking-wider">
              {formattedTime}
            </div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5">
              {formattedDate} (IST)
            </div>
          </div>

          {/* Audio Announcer Toggle */}
          <button
            onClick={() => {
              if (needsAudioUnlock) handleEnableAudio();
              setSpeechEnabled(!speechEnabled);
            }}
            title={speechEnabled ? 'Mute voice announcements' : 'Enable voice announcements'}
            aria-label={speechEnabled ? 'Voice announcements enabled' : 'Voice announcements muted'}
            className={`p-2.5 rounded-xl border text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer ${
              speechEnabled && !needsAudioUnlock
                ? 'bg-indigo-950/90 border-indigo-700/80 text-indigo-300 hover:bg-indigo-900'
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
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen TV Mode'}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer"
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
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">

          {/* Giant NOW SERVING Spotlight Card */}
          <section
            aria-label="Currently Serving Token"
            aria-live="polite"
            aria-atomic="true"
            className={`relative rounded-3xl p-8 lg:p-12 border transition-all duration-500 overflow-hidden ${
              serving
                ? servingChanged
                  ? 'bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border-emerald-400 shadow-2xl shadow-emerald-500/20 ring-2 ring-emerald-400/40 motion-safe:animate-pulse motion-reduce:animate-none'
                  : 'bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border-emerald-500/50 shadow-2xl shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                : 'bg-slate-900/70 border-slate-800 text-center py-16'
            }`}
          >
            {/* Top Status Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span
                  className={`w-3.5 h-3.5 rounded-full motion-reduce:animate-none ${
                    serving ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                  }`}
                />
                <span className="text-sm lg:text-base uppercase font-black font-display tracking-widest text-emerald-400">
                  {serving ? 'Now Serving' : 'Queue Status'}
                </span>
                {serving && servingChanged && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-emerald-400 text-slate-950 tracking-wider">
                    Your Turn
                  </span>
                )}
              </div>

              {serving?.calledAt && (
                <div className="text-xs font-mono font-medium text-slate-400">
                  Called at {new Date(serving.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>

            {serving ? (
              <div className="space-y-6">
                {/* Giant Token Number: Legible from 5+ meters */}
                <div className="flex items-baseline gap-4">
                  <span className="text-7xl sm:text-8xl lg:text-9xl font-black font-mono tracking-tight text-white drop-shadow-lg">
                    {serving.tokenNumber.startsWith('#') ? serving.tokenNumber : `#${serving.tokenNumber}`}
                  </span>
                </div>

                {/* Customer Name, Service & Station Details */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-6">
                  <div>
                    <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                      {industry.customerTerm}
                    </div>
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display text-white tracking-tight mt-0.5">
                      {serving.customerName}
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                      {industry.serviceTerm}
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-indigo-300 mt-0.5">
                      {serving.service}
                    </div>
                  </div>
                </div>

                {/* Station & Attention Callout Banner */}
                <div className="mt-4 p-4 rounded-2xl bg-emerald-950/50 border border-emerald-800/80 flex items-center justify-between flex-wrap gap-3 text-emerald-300">
                  <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold">
                    <span className="text-lg">🛎️</span>
                    <span>Please proceed to the {industry.providerTerm || 'counter'}</span>
                  </div>
                  <div className="text-xs font-mono uppercase font-bold bg-emerald-900/60 px-3 py-1 rounded-lg border border-emerald-700/60 text-emerald-200">
                    Active Station
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-5xl text-slate-600">✨</div>
                <h2 className="text-2xl font-bold font-display text-slate-200">
                  Counter is Ready
                </h2>
                <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {waiting.length > 0
                    ? `Next in line will be called shortly. (${waiting.length} waiting)`
                    : 'Queue is currently empty. Scan the QR code to take the first spot.'}
                </p>
              </div>
            )}
          </section>

          {/* On-Screen QR Code Card for Walk-In Registration */}
          <section
            aria-label="Scan to Join Queue"
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl"
          >
            <div className="space-y-2.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <span>📱 Join the Queue</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight">
                Scan to get your digital waiting pass
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
                Scan this QR code with your mobile camera to join without waiting in line. Track live position and receive turn notifications.
              </p>
              <div className="text-[11px] font-mono text-slate-500 truncate max-w-xs pt-1">
                {joinUrl}
              </div>
            </div>

            {/* High-Contrast Vector QR */}
            <div className="bg-white p-3.5 rounded-2xl shadow-2xl border-4 border-slate-800 shrink-0">
              <QRCodeSVG
                value={joinUrl}
                size={144}
                bgColor="#ffffff"
                fgColor="#020617"
                level="M"
                id="tv-display-qr-code"
                aria-label="Scan QR code to join queue"
              />
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: "UP NEXT" Waiting List Column (Col 8-12) ────────── */}
        <div className="lg:col-span-5 xl:col-span-4">
          <section
            aria-label="Upcoming Waiting Tokens"
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col"
          >

            {/* Column Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">📋</span>
                <h2 className="text-base sm:text-lg font-bold font-display text-white tracking-tight">
                  Up Next in Line
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
                {waiting.length} Waiting
              </span>
            </div>

            {/* Waiting List Rows with Generous Typography */}
            {waiting.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-sm space-y-2">
                <div className="text-4xl">🎉</div>
                <p className="font-semibold font-display text-slate-300">The line is clear!</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Queue is currently empty. Scan the QR code to be the first in line.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1.5 dark-scroll">
                {waiting.map((tok, idx) => (
                  <div
                    key={tok.tokenId}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                      idx === 0
                        ? 'bg-amber-950/25 border-amber-500/50 shadow-sm ring-1 ring-amber-500/20'
                        : 'bg-slate-950/60 border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    {/* Position & Token */}
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs font-mono shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950 shadow-sm'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        #{tok.position}
                      </div>
                      <div>
                        <div className="font-mono font-black text-white text-lg sm:text-xl tracking-tight">
                          {tok.tokenNumber.startsWith('#') ? tok.tokenNumber : `#${tok.tokenNumber}`}
                        </div>
                        {/* Masked Customer Name (Rahul S., etc.) */}
                        <div className="text-xs font-semibold text-slate-300">
                          {tok.customerName}
                        </div>
                      </div>
                    </div>

                    {/* Service & Estimated Wait */}
                    <div className="text-right">
                      <div className="text-xs font-medium text-slate-400 truncate max-w-[120px] sm:max-w-[140px]">
                        {tok.service}
                      </div>
                      <div className="text-xs font-bold font-mono text-indigo-400 mt-0.5">
                        ~{tok.estimatedWaitMinutes}m wait
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Realtime Queue Velocity & Load Insights */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <span>Pace:</span>
                <span className="font-bold text-white uppercase">{stats?.loadLevel || 'OPTIMAL'}</span>
              </div>
              {stats?.estimatedClearTimeMinutes > 0 && (
                <div>
                  <span>Est. Clear:</span>{' '}
                  <strong className="text-indigo-400 font-mono">~{stats.estimatedClearTimeMinutes}m</strong>
                </div>
              )}
              <div>
                <span>Total Today:</span>{' '}
                <strong className="text-white font-mono">{stats?.totalTokensToday ?? 0}</strong>
              </div>
            </div>

          </section>
        </div>

      </main>

      {/* ─── Footer: Branding & Real-Time Sync Indicator ─────────────────── */}
      <footer className="bg-slate-900/80 border-t border-slate-800/80 px-6 py-3 flex flex-wrap items-center justify-between text-xs text-slate-400 font-medium shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse motion-reduce:animate-none" />
          <span>Realtime Synchronized (SSE Stream + 5s Polling Fallback)</span>
        </div>
        <div>
          Powered by <strong className="text-slate-200 font-semibold">Shewwina Operating System</strong>
        </div>
      </footer>

    </div>
  );
}
