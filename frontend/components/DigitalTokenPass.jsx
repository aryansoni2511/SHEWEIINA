import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';
import LogoMark from './LogoMark';
import Badge, { StatusBadge } from './ui/Badge';
import Button from './ui/Button';
import {
  Volume2,
  VolumeX,
  RefreshCw,
  Check,
  CheckCircle2,
  Clock,
  Users,
  Bell,
  MessageSquare,
  ShieldCheck,
  Printer,
  XCircle,
  AlertTriangle,
  Radio,
} from 'lucide-react';

/**
 * SHEWWINA Mobile-First Royal Blue Digital Token Pass
 *
 * Visual Target: High-contrast royal-blue card (#2563EB / #1D4ED8),
 * large white typography, live queue metrics (People Ahead, Currently Serving,
 * Estimated Wait), dynamic milestone progress tracker, and clean notification preferences.
 *
 * Supported industry modules:
 * - 'hospital': OPD Consultation Pass (Doctor, Cabin, Department, Patient Code)
 * - 'government': Citizen Facilitation Pass (Counter, Desk, Operator, Fee Breakdown)
 * - 'clinic': Clinic Consultation Pass (Doctor/Consultant, Service, Room)
 * - 'salon' | 'business': Express Waiting Pass (Service, Specialist, Wait Time)
 */
