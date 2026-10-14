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
  testMessagingAlertApi,
  skipTokenApi,
} from '../services/api';
import { subscribeQueueRealtime } from '../services/realtime';
import { useAuth } from '../context/AuthContext';
import { getIndustryConfig } from '../config/industryTerminology';
import QRPanel from '../components/QRPanel';
import LogoMark from '../components/LogoMark';

// Phase 2 UI Primitives
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';

// Analytics Master Section
import AnalyticsSection from '../components/analytics/AnalyticsSection';

export default function BusinessDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const activeBusinessId = user?.businessId || '';

  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callingNext, setCallingNext] = useState(false);
  const [completingServiceState, setCompletingServiceState] = useState(false);
  const [skippingTokenId, setSkippingTokenId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // QR Panel State
  const [showQRPanel, setShowQRPanel] = useState(false);

  // Queue Configuration State
  const [showQueueSettingsModal, setShowQueueSettingsModal] = useState(false);
  const [qName, setQName] = useState('Main Queue');
  const [qIsOpen, setQIsOpen] = useState(true);
  const [qTokenPrefix, setQTokenPrefix] = useState('S');
  const [qMaxCapacity, setQMaxCapacity] = useState('200');
  const [qAvgDuration, setQAvgDuration] = useState('15');
  const [qSmsEnabled, setQSmsEnabled] = useState(true);
  const [qWaEnabled, setQWaEnabled] = useState(false);
  const [qAlertThreshold, setQAlertThreshold] = useState('2');
  const [testAlertPhone, setTestAlertPhone] = useState('');
  const [testAlertSending, setTestAlertSending] = useState(false);
  const [testAlertFeedback, setTestAlertFeedback] = useState(null);
  const [savingQSettings, setSavingQSettings] = useState(false);
  const [qSuccess, setQSuccess] = useState(null);
  const [qError, setQError] = useState(null);

  // Industry-Agnostic Terminology Resolution
  const activeCategory = profile?.category || queueData?.business?.category || user?.category || 'salon';
  const terms = getIndustryConfig(activeCategory);

  const fetchQueueSettings = async () => {
    try {
      const res = await getQueueSettingsApi();
      if (res.data) {
        setQName(res.data.name || 'Main Queue');
        setQIsOpen(Boolean(res.data.isOpen));
        setQTokenPrefix(res.data.tokenPrefix || 'S');
        setQMaxCapacity(String(res.data.maxDailyCapacity || 200));
        setQAvgDuration(String(res.data.avgServiceDuration || 15));
        setQSmsEnabled(res.data.smsNotificationsEnabled !== false);
        setQWaEnabled(Boolean(res.data.whatsappNotificationsEnabled));
        setQAlertThreshold(String(res.data.turnAlertThreshold || 2));
      }
    } catch (err) {}
  };

  const handleSaveQueueSettings = async (e) => {
    e.preventDefault();
    setSavingQSettings(true);
    setQSuccess(null);
    setQError(null);

    try {
      await updateQueueSettingsApi({
        name: qName,
        isOpen: qIsOpen,
        tokenPrefix: qTokenPrefix,
        maxDailyCapacity: Number(qMaxCapacity),
        avgServiceDuration: Number(qAvgDuration),
        smsNotificationsEnabled: qSmsEnabled,
        whatsappNotificationsEnabled: qWaEnabled,
        turnAlertThreshold: Number(qAlertThreshold),
      });

      setQSuccess('Queue configuration & notification settings updated successfully!');
      setSavingQSettings(false);
      fetchQueue(true);
    } catch (err) {
      setQError(err.message || 'Failed to update queue settings.');
      setSavingQSettings(false);
    }
  };

  const handleQuickToggleQueue = async () => {
    const nextState = !qIsOpen;
    try {
      await updateQueueSettingsApi({
        name: qName,
        isOpen: nextState,
        tokenPrefix: qTokenPrefix,
        maxDailyCapacity: Number(qMaxCapacity),
        avgServiceDuration: Number(qAvgDuration),
      });
      setQIsOpen(nextState);
      setInfoMessage(`Queue has been turned ${nextState ? 'OPEN' : 'CLOSED'}.`);
      fetchQueue(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to toggle queue status.');
    }
  };

  const handleSendTestAlert = async (channel) => {
    if (!testAlertPhone || testAlertPhone.trim().length < 8) {
      setTestAlertFeedback({ error: 'Please enter a valid phone number (minimum 8 digits).' });
      return;
    }
    setTestAlertSending(true);
    setTestAlertFeedback(null);
    try {
      const res = await testMessagingAlertApi({ channel, testPhone: testAlertPhone.trim() });
      setTestAlertFeedback({
        success: `Test ${channel} alert sent via ${res.data?.provider || 'mock'}! Status: ${res.data?.status || 'DISPATCHED'}`,
      });
      setTestAlertSending(false);
    } catch (err) {
      setTestAlertFeedback({ error: err.message || 'Failed to dispatch test alert.' });
      setTestAlertSending(false);
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
      if (res.data?.queue) {
        setQIsOpen(Boolean(res.data.queue.isOpen));
        setQName(res.data.queue.name || 'Main Queue');
      }
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

  // Initial Fetch, Realtime SSE Subscription & Auto-Refresh Fallback
  useEffect(() => {
    let isMounted = true;

    fetchQueue(false);
    fetchProfile();
    fetchServices();
    fetchQueueSettings();

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
        setInfoMessage(`No ${terms.customerPlural.toLowerCase()} are currently waiting in the ${terms.queueTerm.toLowerCase()}.`);
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

  // Handle Skip Token
  const handleSkipToken = async (targetTokenId = null) => {
    const tokToSkip = targetTokenId || (waitingTokens.length > 0 ? (waitingTokens[0]?.tokenId || waitingTokens[0]?.id) : null);
    if (!tokToSkip) {
      setErrorMessage(`No waiting ${terms.customerTerm.toLowerCase()} to skip.`);
      return;
    }

    setSkippingTokenId(tokToSkip);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const res = await skipTokenApi({
        businessId: activeBusinessId,
        queueId: queueData?.queue?.id,
        tokenId: tokToSkip,
      });
      setInfoMessage(`Token #${res.data?.tokenNumber || ''} skipped.`);
      await fetchQueue(true);
      setSkippingTokenId(null);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to skip token.');
      setSkippingTokenId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const servingToken = queueData?.tokens?.find((t) => t.status === 'SERVING');
  const waitingTokens = queueData?.tokens?.filter((t) => t.status === 'WAITING') || [];

  // Average wait estimation across waiting tokens
  const avgWaitMins =
    waitingTokens.length > 0
      ? Math.round(
          waitingTokens.reduce((acc, t) => acc + Number(t.estimatedWaitMinutes || 0), 0) /
            waitingTokens.length
        )
      : Number(qAvgDuration || 15);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* Top Sticky Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Brand & Business Info */}
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/" className="flex-shrink-0" aria-label="Shewwina Home">
                <LogoMark className="w-9 h-9" variant="emerald" iconSize="w-4.5 h-4.5" />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-bold text-base sm:text-lg text-slate-900 truncate tracking-tight">
                    {queueData?.business?.name || profile?.name || user?.name || 'Shewwina Dashboard'}
                  </h1>
                  <Badge variant="slate" size="sm" className="hidden sm:inline-flex">
                    {terms.icon} {terms.categoryName}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="truncate">
                    {terms.queueTerm}: <strong className="text-slate-700 font-semibold">{queueData?.queue?.name || qName}</strong>
                  </span>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={handleQuickToggleQueue}
                    title="Click to toggle queue status"
                    className="inline-flex items-center gap-1 font-semibold hover:opacity-80 transition-opacity"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        qIsOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                    <span className={qIsOpen ? 'text-emerald-700' : 'text-rose-700'}>
                      {qIsOpen ? 'OPEN' : 'CLOSED'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Navigation & Actions */}
            <div className="hidden lg:flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                id="open-customer-qr"
                onClick={() => setShowQRPanel(true)}
                icon={
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                  </svg>
                }
              >
                QR Check-in
              </Button>

              <a
                id="open-tv-display"
                href={`/display/${activeBusinessId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center font-medium rounded-xl transition-all text-xs gap-1.5 min-h-[32px] px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:border-slate-300"
                title="Open full-screen Live Waiting Room TV Display in a new tab"
              >
                <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                </svg>
                <span>TV Display</span>
              </a>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setShowServicesModal(true); fetchServices(); }}
                icon={
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                  </svg>
                }
              >
                {terms.servicePlural}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setShowQueueSettingsModal(true); fetchQueueSettings(); }}
                icon={
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
                  </svg>
                }
              >
                Queue Config
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowProfileModal(true)}
                icon={
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                  </svg>
                }
              >
                Settings
              </Button>

              <button
                type="button"
                onClick={() => fetchQueue(false)}
                title="Refresh queue data"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                aria-label="Refresh Queue"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
              </button>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                icon={
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                }
              >
                Log Out
              </Button>
            </div>

            {/* Mobile Navigation Hamburger */}
            <div className="flex lg:hidden items-center gap-1.5">
              <button
                type="button"
                onClick={() => fetchQueue(false)}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
                aria-label="Sync Queue"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
                aria-label="Open navigation menu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 shadow-lg animate-fadeIn">
            <div className="grid grid-cols-2 gap-2 pb-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                onClick={() => { setMobileMenuOpen(false); setShowQRPanel(true); }}
              >
                📷 Customer QR
              </Button>
              <a
                href={`/display/${activeBusinessId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-start text-xs font-semibold px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
              >
                📺 TV Display
              </a>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                onClick={() => { setMobileMenuOpen(false); setShowServicesModal(true); fetchServices(); }}
              >
                🛠️ {terms.servicePlural}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-start"
                onClick={() => { setMobileMenuOpen(false); setShowQueueSettingsModal(true); fetchQueueSettings(); }}
              >
                ⚙️ Queue Config
              </Button>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); setShowProfileModal(true); }}
                className="text-xs font-semibold text-slate-700 hover:text-indigo-600"
              >
                Business Profile
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                Log Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Dashboard Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Info / Success Feedback Banner */}
        {infoMessage && (
          <div
            role="status"
            className="mb-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">ℹ️</span>
              <span>{infoMessage}</span>
            </div>
            <button
              onClick={() => setInfoMessage(null)}
              className="text-indigo-500 hover:text-indigo-800 p-1 rounded font-bold"
              aria-label="Dismiss message"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error Feedback Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">⚠️</span>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-800 p-1 rounded font-bold"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* AI Queue Forecast Banner */}
        {queueData?.queueInsights && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-white border border-indigo-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg flex-shrink-0">
                🤖
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>AI {terms.queueTerm} Forecast</span>
                  <Badge
                    variant={
                      queueData.queueInsights.loadLevel === 'HIGH'
                        ? 'rose'
                        : queueData.queueInsights.loadLevel === 'MODERATE'
                        ? 'amber'
                        : 'emerald'
                    }
                    size="sm"
                    dot
                  >
                    {queueData.queueInsights.loadLevel} LOAD
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Est. Clear Time: <strong className="text-slate-800">~{queueData.queueInsights.aiAdjustedClearTimeMinutes} min</strong> (Standard model: ~{queueData.queueInsights.estimatedClearTimeMinutes} min)
                </p>
              </div>
            </div>
            {queueData.queueInsights.peakWarning && (
              <Badge variant="amber" size="md">
                ⚠️ Peak Volume Alert
              </Badge>
            )}
          </div>
        )}

        {/* Overview / KPI Section */}
        <section aria-label="Key Performance Indicators" className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
            <StatCard
              title={`Waiting in ${terms.queueTerm}`}
              value={queueData?.waitingCount ?? waitingTokens.length}
              subtitle={`Active in queue line`}
              accent="amber"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            <StatCard
              title={`Currently ${terms.servingTerm}`}
              value={queueData?.servingCount ?? (servingToken ? 1 : 0)}
              subtitle={servingToken ? `Token #${servingToken.tokenNumber}` : 'None active'}
              accent="emerald"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />

            <StatCard
              title={`Total ${terms.customerPlural} Today`}
              value={queueData?.totalTokens ?? 0}
              subtitle="Generated tokens"
              accent="indigo"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              }
            />

            <StatCard
              title={`${terms.customerPlural} Served Today`}
              value={queueData?.customersServedToday ?? 0}
              subtitle="Completed services"
              accent="emerald"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            <StatCard
              title="Estimated Revenue"
              value={`₹${Number(queueData?.estimatedRevenueToday || 0).toLocaleString('en-IN')}`}
              subtitle={`${queueData?.customersServedToday || 0} billed today`}
              accent="emerald"
              className="col-span-2 sm:col-span-1"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        </section>

        {/* Live Active Serving & Action Control Hero Card */}
        <section aria-label="Active Queue Control" className="mb-8">
          <Card className="p-6 sm:p-8 bg-white border border-slate-200/80 shadow-md shadow-slate-900/5">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">

              {/* Active Serving Token Display */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
                    Currently Active {terms.servingTerm}
                  </span>
                  {servingToken && (
                    <Badge variant="emerald" dot size="sm">
                      Serving Now
                    </Badge>
                  )}
                </div>

                {servingToken ? (
                  <div className="flex flex-wrap items-baseline gap-4 pt-1">
                    <span className="text-4xl sm:text-5xl font-black text-emerald-600 font-mono tracking-tight">
                      #{servingToken.tokenNumber}
                    </span>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                        {servingToken.customerName}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        {terms.serviceTerm}: <strong className="text-slate-800 font-semibold">{servingToken.service}</strong> • {servingToken.customerPhone}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2">
                    <p className="text-sm font-medium text-slate-500 italic">
                      No {terms.customerTerm.toLowerCase()} is currently being served. Click "{terms.actionCallNext}" to begin.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                {servingToken && (
                  <>
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={handleCompleteService}
                      loading={completingServiceState}
                      disabled={completingServiceState}
                      className="border-emerald-200 hover:border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      icon={
                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      }
                    >
                      {terms.actionComplete}
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => handleSkipToken()}
                      disabled={Boolean(skippingTokenId) || waitingTokens.length === 0}
                      className="border-amber-200 text-amber-800 hover:bg-amber-50 hover:border-amber-300"
                      icon={
                        <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      }
                    >
                      {skippingTokenId ? 'Skipping...' : `Skip Next`}
                    </Button>
                  </>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleCallNext}
                  loading={callingNext}
                  disabled={callingNext || waitingTokens.length === 0}
                  className="font-bold shadow-md shadow-indigo-600/20 px-8"
                  icon={
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  }
                >
                  {terms.actionCallNext.toUpperCase()}
                </Button>
              </div>

            </div>
          </Card>
        </section>

        {/* Live Waiting List Table */}
        <section aria-label="Waiting List" className="mb-8">
          <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Waiting {terms.customerPlural}</span>
                  <Badge variant="amber" size="sm">
                    {waitingTokens.length} in line
                  </Badge>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Est. Average wait: <strong className="text-slate-800">{avgWaitMins} mins</strong> per ticket.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Real-time SSE Live Connection</span>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-slate-500 font-mono">
                Synchronizing queue data...
              </div>
            ) : waitingTokens.length === 0 ? (
              <EmptyState
                title={`No ${terms.customerPlural.toLowerCase()} currently waiting`}
                description={`New tokens joined via customer QR or link will instantly appear here.`}
                className="py-12"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5 pl-6">Pos</th>
                      <th className="p-3.5">Token #</th>
                      <th className="p-3.5">{terms.customerTerm}</th>
                      <th className="p-3.5">Phone</th>
                      <th className="p-3.5">{terms.serviceTerm}</th>
                      <th className="p-3.5">Est. Wait</th>
                      <th className="p-3.5 pr-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {waitingTokens.map((tok, idx) => (
                      <tr key={tok.tokenId || tok.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 pl-6 font-bold text-amber-600">
                          #{idx + 1}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-900 text-sm">
                          #{tok.tokenNumber}
                        </td>
                        <td className="p-3.5 text-slate-900 font-semibold">
                          {tok.customerName}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">
                          {tok.customerPhone}
                        </td>
                        <td className="p-3.5">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {tok.service}
                          </span>
                        </td>
                        <td className="p-3.5 text-indigo-600 font-mono font-semibold">
                          ~{tok.estimatedWaitMinutes} mins
                        </td>
                        <td className="p-3.5 pr-6 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSkipToken(tok.tokenId || tok.id)}
                            disabled={skippingTokenId === (tok.tokenId || tok.id)}
                            className="text-amber-800 border-amber-200 hover:bg-amber-50"
                          >
                            {skippingTokenId === (tok.tokenId || tok.id) ? 'Skipping...' : 'Skip'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>

        {/* Dedicated Analytics & Graphs Section */}
        <AnalyticsSection
          queueData={queueData}
          waitingTokens={waitingTokens}
          servicesList={servicesList}
          terms={terms}
          avgServiceDuration={Number(qAvgDuration || 15)}
        />

      </main>

      {/* Business Profile Settings Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Business Profile Settings"
        description="Update contact details, category, and operating address."
        maxWidth="max-w-lg"
      >
        {profileSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <span>✅</span>
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <Input
            label="Business Name"
            type="text"
            required
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Business Vertical"
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
            >
              <option value="salon">Salon &amp; Spa</option>
              <option value="clinic">Clinic &amp; Healthcare</option>
              <option value="hospital">Hospital OPD</option>
              <option value="bank">Banking &amp; Financial</option>
              <option value="restaurant">Restaurant &amp; Dining</option>
              <option value="government">Government Office</option>
              <option value="service">Service &amp; Repair</option>
              <option value="education">Education</option>
            </Select>

            <Input
              label="Contact Phone"
              type="tel"
              required
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
            />
          </div>

          <Input
            label="Street Address"
            type="text"
            required
            value={editAddress}
            onChange={(e) => setEditAddress(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              type="text"
              required
              value={editCity}
              onChange={(e) => setEditCity(e.target.value)}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Current Operational Mode
              </label>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{qIsOpen ? 'QUEUE OPEN' : 'QUEUE CLOSED'}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => setShowProfileModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={savingProfile}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Services Management Modal */}
      <Modal
        isOpen={showServicesModal}
        onClose={() => setShowServicesModal(false)}
        title={`${terms.servicePlural} Management`}
        description={`Configure offerings, estimated durations, and prices for ${terms.categoryName}.`}
        maxWidth="max-w-2xl"
      >
        {svcSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            ✅ {svcSuccess}
          </div>
        )}

        {svcError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            ⚠️ {svcError}
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Catalog ({servicesList.length})
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddService}
          >
            + Add New {terms.serviceTerm}
          </Button>
        </div>

        {showServiceForm && (
          <form onSubmit={handleSaveServiceForm} className="mb-5 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">
              {editingServiceId ? `Edit ${terms.serviceTerm}` : `Add New ${terms.serviceTerm}`}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input
                  label={`${terms.serviceTerm} Name`}
                  type="text"
                  required
                  placeholder="e.g. Haircut / Consultation / KYC"
                  value={svcName}
                  onChange={(e) => setSvcName(e.target.value)}
                />
              </div>
              <div>
                <Input
                  label="Duration (mins)"
                  type="number"
                  min="1"
                  required
                  value={svcDuration}
                  onChange={(e) => setSvcDuration(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Price (₹)"
                type="number"
                min="0"
                step="0.01"
                required
                value={svcPrice}
                onChange={(e) => setSvcPrice(e.target.value)}
              />
              <Input
                label="Description (Optional)"
                type="text"
                placeholder="Brief service description"
                value={svcDesc}
                onChange={(e) => setSvcDesc(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowServiceForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={savingSvc}
              >
                {savingSvc ? 'Saving...' : editingServiceId ? 'Update' : 'Save'}
              </Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto max-h-[50vh] overflow-y-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200">
              <tr>
                <th className="p-3">{terms.serviceTerm}</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Price</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {servicesList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-slate-400">
                    No services created yet. Click "+ Add New {terms.serviceTerm}" above.
                  </td>
                </tr>
              ) : (
                servicesList.map((svc) => (
                  <tr key={svc.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-semibold text-slate-900">
                      {svc.name}
                      {svc.description && (
                        <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                          {svc.description}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-indigo-600 font-mono">
                      {svc.durationMinutes} mins
                    </td>
                    <td className="p-3 font-mono text-slate-800">
                      ₹{svc.price}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={svc.isActive ? 'emerald' : 'slate'}
                        size="sm"
                      >
                        {svc.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditService(svc)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant={svc.isActive ? 'destructive' : 'secondary'}
                        size="sm"
                        onClick={() => handleToggleStatus(svc.id, svc.isActive)}
                      >
                        {svc.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            variant="secondary"
            onClick={() => setShowServicesModal(false)}
          >
            Done
          </Button>
        </div>
      </Modal>

      {/* Queue Configuration Settings Modal */}
      <Modal
        isOpen={showQueueSettingsModal}
        onClose={() => setShowQueueSettingsModal(false)}
        title="Queue &amp; Notification Configuration"
        description="Operational capacity, token prefix, and SMS/WhatsApp alert dispatch thresholds."
        maxWidth="max-w-lg"
      >
        {qSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            ✅ {qSuccess}
          </div>
        )}

        {qError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            ⚠️ {qError}
          </div>
        )}

        <form onSubmit={handleSaveQueueSettings} className="space-y-4 text-xs">
          <Input
            label="Queue Display Name"
            type="text"
            required
            value={qName}
            onChange={(e) => setQName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Queue Status"
              value={qIsOpen ? 'open' : 'closed'}
              onChange={(e) => setQIsOpen(e.target.value === 'open')}
            >
              <option value="open">🟢 OPEN (Accepting Tokens)</option>
              <option value="closed">🔴 CLOSED (Pause Intake)</option>
            </Select>

            <Input
              label="Token Prefix"
              type="text"
              required
              placeholder="e.g. S, GOV, CLI"
              value={qTokenPrefix}
              onChange={(e) => setQTokenPrefix(e.target.value.toUpperCase())}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Max Daily Tokens"
              type="number"
              min="1"
              required
              value={qMaxCapacity}
              onChange={(e) => setQMaxCapacity(e.target.value)}
            />
            <Input
              label="Avg Service (mins)"
              type="number"
              min="1"
              required
              value={qAvgDuration}
              onChange={(e) => setQAvgDuration(e.target.value)}
            />
          </div>

          {/* Alert Preferences */}
          <div className="pt-2 border-t border-slate-100">
            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Customer Notification Gateways
            </span>
            <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2.5 cursor-pointer text-slate-800 font-semibold">
                <input
                  type="checkbox"
                  checked={qSmsEnabled}
                  onChange={(e) => setQSmsEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span>SMS Notifications (Fast2SMS / Twilio)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-slate-800 font-semibold">
                <input
                  type="checkbox"
                  checked={qWaEnabled}
                  onChange={(e) => setQWaEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span>WhatsApp Alerts (Meta Cloud API / Twilio)</span>
              </label>

              <div className="pt-1.5">
                <Select
                  label="Dispatch Turn Alert When:"
                  value={qAlertThreshold}
                  onChange={(e) => setQAlertThreshold(e.target.value)}
                >
                  <option value="1">1 customer ahead (approx 10-15 mins)</option>
                  <option value="2">2 customers ahead (Recommended)</option>
                  <option value="3">3 customers ahead (approx 30-45 mins)</option>
                  <option value="4">4 customers ahead</option>
                  <option value="5">5 customers ahead</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Test Alert Dispatch */}
          <div className="pt-1">
            <span className="block text-[11px] font-semibold text-slate-600 mb-1">
              Test Alert Dispatch (MOCK provider by default)
            </span>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="Enter 10-digit phone"
                value={testAlertPhone}
                onChange={(e) => setTestAlertPhone(e.target.value)}
                className="w-2/3 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-1/3"
                loading={testAlertSending}
                disabled={testAlertSending}
                onClick={() => handleSendTestAlert('SMS')}
              >
                Test SMS
              </Button>
            </div>
            {testAlertFeedback?.success && (
              <div className="mt-1.5 text-[11px] text-emerald-600 font-medium">
                ✅ {testAlertFeedback.success}
              </div>
            )}
            {testAlertFeedback?.error && (
              <div className="mt-1.5 text-[11px] text-rose-600 font-medium">
                ⚠️ {testAlertFeedback.error}
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => setShowQueueSettingsModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={savingQSettings}
            >
              Save Configuration
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer QR Code Panel Modal */}
      {showQRPanel && (
        <QRPanel
          onClose={() => setShowQRPanel(false)}
          businessDisplayName={queueData?.business?.name || profile?.name}
        />
      )}

    </div>
  );
}
