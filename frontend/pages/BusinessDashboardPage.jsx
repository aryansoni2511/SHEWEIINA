import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getBusinessQueue,
  callNextCustomer,
  completeService,
  getBusinessProfileApi,
  updateBusinessProfileApi,
  getBusinessServices,
  createBusinessServiceApi,
  updateBusinessServiceApi as updateServiceApi,
  toggleServiceStatusApi,
  getQueueSettingsApi,
  updateQueueSettingsApi,
} from '../services/api';
import { subscribeQueueRealtime } from '../services/realtime';
import { useAuth } from '../context/AuthContext';

export default function BusinessDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const activeBusinessId = user?.businessId || '';

  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callingNext, setCallingNext] = useState(false);
  const [completingServiceState, setCompletingServiceState] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  // Business Profile Settings State
  const [profile, setProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [profileError, setProfileError] = useState(null);

  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('salon');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('Mumbai');

  // Business Services Management State
  const [servicesList, setServicesList] = useState([]);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [svcName, setSvcName] = useState('');
  const [svcDuration, setSvcDuration] = useState('15');
  const [svcPrice, setSvcPrice] = useState('0');
  const [svcDesc, setSvcDesc] = useState('');
  const [savingSvc, setSavingSvc] = useState(false);
  const [svcSuccess, setSvcSuccess] = useState(null);
  const [svcError, setSvcError] = useState(null);

  // Queue Configuration State
  const [showQueueSettingsModal, setShowQueueSettingsModal] = useState(false);
  const [qName, setQName] = useState('Main Queue');
  const [qIsOpen, setQIsOpen] = useState(true);
  const [qTokenPrefix, setQTokenPrefix] = useState('S');
  const [qMaxCapacity, setQMaxCapacity] = useState('200');
  const [qAvgDuration, setQAvgDuration] = useState('15');
  const [savingQSettings, setSavingQSettings] = useState(false);
  const [qSuccess, setQSuccess] = useState(null);
  const [qError, setQError] = useState(null);

  const fetchQueueSettings = async () => {
    try {
      const res = await getQueueSettingsApi();
      if (res.data) {
        setQName(res.data.name || 'Main Queue');
        setQIsOpen(Boolean(res.data.isOpen));
        setQTokenPrefix(res.data.tokenPrefix || 'S');
        setQMaxCapacity(String(res.data.maxDailyCapacity || 200));
        setQAvgDuration(String(res.data.avgServiceDuration || 15));
      }
    } catch (err) {}
  };

  const handleSaveQueueSettings = async (e) => {
    e.preventDefault();
    setSavingQSettings(true);
    setQSuccess(null);
    setQError(null);

    try {
      const res = await updateQueueSettingsApi({
        name: qName,
        isOpen: qIsOpen,
        tokenPrefix: qTokenPrefix,
        maxDailyCapacity: Number(qMaxCapacity),
        avgServiceDuration: Number(qAvgDuration),
      });

      setQSuccess('Queue configuration updated successfully!');
      setSavingQSettings(false);
      fetchQueue(true);
    } catch (err) {
      setQError(err.message || 'Failed to update queue settings.');
      setSavingQSettings(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await getBusinessServices(activeBusinessId, true);
      setServicesList(res.data?.services || []);
    } catch (err) {}
  };

  const handleOpenAddService = () => {
    setEditingServiceId(null);
    setSvcName('');
    setSvcDuration('15');
    setSvcPrice('0');
    setSvcDesc('');
    setSvcSuccess(null);
    setSvcError(null);
    setShowServiceForm(true);
  };

  const handleOpenEditService = (svc) => {
    setEditingServiceId(svc.id);
    setSvcName(svc.name);
    setSvcDuration(String(svc.durationMinutes || 15));
    setSvcPrice(String(svc.price || 0));
    setSvcDesc(svc.description || '');
    setSvcSuccess(null);
    setSvcError(null);
    setShowServiceForm(true);
  };

  const handleSaveServiceForm = async (e) => {
    e.preventDefault();
    setSavingSvc(true);
    setSvcSuccess(null);
    setSvcError(null);

    try {
      if (editingServiceId) {
        await updateServiceApi(editingServiceId, {
          name: svcName,
          durationMinutes: Number(svcDuration),
          price: Number(svcPrice),
          description: svcDesc,
        });
        setSvcSuccess('Service updated successfully!');
      } else {
        await createBusinessServiceApi({
          name: svcName,
          durationMinutes: Number(svcDuration),
          price: Number(svcPrice),
          description: svcDesc,
        });
        setSvcSuccess('New service created successfully!');
      }
      setSavingSvc(false);
      setShowServiceForm(false);
      fetchServices();
      fetchQueue(true);
    } catch (err) {
      setSvcError(err.message || 'Failed to save service.');
      setSavingSvc(false);
    }
  };

  const handleToggleStatus = async (svcId, currentActive) => {
    setSvcSuccess(null);
    setSvcError(null);
    try {
      await toggleServiceStatusApi(svcId, !currentActive);
      setSvcSuccess(`Service status updated to ${!currentActive ? 'ACTIVE' : 'INACTIVE'}`);
      fetchServices();
      fetchQueue(true);
    } catch (err) {
      setSvcError(err.message || 'Failed to update service status.');
    }
  };

  const fetchQueue = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setErrorMessage(null);

    try {
      const res = await getBusinessQueue(activeBusinessId);
      setQueueData(res.data);
      setLoading(false);
    } catch (err) {
      setErrorMessage(err.message || 'Unable to load business queue.');
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await getBusinessProfileApi();
      setProfile(res.data);
      setEditName(res.data.name || '');
      setEditCategory(res.data.category || 'salon');
      setEditPhone(res.data.phone || '');
      setEditAddress(res.data.address || '');
      setEditCity(res.data.city || 'Mumbai');
    } catch (err) {}
  };

  // Initial Fetch, Realtime Subscription & Auto-Refresh Fallback
  useEffect(() => {
    let isMounted = true;

    fetchQueue(false);
    fetchProfile();
    fetchServices();
    fetchQueueSettings();

    // 1. Realtime SSE subscription: instantly updates queue when any customer joins, cancels, is called, skipped, or completed
    let unsubscribe = () => {};
    if (activeBusinessId) {
      unsubscribe = subscribeQueueRealtime({
        businessId: activeBusinessId,
        onUpdate: () => {
          if (isMounted) {
            fetchQueue(true);
          }
        },
      });
    }

    // 2. Resilient Polling Fallback: keeps running in background in case network interrupts SSE
    const interval = setInterval(() => {
      if (isMounted) {
        getBusinessQueue(activeBusinessId)
          .then((res) => {
            if (isMounted) setQueueData(res.data);
          })
          .catch(() => {});
      }
    }, 5000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(interval);
    };
  }, [activeBusinessId]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const res = await updateBusinessProfileApi({
        name: editName,
        category: editCategory,
        phone: editPhone,
        address: editAddress,
        city: editCity,
      });

      setProfile(res.data);
      setProfileSuccess('Business profile updated successfully!');
      setSavingProfile(false);
      fetchQueue(true);
    } catch (err) {
      setProfileError(err.message || 'Failed to update business profile.');
      setSavingProfile(false);
    }
  };

  // Handle Call Next Customer
  const handleCallNext = async () => {
    setCallingNext(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const res = await callNextCustomer(activeBusinessId, queueData?.queue?.id);
      setInfoMessage(`Called Token #${res.data.tokenNumber} (${res.data.customerName})`);
      await fetchQueue(true);
      setCallingNext(false);
    } catch (err) {
      if (err.status === 404 || err.message?.toLowerCase().includes('no waiting')) {
        setInfoMessage('No customers are currently waiting in the queue.');
      } else {
        setErrorMessage(err.message || 'Failed to call next customer.');
      }
      setCallingNext(false);
    }
  };

  // Handle Complete Active Service
  const handleCompleteService = async () => {
    setCompletingServiceState(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const res = await completeService(activeBusinessId, queueData?.queue?.id);
      setInfoMessage(`Completed service for Token #${res.data.tokenNumber} (${res.data.customerName})`);
      await fetchQueue(true);
      setCompletingServiceState(false);
    } catch (err) {
      setErrorMessage(err.message || 'No active service to complete.');
      setCompletingServiceState(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const servingToken = queueData?.tokens?.find((t) => t.status === 'SERVING');
  const waitingTokens = queueData?.tokens?.filter((t) => t.status === 'WAITING') || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 selection:bg-blue-600 selection:text-white">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20">
              S
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {queueData?.business?.name || user?.name || 'Shewwina Salon Dashboard'}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>Queue: <strong className="text-slate-200">{queueData?.queue?.name || 'Main Queue'}</strong></span>
                <span>•</span>
                <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      queueData?.queue == null
                        ? 'text-slate-500'
                        : queueData.queue.isOpen
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        queueData?.queue == null
                          ? 'bg-slate-500'
                          : queueData.queue.isOpen
                          ? 'bg-emerald-400 animate-pulse'
                          : 'bg-rose-400'
                      }`}
                    />
                    {queueData?.queue == null ? '—' : queueData.queue.isOpen ? 'OPEN' : 'CLOSED'}
                  </span>
                <span>•</span>
                <span className="text-slate-400">Logged in as: <strong className="text-slate-200">{user?.name}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowQueueSettingsModal(true); fetchQueueSettings(); }}
              className="px-3.5 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-xs font-semibold rounded-xl transition-colors text-emerald-300 flex items-center gap-1.5"
            >
              📋 Queue Config
            </button>
            <button
              onClick={() => { setShowServicesModal(true); fetchServices(); }}
              className="px-3.5 py-2 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800 text-xs font-semibold rounded-xl transition-colors text-indigo-300 flex items-center gap-1.5"
            >
              🛠️ Manage Services
            </button>
            <button
              onClick={() => setShowProfileModal(true)}
              className="px-3.5 py-2 bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-xs font-semibold rounded-xl transition-colors text-blue-300 flex items-center gap-1.5"
            >
              ⚙️ Business Settings
            </button>
            <button
              onClick={() => fetchQueue(false)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold rounded-xl transition-colors text-slate-300 flex items-center gap-1.5"
            >
              🔄 Sync List
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-xs font-semibold rounded-xl transition-colors text-rose-300"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Action / Notification Banners */}
        {infoMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-950/60 border border-blue-800/80 text-blue-300 text-xs font-semibold flex items-center justify-between">
            <span>ℹ️ {infoMessage}</span>
            <button onClick={() => setInfoMessage(null)} className="text-blue-400 hover:text-white font-bold ml-2">✕</button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-semibold flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white font-bold ml-2">✕</button>
          </div>
        )}

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Tokens Today</div>
            <div className="text-3xl font-black text-white font-mono mt-1">{queueData?.totalTokens ?? 0}</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-900/40 text-center">
            <div className="text-xs uppercase font-bold text-emerald-400 tracking-wider">Currently Serving</div>
            <div className="text-3xl font-black text-emerald-400 font-mono mt-1">{queueData?.servingCount ?? 0}</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900 border border-amber-900/40 text-center">
            <div className="text-xs uppercase font-bold text-amber-400 tracking-wider">Waiting in Line</div>
            <div className="text-3xl font-black text-amber-400 font-mono mt-1">{queueData?.waitingCount ?? 0}</div>
          </div>
        </div>

        {/* AI Queue Forecast Banner (Phase 9) */}
        {queueData?.queueInsights && (
          <div className="mb-8 p-5 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-900/60 border border-indigo-700/60 flex items-center justify-center text-lg">
                🤖
              </div>
              <div>
                <div className="text-sm font-bold text-indigo-200 flex items-center gap-2">
                  <span>AI Queue Forecast</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                    queueData.queueInsights.loadLevel === 'HIGH'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : queueData.queueInsights.loadLevel === 'MODERATE'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {queueData.queueInsights.loadLevel} LOAD
                  </span>
                </div>
                <div className="text-xs text-indigo-300/80 mt-0.5">
                  Est. Queue Clear Time: <strong className="text-white">~{queueData.queueInsights.aiAdjustedClearTimeMinutes} min</strong> (Standard: ~{queueData.queueInsights.estimatedClearTimeMinutes} min)
                </div>
              </div>
            </div>
            {queueData.queueInsights.peakWarning && (
              <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <span>⚠️ Peak Volume Alert</span>
              </div>
            )}
          </div>
        )}

        {/* Serving Banner & Action Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="text-xs uppercase font-bold text-slate-400 tracking-widest">Active Serving Token</div>
            {servingToken ? (
              <div className="flex items-center gap-4">
                <span className="text-5xl font-black text-emerald-400 font-mono">#{servingToken.tokenNumber}</span>
                <div>
                  <div className="text-lg font-bold text-white">{servingToken.customerName}</div>
                  <div className="text-xs text-slate-400">Service: {servingToken.service} • {servingToken.customerPhone}</div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 italic text-sm">No token is currently being served.</div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {servingToken && (
              <button
                onClick={handleCompleteService}
                disabled={completingServiceState}
                className="w-full sm:w-auto px-6 py-4 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/50 text-slate-200 font-semibold text-sm rounded-2xl border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                {completingServiceState ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                    <span>Completing...</span>
                  </>
                ) : (
                  <span>✅ Complete Service</span>
                )}
              </button>
            )}

            <button
              onClick={handleCallNext}
              disabled={callingNext || waitingTokens.length === 0}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-base rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {callingNext ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Calling Next...</span>
                </>
              ) : (
                <>
                  <span>📢 CALL NEXT CUSTOMER</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Waiting List Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-base font-bold text-slate-200 mb-4 flex items-center justify-between">
            <span>Waiting Customers ({waitingTokens.length})</span>
            <span className="text-xs font-normal text-slate-500">Auto-Refreshing (5s)</span>
          </h2>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono">Loading active queue...</div>
          ) : waitingTokens.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              ✨ No customers currently waiting in the queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-xl">Pos</th>
                    <th className="p-3">Token #</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Service</th>
                    <th className="p-3 rounded-r-xl">Est. Wait</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {waitingTokens.map((tok, idx) => (
                    <tr key={tok.tokenId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-amber-400">#{idx + 1}</td>
                      <td className="p-3.5 font-mono font-bold text-white text-sm">#{tok.tokenNumber}</td>
                      <td className="p-3.5 text-slate-200 font-semibold">{tok.customerName}</td>
                      <td className="p-3.5 font-mono text-slate-400">{tok.customerPhone}</td>
                      <td className="p-3.5 text-slate-300">{tok.service}</td>
                      <td className="p-3.5 text-blue-400 font-mono font-semibold">{tok.estimatedWaitMinutes} mins</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Business Profile Settings Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  ⚙️ Business Profile Settings
                </h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              {profileSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold">
                  ✅ {profileSuccess}
                </div>
              )}

              {profileError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-semibold">
                  ⚠️ {profileError}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Business Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 font-semibold"
                    >
                      <option value="salon">Salon & Spa</option>
                      <option value="clinic">Clinic & Healthcare</option>
                      <option value="bank">Financial / Banking</option>
                      <option value="service">General Service Center</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Address</label>
                  <input
                    type="text"
                    required
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Queue Operational Status</label>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> OPEN FOR QUEUE
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-1/2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-blue-600/20"
                  >
                    {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Services Management Modal */}
        {showServicesModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    🛠️ Service Management ({servicesList.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Configure custom service offerings for your business.</p>
                </div>
                <button
                  onClick={() => setShowServicesModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              {svcSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold">
                  ✅ {svcSuccess}
                </div>
              )}

              {svcError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-semibold">
                  ⚠️ {svcError}
                </div>
              )}

              {/* Add New Service Button */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Services List</span>
                <button
                  onClick={handleOpenAddService}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  + Add Custom Service
                </button>
              </div>

              {/* Service Add/Edit Inline Form */}
              {showServiceForm && (
                <form onSubmit={handleSaveServiceForm} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
                  <h4 className="font-bold text-white text-sm">
                    {editingServiceId ? 'Edit Service' : 'Add New Service'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 font-semibold mb-1">Service Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Haircut / Consultation / KYC Enquiry"
                        value={svcName}
                        onChange={(e) => setSvcName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Duration (mins)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={svcDuration}
                        onChange={(e) => setSvcDuration(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={svcPrice}
                        onChange={(e) => setSvcPrice(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Description (Optional)</label>
                      <input
                        type="text"
                        placeholder="Brief service details"
                        value={svcDesc}
                        onChange={(e) => setSvcDesc(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowServiceForm(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingSvc}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md"
                    >
                      {savingSvc ? 'Saving...' : editingServiceId ? 'Update Service' : 'Save Service'}
                    </button>
                  </div>
                </form>
              )}

              {/* Services Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3 rounded-l-xl">Service Name</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right rounded-r-xl">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {servicesList.map((svc) => (
                      <tr key={svc.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-bold text-white text-sm">
                          {svc.name}
                          {svc.description && <span className="block text-[10px] text-slate-400 font-normal mt-0.5">{svc.description}</span>}
                        </td>
                        <td className="p-3.5 font-mono text-blue-400 font-semibold">{svc.durationMinutes} mins</td>
                        <td className="p-3.5 font-mono text-slate-200">₹{svc.price}</td>
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              svc.isActive
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                            }`}
                          >
                            {svc.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditService(svc)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-[11px]"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(svc.id, svc.isActive)}
                            className={`px-2.5 py-1 font-semibold rounded-lg text-[11px] border ${
                              svc.isActive
                                ? 'bg-rose-950/60 hover:bg-rose-900 border-rose-800 text-rose-300'
                                : 'bg-emerald-950/60 hover:bg-emerald-900 border-emerald-800 text-emerald-300'
                            }`}
                          >
                            {svc.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowServicesModal(false)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Queue Configuration Settings Modal */}
        {showQueueSettingsModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    📋 Queue Configuration
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Customize operational capacity, prefix, and status.</p>
                </div>
                <button
                  onClick={() => setShowQueueSettingsModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              {qSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold">
                  ✅ {qSuccess}
                </div>
              )}

              {qError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-semibold">
                  ⚠️ {qError}
                </div>
              )}

              <form onSubmit={handleSaveQueueSettings} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Queue Name</label>
                  <input
                    type="text"
                    required
                    value={qName}
                    onChange={(e) => setQName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Queue Operational Status</label>
                    <select
                      value={qIsOpen ? 'open' : 'closed'}
                      onChange={(e) => setQIsOpen(e.target.value === 'open')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 font-bold"
                    >
                      <option value="open">🟢 OPEN (Accept Tokens)</option>
                      <option value="closed">🔴 CLOSED (Block New Tokens)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Token Prefix</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. S, GOV, CLI, BANK"
                      value={qTokenPrefix}
                      onChange={(e) => setQTokenPrefix(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Max Daily Capacity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={qMaxCapacity}
                      onChange={(e) => setQMaxCapacity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Avg Service Duration (mins)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={qAvgDuration}
                      onChange={(e) => setQAvgDuration(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowQueueSettingsModal(false)}
                    className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={savingQSettings}
                    className="w-1/2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    {savingQSettings ? 'Saving...' : 'Save Queue Config'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
