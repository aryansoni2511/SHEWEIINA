import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoMark from '../components/LogoMark';
import {
  getGovernmentDashboardApi,
  createGovernmentCounterApi,
  toggleGovernmentCounterApi,
  callNextGovernmentCitizenApi,
  completeGovernmentTokenApi,
  skipGovernmentTokenApi,
  getStoredToken,
} from '../services/api';
import { subscribeQueueRealtime } from '../services/realtime';
import {
  Landmark,
  Building2,
  Plus,
  MapPin,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  LogOut,
  ArrowRight,
  X,
  ExternalLink,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────
   Government Kendra Admin & Counter Management Dashboard
   Institutional Navy (#0F172A, #1E3A8A) Theme
───────────────────────────────────────────────────────────────────────── */

export default function GovernmentDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // New counter modal
  const [showAddCounterModal, setShowAddCounterModal] = useState(false);
  const [counterForm, setCounterForm] = useState({
    counterNumber: '',
    counterName: '',
    operatorName: '',
    assignedCategory: 'All',
    tokenPrefix: 'G',
  });
  const [creatingCounter, setCreatingCounter] = useState(false);

  const fetchDashboard = async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        navigate('/login?role=business&redirect=/government/dashboard');
        return;
      }

      const res = await getGovernmentDashboardApi();
      if (res?.success && res.data) {
        setDashboardData(res.data);
        setError(null);
      } else {
        setError(res?.error || 'Failed to load dashboard.');
      }
    } catch (err) {
      if (err.statusCode === 401 || err.message?.includes('401')) {
        navigate('/login?role=business&redirect=/government/dashboard');
      } else {
        setError(err.message || 'Error connecting to Kendra server.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 8000); // 8s polling
    return () => clearInterval(interval);
  }, []);

  // Live SSE Stream for Kendra Operator Dashboard
  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    if (dashboardData?.centre?.id) {
      unsubscribe = subscribeQueueRealtime({
        businessId: dashboardData.centre.id,
        onUpdate: () => {
          if (isMounted) {
            fetchDashboard();
          }
        },
      });
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [dashboardData?.centre?.id]);

  const handleToggleCounter = async (counterId, currentOpenState) => {
    try {
      const res = await toggleGovernmentCounterApi(counterId, !currentOpenState);
      if (res?.success) {
        setActionMessage(res.message || 'Counter updated.');
        fetchDashboard();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCallNext = async (counterId) => {
    try {
      setActionMessage(null);
      const res = await callNextGovernmentCitizenApi(counterId);
      if (res?.success) {
        setActionMessage(`Called Citizen #${res.data.token?.token_number || ''}`);
        fetchDashboard();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCompleteToken = async (tokenId) => {
    try {
      setActionMessage(null);
      const res = await completeGovernmentTokenApi(tokenId);
      if (res?.success) {
        setActionMessage('Citizen service marked as COMPLETED.');
        fetchDashboard();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSkipToken = async (tokenId) => {
    try {
      setActionMessage(null);
      const res = await skipGovernmentTokenApi(tokenId);
      if (res?.success) {
        setActionMessage('Citizen token marked as SKIPPED.');
        fetchDashboard();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateCounterSubmit = async (e) => {
    e.preventDefault();
    try {
      setCreatingCounter(true);
      const res = await createGovernmentCounterApi(counterForm);
      if (res?.success) {
        setShowAddCounterModal(false);
        setCounterForm({
          counterNumber: '',
          counterName: '',
          operatorName: '',
          assignedCategory: 'All',
          tokenPrefix: 'G',
        });
        setActionMessage('New desk counter registered successfully.');
        fetchDashboard();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingCounter(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center font-sans text-center p-4">
        <div className="w-10 h-10 border-3 border-[#0F172A] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-[#57534E] text-xs font-semibold">Loading Kendra Queue Console...</p>
      </div>
    );
  }

  const centre = dashboardData?.centre || {};
  const counters = dashboardData?.counters || [];
  const summary = dashboardData?.summary || dashboardData?.metrics || {};
  const activeTokens = Array.isArray(dashboardData?.activeTokens) ? dashboardData.activeTokens : [];

  // Filter serving and waiting tokens directly from activeTokens
  const serving = Array.isArray(dashboardData?.serving) && dashboardData.serving.length > 0
    ? dashboardData.serving
    : activeTokens.filter((t) => t.status === 'SERVING');

  const waiting = Array.isArray(dashboardData?.waiting) && dashboardData.waiting.length > 0
    ? dashboardData.waiting
    : activeTokens.filter((t) => t.status === 'WAITING');

  // Correct token metrics dynamically without hardcoded demo data
  const waitingCount = summary.total_waiting !== undefined
    ? Number(summary.total_waiting)
    : (summary.waiting_count !== undefined ? Number(summary.waiting_count) : waiting.length);

  const servingCount = summary.total_serving !== undefined
    ? Number(summary.total_serving)
    : (summary.serving_count !== undefined ? Number(summary.serving_count) : serving.length);

  const completedTodayCount = summary.total_served_today !== undefined
    ? Number(summary.total_served_today)
    : (summary.completed_today !== undefined ? Number(summary.completed_today) : 0);

  const totalTokensToday = summary.total_tokens_today !== undefined
    ? Number(summary.total_tokens_today)
    : (waitingCount + servingCount + completedTodayCount);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#171717] flex flex-col font-sans selection:bg-[#0F172A] selection:text-white">
      {/* ── Dedicated Kendra Workspace Header ──────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E7E3DC] shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2.5">
                <LogoMark className="w-8 h-8" iconSize="w-4 h-4" />
                <div className="hidden sm:flex flex-col leading-none">
                  <span className="font-display font-bold text-lg text-[#171717] tracking-tight">
                    Shewwina<span className="text-[#C25E38]">.</span>
                  </span>
                  <span className="text-[9px] font-semibold text-[#6B665E] uppercase">
                    Govt Kendra Console
                  </span>
                </div>
              </Link>
              <span className="hidden sm:inline text-[#D8D2C5]">/</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0]">
                <Landmark className="w-3.5 h-3.5 text-[#0F172A]" />
                <span>{centre.name || 'Citizen Seva Kendra'}</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Multi-Module Switcher for dual-admin users */}
              {user?.isMultiModule && (
                <Link
                  to="/hospital/dashboard"
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-semibold text-[#1E40AF] hover:bg-[#DBEAFE] transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Switch to Hospital OPD</span>
                </Link>
              )}

              <Link
                to={`/government-services`}
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7E3DC] bg-white hover:bg-[#F5F2EB] text-xs font-medium text-[#57534E]"
              >
                <span>Citizen View</span>
                <ExternalLink className="w-3 h-3 text-[#78716C]" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-2 text-[#78716C] hover:text-[#B91C1C] hover:bg-[#FEF2F2] rounded-xl transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-16">
        {/* ── Kendra Dashboard Banner ─────────────────────────────────────── */}
        <section className="bg-[#0F172A] text-white py-8 px-4 sm:px-6 lg:px-8 border-b border-[#1E293B]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-[#F59E0B] border border-white/20">
                  {centre.centre_type || 'Kendra'} Console
                </span>
                {centre.is_verified ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#15803D]/20 text-[#86EFAC] border border-[#15803D]/30 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Verified Citizen Desk</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Facilitation Desk
                  </span>
                )}
              </div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
                {centre.name || 'Citizen Facilitation Kendra'}
              </h1>
              <p className="text-xs text-[#94A3B8] mt-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#CBD5E1]" />
                <span>{centre.address}, {centre.city} — {centre.pincode} | Code: <strong className="text-white">{centre.centre_code}</strong></span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddCounterModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-semibold text-xs tracking-wide transition-all shadow-xs flex items-center gap-1.5 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Service Desk</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── Action / Error Alerts ───────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          {actionMessage && (
            <div className="p-3 mb-4 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] text-xs text-[#166534] font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#16A34A]" />
                <span>{actionMessage}</span>
              </span>
              <button onClick={() => setActionMessage(null)} className="text-[#166534] hover:text-[#14532D]">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {error && (
            <div className="p-3 mb-4 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] text-xs text-[#991B1B] font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-[#DC2626]" />
                <span>{error}</span>
              </span>
              <button onClick={() => setError(null)} className="text-[#991B1B] hover:text-[#7F1D1D]">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Metrics Cards ───────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 font-medium">Waiting Citizens</div>
              <div className="text-3xl font-black text-blue-950 mt-1">
                {waitingCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">tokens in queue</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 font-medium">Currently Serving</div>
              <div className="text-3xl font-black text-emerald-600 mt-1">
                {servingCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">at active counters</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 font-medium">Completed Today</div>
              <div className="text-3xl font-black text-slate-900 mt-1">
                {completedTodayCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">citizens assisted</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 font-medium">Total Tokens Today</div>
              <div className="text-3xl font-black text-slate-900 mt-1">
                {totalTokensToday}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">tokens issued</div>
            </div>
          </div>
        </section>

        {/* ── Main Dashboard Columns ─────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 5 Cols: Counter Desk Status */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <span>🏢</span>
                    <span>Service Desks &amp; Counters</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {counters.length} Total
                  </span>
                </div>

                <div className="space-y-3">
                  {counters.map((c) => (
                    <div
                      key={c.id}
                      className={`p-4 rounded-xl border transition-all ${
                        c.is_open ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-100 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{c.counter_number}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.is_open ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {c.is_open ? 'OPEN' : 'PAUSED'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5 font-medium">{c.counter_name}</div>
                          {c.operator_name && (
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Operator: {c.operator_name}
                            </div>
                          )}
                        </div>

                        {/* Call Next Button */}
                        <div className="flex flex-col gap-1.5 shrink-0">
                          {c.is_open && (
                            <button
                              onClick={() => handleCallNext(c.id)}
                              className="px-3 py-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs transition-colors"
                            >
                              Call Next →
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleCounter(c.id, c.is_open)}
                            className="px-2 py-1 rounded text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50"
                          >
                            {c.is_open ? 'Pause Desk' : 'Open Desk'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Serving & Waiting Queue */}
            <div className="lg:col-span-7 space-y-6">
              {/* Serving Now Box */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Now Serving at Counters ({serving.length})</span>
                </h3>

                {serving.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No citizens currently being served. Click "Call Next" from an open desk.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {serving.map((t) => (
                      <div
                        key={t.id}
                        className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-emerald-950">
                              #{t.token_number}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {t.citizen_name}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            Service: <strong>{t.service_name}</strong>
                          </div>
                          <div className="text-[11px] text-emerald-800 mt-1">
                            At {t.counter_number} ({t.counter_name})
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCompleteToken(t.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
                          >
                            ✓ Complete
                          </button>
                          <button
                            onClick={() => handleSkipToken(t.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 font-medium text-xs"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Waiting Citizens Queue */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
                  <span>⏳</span>
                  <span>Citizen Waiting Queue ({waiting.length})</span>
                </h3>

                {waiting.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Waiting queue is clear. No citizens currently in line.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {waiting.map((t, idx) => (
                      <div key={t.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center text-xs font-bold text-slate-400">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold text-blue-950">
                                {t.token_number}
                              </span>
                              <span className="text-xs font-bold text-slate-800">
                                {t.citizen_name}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {t.service_name} ({t.service_category})
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-xs">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 font-semibold text-[11px]">
                            WAITING
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Modal: Add New Counter ─────────────────────────────────────── */}
        {showAddCounterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Add New Service Desk / Counter
              </h3>

              <form onSubmit={handleCreateCounterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Desk Number / Label *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Counter 3 or Desk A"
                    value={counterForm.counterNumber}
                    onChange={(e) => setCounterForm({ ...counterForm, counterNumber: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Desk Function / Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Passport Document Pre-Check Desk"
                    value={counterForm.counterName}
                    onChange={(e) => setCounterForm({ ...counterForm, counterName: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Desk Operator Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kadam"
                    value={counterForm.operatorName}
                    onChange={(e) => setCounterForm({ ...counterForm, operatorName: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Category *
                  </label>
                  <select
                    value={counterForm.assignedCategory}
                    onChange={(e) => setCounterForm({ ...counterForm, assignedCategory: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                  >
                    <option value="All">All Categories</option>
                    <option value="Aadhaar">Aadhaar Services</option>
                    <option value="Passport">Passport Services</option>
                    <option value="RTO">RTO Services</option>
                    <option value="Municipal">Municipal Services</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddCounterModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingCounter}
                    className="px-5 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 disabled:opacity-50 text-white font-bold text-xs"
                  >
                    {creatingCounter ? 'Creating...' : 'Create Desk Counter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