export default function DigitalTokenPass({
  module = 'business',
  tokenNumber,
  status = 'WAITING',
  position = 1,
  peopleAhead = 0,
  estimatedWaitMinutes = 0,
  aiEstimatedWaitMinutes = null,
  currentlyServing = null,
  customerPhone = '',

  // Provider context
  providerName = 'Shewwina Provider',
  providerSubtitle = '',
  providerAddress = '',
  providerPhone = '',

  // Service context
  serviceName = '',
  serviceCategory = '',

  // Person context
  customerName = '',
  customerCode = '',

  // Assigned operator / doctor / desk context
  assignedTo = null, // { title: 'Attending Consultant', name: 'Dr. Sharma', subtitle: 'MBBS, MD', room: 'Cabin 104' }

  // Statutory Fees (Government Module)
  fees = null, // { officialFee: 0, facilitationFee: 25, note: 'Payable at desk' }

  // Realtime & Sync States
  qrValue = '',
  lastRefreshed = null,
  isRefreshing = false,
  onRefresh = null,
  soundEnabled = true,
  onToggleSound = null,

  // Actions
  canCancel = false,
  isCancelling = false,
  onCancel = null,
  backLink = null, // { to: '/explore', label: 'Explore Services' }
  dashboardLink = '/customer/dashboard',
  showFullActions = true,
}) {
  const normStatus = (status || 'WAITING').toUpperCase();
  const isServing = normStatus === 'SERVING';
  const isWaiting = normStatus === 'WAITING';
  const isCompleted = normStatus === 'SERVED' || normStatus === 'COMPLETED';
  const isSkipped = normStatus === 'SKIPPED';
  const isCancelled = normStatus === 'CANCELLED';
  const isAlmostTurn = isWaiting && peopleAhead != null && peopleAhead <= 2;

  // Industry-specific header badge & theme accents
  const getModuleBadge = () => {
    switch (module) {
      case 'hospital':
        return { label: 'Hospital OPD Pass', icon: '🩺' };
      case 'government':
        return { label: 'Citizen Facilitation Pass', icon: '🏛️' };
      case 'clinic':
        return { label: 'Clinic Consultation Pass', icon: '🩺' };
      case 'salon':
        return { label: 'Salon Express Pass', icon: '✂️' };
      default:
        return { label: 'Live Digital Token Pass', icon: '🎫' };
    }
  };

  const moduleInfo = getModuleBadge();

  // Resolve currently serving token display value
  const resolveCurrentlyServing = () => {
    if (isServing) {
      return tokenNumber || 'Your Token';
    }
    if (currentlyServing) {
      return currentlyServing;
    }
    if (isWaiting && peopleAhead === 0) {
      return 'Next In Line';
    }
    if (isCompleted) {
      return '—';
    }
    return 'Calling Next';
  };

  const servingDisplay = resolveCurrentlyServing();

  // 5 Dynamic Milestone Tracker Stages derived directly from real token status
  const milestones = [
    {
      id: 'joined',
      label: 'Joined',
      isCompleted: true,
      isActive: false,
    },
    {
      id: 'waiting',
      label: 'Waiting',
      isCompleted: isServing || isCompleted || isAlmostTurn,
      isActive: isWaiting && !isAlmostTurn,
    },
    {
      id: 'approaching',
      label: 'Approaching',
      isCompleted: isServing || isCompleted,
      isActive: isWaiting && isAlmostTurn,
    },
    {
      id: 'serving',
      label: 'Serving',
      isCompleted: isCompleted,
      isActive: isServing,
    },
    {
      id: 'completed',
      label: 'Completed',
      isCompleted: isCompleted,
      isActive: false,
    },
  ];

  return (
    <article
      className="max-w-md w-full mx-auto space-y-4 text-[#171717] transition-all"
      aria-label={`Digital Token Pass #${tokenNumber}`}
    >
      {/* ── 1. PROMINENT ROYAL-BLUE DIGITAL TOKEN HERO CARD ───────────────── */}
      <section
        className="relative rounded-3xl bg-gradient-to-br from-[#1D4ED8] via-[#2563EB] to-[#1E40AF] text-white p-5 sm:p-6 shadow-xl shadow-blue-900/20 border border-blue-400/30 overflow-hidden"
      >
        {/* Subtle Decorative Side Ticket Notches */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 -left-3.5 -translate-y-1/2 w-7 h-7 rounded-full bg-[#FAF8F5] border border-blue-400/40 shadow-inner"
        />
        <div
          aria-hidden="true"
          className="absolute top-1/2 -right-3.5 -translate-y-1/2 w-7 h-7 rounded-full bg-[#FAF8F5] border border-blue-400/40 shadow-inner"
        />

        {/* Top Header inside Blue Card */}
        <div className="flex items-center justify-between gap-2.5 pb-4 border-b border-white/15">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-sm flex-shrink-0">
              {moduleInfo.icon}
            </span>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 block truncate">
                {moduleInfo.label}
              </span>
              <span className="text-xs font-semibold text-white block truncate">
                {providerName}
              </span>
            </div>
          </div>

          {/* Quick Header Actions: Audio chime & Manual Sync */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onToggleSound && (
              <button
                type="button"
                onClick={onToggleSound}
                title={soundEnabled ? 'Chime sound is ON (Click to mute)' : 'Chime is MUTED (Click to enable)'}
                className={`p-1.5 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1 ${
                  soundEnabled
                    ? 'bg-white/20 border-white/30 text-white hover:bg-white/30'
                    : 'bg-black/20 border-white/10 text-blue-200 hover:text-white'
                }`}
                aria-label={soundEnabled ? 'Mute counter chime' : 'Enable counter chime'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-blue-300" />
                )}
                <span className="text-[10px] hidden sm:inline font-semibold">
                  {soundEnabled ? 'Chime ON' : 'Muted'}
                </span>
              </button>
            )}

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Sync Live Token Status"
                className="p-1.5 rounded-xl border border-white/20 bg-white/15 text-white hover:bg-white/25 transition-colors"
                aria-label="Refresh Token Status"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-300' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Centerpiece: Large High-Contrast White Token Number */}
        <div className="text-center py-5 space-y-1">
          <span className="text-[11px] uppercase tracking-widest font-bold text-blue-200/90 block">
            Your Token Number
          </span>

          <div className="my-1">
            <span className="font-sans font-extrabold text-5xl sm:text-6xl text-white tracking-tight tabular-nums drop-shadow-md block">
              {tokenNumber || '—'}
            </span>
          </div>

          {/* Queue Status Badge */}
          <div className="flex items-center justify-center pt-0.5">
            {isServing ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400 text-emerald-950 shadow-md shadow-emerald-900/20 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-900 animate-ping" />
                <span>Now Serving</span>
              </span>
            ) : isAlmostTurn ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-300 text-amber-950 shadow-md">
                <span className="w-2 h-2 rounded-full bg-amber-950 animate-bounce" />
                <span>Almost Your Turn</span>
              </span>
            ) : isCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                <Check className="w-3.5 h-3.5" />
                <span>Completed</span>
              </span>
            ) : isCancelled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-md">
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancelled</span>
              </span>
            ) : isSkipped ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-950 shadow-md">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Skipped</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/25">
                <span className="w-2 h-2 rounded-full bg-blue-200 animate-pulse" />
                <span>Waiting in Queue</span>
              </span>
            )}
          </div>

          {/* Service & Customer Sub-labels */}
          <div className="pt-2 text-xs text-blue-100 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            {serviceName && (
              <span>
                Service: <strong className="text-white font-semibold">{serviceName}</strong>
              </span>
            )}
            {customerName && (
              <span>
                Customer: <strong className="text-white font-semibold">{customerName}</strong>
                {customerCode && <span className="text-blue-200 font-mono ml-1">({customerCode})</span>}
              </span>
            )}
          </div>
        </div>

        {/* ── 2. VISUAL MILESTONE TRACKER (Joined → Waiting → Approaching → Serving → Completed) ── */}
        {!isCancelled && !isSkipped && (
          <div className="pt-3 pb-2 border-t border-white/15">
            <div className="flex items-center justify-between text-[11px] text-blue-200 font-medium mb-3">
              <span>Queue Progress</span>
              <span className="font-mono text-white font-semibold">
                {isServing ? 'Now Serving' : isCompleted ? 'Finished' : `${peopleAhead} ahead`}
              </span>
            </div>

            <div className="relative flex items-center justify-between px-2">
              {/* Connecting Track Line */}
              <div
                aria-hidden="true"
                className="absolute left-6 right-6 top-3.5 h-1 bg-white/20 -translate-y-1/2 z-0"
              />

              {/* Milestone Step Nodes */}
              {milestones.map((step, idx) => {
                const isStepCompleted = step.isCompleted;
                const isStepActive = step.isActive;

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center group">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isStepActive
                          ? 'bg-white text-[#1D4ED8] ring-4 ring-blue-300/50 shadow-md scale-110'
                          : isStepCompleted
                          ? 'bg-white text-[#1D4ED8] shadow-sm'
                          : 'bg-blue-900/80 border border-blue-300/30 text-blue-300/60'
                      }`}
                    >
                      {isStepCompleted && !isStepActive ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-[9px] sm:text-[10px] mt-1.5 font-medium transition-colors ${
                        isStepActive
                          ? 'text-white font-bold'
                          : isStepCompleted
                          ? 'text-blue-100'
                          : 'text-blue-300/60'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 3. THREE-METRIC QUEUE TILES (People Ahead | Currently Serving | Estimated Wait) ── */}
        <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-3 gap-2 text-center">
          {/* Tile 1: People Ahead */}
          <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
            <span className="text-[9px] uppercase font-bold tracking-wider text-blue-200 block">
              People Ahead
            </span>
            <span className="font-mono font-extrabold text-xl sm:text-2xl text-white tabular-nums mt-0.5 block">
              {peopleAhead ?? 0}
            </span>
            <span className="text-[9px] text-blue-200/90 font-mono block mt-0.5">
              {position ? `Pos #${position}` : 'In sequence'}
            </span>
          </div>

          {/* Tile 2: Currently Serving */}
          <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
            <span className="text-[9px] uppercase font-bold tracking-wider text-blue-200 block">
              Now Serving
            </span>
            <span className="font-mono font-extrabold text-lg sm:text-xl text-white tabular-nums mt-0.5 block truncate">
              {servingDisplay}
            </span>
            <span className="text-[9px] text-blue-200/90 font-mono block mt-0.5">
              {isServing ? 'Your Turn' : 'Active Token'}
            </span>
          </div>

          {/* Tile 3: Estimated Wait */}
          <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15">
            <span className="text-[9px] uppercase font-bold tracking-wider text-blue-200 block">
              Est. Wait
            </span>
            <span className="font-mono font-extrabold text-xl sm:text-2xl text-white tabular-nums mt-0.5 block">
              ~{isServing ? '0' : estimatedWaitMinutes ?? 0}
              <span className="text-[10px] font-sans font-normal text-blue-200 ml-0.5">m</span>
            </span>
            <span className="text-[9px] text-blue-200/90 font-mono block mt-0.5 truncate">
              {aiEstimatedWaitMinutes != null && isWaiting ? `AI: ~${aiEstimatedWaitMinutes}m` : 'Live Sync'}
            </span>
          </div>
        </div>
      </section>

      {/* ── 4. CONDITIONAL STATUS NOTICES (Serving, Almost Turn, Completed, Cancelled) ── */}
      {isServing && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-2xl bg-[#F0FDF4] border-2 border-[#16A34A] text-[#166534] font-bold text-center space-y-1 animate-pulse shadow-sm"
        >
          <div className="text-xs uppercase tracking-wider flex items-center justify-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-ping" />
            <span>It's Your Turn Now!</span>
          </div>
          <div className="text-sm sm:text-base">
            {assignedTo?.room
              ? `Please proceed to ${assignedTo.room}`
              : assignedTo?.name
              ? `Please proceed to ${assignedTo.name}`
              : 'Please proceed to the service counter now.'}
          </div>
        </div>
      )}

      {isAlmostTurn && !isServing && (
        <div
          role="status"
          aria-live="polite"
          className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
          <span>
            Almost your turn ({peopleAhead} {peopleAhead === 1 ? 'person' : 'people'} ahead). Please make your way to the waiting area.
          </span>
        </div>
      )}

      {isCompleted && (
        <div
          role="status"
          className="p-3.5 rounded-2xl bg-[#F5F2EB] border border-[#E7E3DC] text-[#57534E] text-xs font-semibold flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          <span>Service completed. Thank you for using SHEWWINA!</span>
        </div>
      )}

      {isCancelled && (
        <div
          role="status"
          className="p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FEE2E2] text-[#991B1B] text-xs font-semibold flex items-center justify-center gap-2"
        >
          <XCircle className="w-4 h-4 text-[#DC2626]" />
          <span>This queue pass has been cancelled.</span>
        </div>
      )}

      {isSkipped && (
        <div
          role="status"
          className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs font-semibold flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-[#D97706]" />
          <span>Your token was marked as skipped. Please inquire at reception.</span>
        </div>
      )}

      {/* ── 5. ASSIGNED OPERATOR / DOCTOR / CABIN / DESK CONTEXT ────────── */}
      {assignedTo && (
        <div className="p-4 rounded-2xl bg-white border border-[#E7E3DC] text-left flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] flex items-center justify-center text-lg flex-shrink-0">
              {module === 'hospital' ? '🩺' : module === 'government' ? '🏛️' : '👤'}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#78716C] block">
                {assignedTo.title || (module === 'hospital' ? 'Attending Doctor' : 'Assigned Desk')}
              </span>
              <strong className="text-sm font-semibold text-[#171717] block truncate">
                {assignedTo.name}
              </strong>
              {assignedTo.subtitle && (
                <span className="text-xs text-[#78716C] block truncate">
                  {assignedTo.subtitle}
                </span>
              )}
            </div>
          </div>

          {assignedTo.room && (
            <div className="text-right flex-shrink-0 pl-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#78716C] block">
                {module === 'hospital' ? 'Cabin' : 'Counter'}
              </span>
              <span className="font-mono font-bold text-sm text-[#1D4ED8]">
                {assignedTo.room}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── 6. STATUTORY FEES BREAKDOWN (Government Kendra) ─────────────── */}
      {fees && (
        <div className="p-4 rounded-2xl bg-white border border-[#E7E3DC] text-left text-xs space-y-2 shadow-sm">
          <div className="flex justify-between text-[#57534E]">
            <span>Statutory Official Fee:</span>
            <span className="font-mono font-semibold text-[#171717]">
              {Number(fees.officialFee) === 0 ? 'FREE' : `₹${Number(fees.officialFee).toFixed(0)}`}
            </span>
          </div>
          <div className="flex justify-between text-[#57534E]">
            <span>Facilitation Assistance:</span>
            <span className="font-mono font-semibold text-[#171717]">
              {Number(fees.facilitationFee) === 0 ? 'Nil' : `₹${Number(fees.facilitationFee).toFixed(0)}`}
            </span>
          </div>
          {fees.note && (
            <div className="text-[11px] text-[#78716C] pt-1.5 border-t border-[#E7E3DC] text-right font-medium">
              {fees.note}
            </div>
          )}
        </div>
      )}

      {/* ── 7. NOTIFICATION PREFERENCES SECTION (Genuine, Supported Channels Only) ── */}
      <section
        className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7E3DC] shadow-sm text-left space-y-3"
        aria-label="Notification Preferences"
      >
        <div className="flex items-center gap-2 pb-2 border-b border-[#F0ECE4]">
          <Bell className="w-4 h-4 text-[#2563EB]" />
          <div>
            <h3 className="text-xs font-bold text-[#171717] tracking-tight">Notification Preferences</h3>
            <p className="text-[11px] text-[#78716C]">Receive real-time arrival alerts on your device</p>
          </div>
        </div>

        {/* Channel 1: Audio Chime on Turn */}
        <div className="flex items-center justify-between py-1">
          <div className="pr-3">
            <span className="text-xs font-semibold text-[#171717] block">Audio Turn Chime</span>
            <span className="text-[11px] text-[#78716C] block">
              Plays an audio chime alert when your token is called
            </span>
          </div>
          {onToggleSound ? (
            <button
              type="button"
              onClick={onToggleSound}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                soundEnabled ? 'bg-[#2563EB]' : 'bg-slate-300'
              }`}
              role="switch"
              aria-checked={soundEnabled}
              aria-label="Toggle audio turn chime"
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active
            </span>
          )}
        </div>

        {/* Channel 2: Live Realtime SSE Updates */}
        <div className="flex items-center justify-between py-1 border-t border-[#F0ECE4]">
          <div className="pr-3">
            <span className="text-xs font-semibold text-[#171717] block">Live Stream Sync</span>
            <span className="text-[11px] text-[#78716C] block">
              Instant SSE push updates with 6-second fallback polling
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-[#1D4ED8] border border-blue-200 flex-shrink-0">
            <Radio className="w-3 h-3 text-[#2563EB] animate-pulse" />
            <span>Connected</span>
          </span>
        </div>

        {/* Channel 3: SMS Dispatch (Exposed when customer phone is attached) */}
        {customerPhone && (
          <div className="flex items-center justify-between py-1 border-t border-[#F0ECE4]">
            <div className="pr-3">
              <span className="text-xs font-semibold text-[#171717] block">SMS Alert Dispatch</span>
              <span className="text-[11px] text-[#78716C] block">
                Dispatches confirmation &amp; turn alerts to <span className="font-mono text-[#171717]">{customerPhone}</span>
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
              <ShieldCheck className="w-3 h-3" />
              <span>Configured</span>
            </span>
          </div>
        )}
      </section>

      {/* ── 8. SCANNABLE QR CODE PASS ────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-white border border-[#E7E3DC] flex items-center justify-between gap-4 shadow-sm">
        <div className="text-left space-y-1 min-w-0">
          <span className="text-[11px] uppercase tracking-wider font-bold text-[#78716C] block">
            Digital Verification Slip
          </span>
          <p className="text-xs text-[#57534E] leading-relaxed">
            Show or scan this QR code at the desk upon arrival to confirm your check-in.
          </p>
          {lastRefreshed && (
            <span className="text-[10px] text-[#78716C] font-mono block">
              Last sync: {new Date(lastRefreshed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>

        <div className="p-2.5 bg-white rounded-xl border border-[#E7E3DC] shadow-sm flex-shrink-0">
          <QRCodeSVG
            value={qrValue || (typeof window !== 'undefined' ? `${window.location.origin}/token/${tokenNumber}` : '')}
            size={76}
            level="M"
            includeMargin={false}
            className="w-16 h-16 sm:w-20 sm:h-20"
          />
        </div>
      </div>

      {/* ── 9. ACTION FOOTER (Print, Cancel, Navigation) ─────────────────── */}
      {showFullActions && (
        <footer className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E7E3DC] shadow-sm space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Print / Save Pass */}
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 py-2.5 px-3 rounded-xl border border-[#E7E3DC] bg-[#FAF8F5] hover:bg-[#F5F2EB] text-[#171717] font-semibold text-xs text-center transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-[#57534E]" />
              <span>Print / Save Pass</span>
            </button>

            {/* Cancel Button (if permitted and waiting) */}
            {canCancel && isWaiting && onCancel && (
              <Button
                variant="outline"
                size="md"
                onClick={onCancel}
                disabled={isCancelling}
                className="flex-1 text-[#991B1B] border-[#FEE2E2] hover:bg-[#FEF2F2] flex items-center justify-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>{isCancelling ? 'Cancelling...' : 'Cancel Token'}</span>
              </Button>
            )}
          </div>

          {/* Navigation Links */}
          <div className="pt-2 flex flex-col gap-2">
            {dashboardLink && (
              <Link
                to={dashboardLink}
                className="block w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl text-xs text-center transition-colors shadow-xs active-press"
              >
                Go to Customer Dashboard →
              </Link>
            )}

            {backLink && (
              <Link
                to={backLink.to}
                className="block w-full py-2 bg-transparent hover:bg-[#FAF8F5] text-[#57534E] hover:text-[#171717] font-medium rounded-xl text-xs text-center transition-colors"
              >
                ← {backLink.label}
              </Link>
            )}
          </div>
        </footer>
      )}
    </article>
  );
}
