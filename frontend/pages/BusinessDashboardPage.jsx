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
import ClinicsSection from '../components/ClinicsSection';

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
  const [activeSection, setActiveSection] = useState('dashboard'); // 'dashboard' | 'queue' | 'services' | 'customers' | 'analytics'
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerFilterStatus, setCustomerFilterStatus] = useState('ALL');

  const getInitials = (name) => {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

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
  const allCustomerTokens = queueData?.tokens || [];
  const servedTokens = queueData?.tokens?.filter((t) => t.status === 'SERVED') || [];

  const filteredCustomerTokens = allCustomerTokens.filter((tok) => {
    if (customerFilterStatus !== 'ALL' && tok.status !== customerFilterStatus) return false;
    if (customerSearch.trim()) {
      const q = customerSearch.toLowerCase();
      const matchName = tok.customerName?.toLowerCase().includes(q);
      const matchPhone = tok.customerPhone?.includes(q);
      const matchToken = tok.tokenNumber?.toLowerCase().includes(q);
      const matchService = tok.service?.toLowerCase().includes(q);
      return matchName || matchPhone || matchToken || matchService;
    }
    return true;
  });

  // Average wait estimation across waiting tokens
  const avgWaitMins =
    waitingTokens.length > 0
      ? Math.round(
          waitingTokens.reduce((acc, t) => acc + Number(t.estimatedWaitMinutes || 0), 0) /
            waitingTokens.length
        )
      : Number(qAvgDuration || 15);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-emerald-600 selection:text-white flex flex-col lg:flex-row">
      {/* ========================================================= */}
      {/* 1. PERSISTENT LEFT SIDEBAR (GROOMVY SALON STYLE)          */}
      {/* ========================================================= */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-slate-200/90 flex-shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto z-30">
        {/* Salon / Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 min-w-0" aria-label="Shewwina Home">
            <LogoMark className="w-9 h-9" variant="emerald" iconSize="w-4.5 h-4.5" />
            <div className="min-w-0">
              <span className="font-display font-black text-base tracking-tight text-slate-900 block leading-tight">
                Shewwina
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 tracking-wider uppercase block">
                Salon OS
              </span>
            </div>
          </Link>
          <Badge variant="emerald" size="sm" className="font-bold">
            PRO
          </Badge>
        </div>

        {/* Current Active Salon Info Card */}
        <div className="p-3.5 mx-3 mt-3 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-slate-900 truncate tracking-tight">
              {queueData?.business?.name || profile?.name || user?.name || 'My Salon'}
            </h2>
            <button
              type="button"
              onClick={handleQuickToggleQueue}
              title="Click to toggle queue status"
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                qIsOpen
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${qIsOpen ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`} />
              <span>{qIsOpen ? 'OPEN' : 'PAUSED'}</span>
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
            <span>{terms.icon}</span>
            <span className="truncate">{terms.categoryName}</span>
            <span>•</span>
            <span className="text-slate-600 font-medium truncate">{queueData?.queue?.name || qName}</span>
          </div>
        </div>

        {/* 10 Navigation Items with Consistent Clean Icons */}
        <nav className="p-3 space-y-1 text-xs font-medium flex-1" aria-label="Sidebar Navigation">
          <div className="pb-1 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">
              Management
            </span>
          </div>

          {/* 1. Dashboard */}
          <button
            type="button"
            onClick={() => setActiveSection('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
              activeSection === 'dashboard'
                ? 'bg-emerald-50 text-emerald-900 font-bold shadow-xs border border-emerald-200/70'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <svg className={`w-4 h-4 ${activeSection === 'dashboard' ? 'text-emerald-700' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
              <span>Dashboard</span>
            </div>
          </button>

          {/* 2. Live Queue */}
          <button
            type="button"
            onClick={() => setActiveSection('queue')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
              activeSection === 'queue'
                ? 'bg-emerald-50 text-emerald-900 font-bold shadow-xs border border-emerald-200/70'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <svg className={`w-4 h-4 ${activeSection === 'queue' ? 'text-emerald-700' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Live Queue</span>
            </div>
            {waitingTokens.length > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {waitingTokens.length}
              </span>
            )}
          </button>

          {/* 3. Services */}
          <button
            type="button"
            onClick={() => { setActiveSection('services'); fetchServices(); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
              activeSection === 'services'
                ? 'bg-emerald-50 text-emerald-900 font-bold shadow-xs border border-emerald-200/70'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <svg className={`w-4 h-4 ${activeSection === 'services' ? 'text-emerald-700' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
              </svg>
              <span>Services</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              {servicesList.length}
            </span>
          </button>

          {/* 4. Customers */}
          <button
            type="button"
            onClick={() => setActiveSection('customers')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
              activeSection === 'customers'
                ? 'bg-emerald-50 text-emerald-900 font-bold shadow-xs border border-emerald-200/70'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <svg className={`w-4 h-4 ${activeSection === 'customers' ? 'text-emerald-700' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Customers</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              {allCustomerTokens.length}
            </span>
          </button>

          {/* 4b. Clinics */}
          <button
            type="button"
            onClick={() => setActiveSection('clinics')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
              activeSection === 'clinics'
                ? 'bg-emerald-50 text-emerald-900 font-bold shadow-xs border border-emerald-200/70'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <svg className={`w-4 h-4 ${activeSection === 'clinics' ? 'text-emerald-700' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8M8 12h8" />
              </svg>
              <span>Clinics</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200/60">
              OPD
            </span>
          </button>

          {/* 5. QR Check-in */}
          <button
            type="button"
            id="open-customer-qr"
            onClick={() => setShowQRPanel(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-all text-left"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>QR Check-in</span>
          </button>

          {/* 6. Analytics & Reports */}
          <button
            type="button"
            onClick={() => setActiveSection('analytics')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
              activeSection === 'analytics'
                ? 'bg-emerald-50 text-emerald-900 font-bold shadow-xs border border-emerald-200/70'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <svg className={`w-4 h-4 ${activeSection === 'analytics' ? 'text-emerald-700' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Analytics &amp; Reports</span>
            </div>
          </button>

          {/* 7. TV Display */}
          <a
            id="open-tv-display"
            href={`/display/${activeBusinessId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-all text-left"
            title="Open full-screen Live Waiting Room TV Display in a new tab"
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
              </svg>
              <span>TV Display</span>
            </div>
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          <div className="pt-3 pb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">
              Settings &amp; Store
            </span>
          </div>

          {/* 8. Queue Settings */}
          <button
            type="button"
            onClick={() => { setShowQueueSettingsModal(true); fetchQueueSettings(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-all text-left"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
            </svg>
            <span>Queue Settings</span>
          </button>

          {/* 9. Salon Profile */}
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-all text-left"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            <span>Salon Profile</span>
          </button>
        </nav>

        {/* 10. Logout Button & Profile Card in Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60 mt-auto">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {getInitials(user?.name || 'M')}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {user?.name || 'Manager'}
                </span>
                <span className="text-[10px] text-slate-500 truncate block">
                  Salon Manager
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Log Out"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MOBILE DRAWER NAVIGATION                                  */}
      {/* ========================================================= */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <LogoMark className="w-8 h-8" variant="emerald" iconSize="w-4 h-4" />
            <div className="min-w-0">
              <h1 className="font-display font-bold text-sm text-slate-900 truncate">
                {queueData?.business?.name || profile?.name || 'Shewwina'}
              </h1>
              <span className="text-[10px] font-semibold text-emerald-700 block">
                {terms.categoryName} • {qIsOpen ? 'OPEN' : 'PAUSED'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fetchQueue(false)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Refresh Queue"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100"
              aria-label="Open mobile navigation menu"
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

        {/* Mobile Navigation Drawer with all 10 Items */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-3 space-y-2 shadow-lg max-h-[85vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 pb-2">
              {/* 1. Dashboard */}
              <button
                type="button"
                onClick={() => { setActiveSection('dashboard'); setMobileMenuOpen(false); }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold text-left flex items-center gap-2 ${
                  activeSection === 'dashboard' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <span>📊</span>
                <span>Dashboard</span>
              </button>

              {/* 2. Live Queue */}
              <button
                type="button"
                onClick={() => { setActiveSection('queue'); setMobileMenuOpen(false); }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold text-left flex items-center gap-2 ${
                  activeSection === 'queue' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <span>📋</span>
                <span>Live Queue</span>
              </button>

              {/* 3. Services */}
              <button
                type="button"
                onClick={() => { setActiveSection('services'); fetchServices(); setMobileMenuOpen(false); }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold text-left flex items-center gap-2 ${
                  activeSection === 'services' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <span>✂️</span>
                <span>Services</span>
              </button>

              {/* 4. Customers */}
              <button
                type="button"
                onClick={() => { setActiveSection('customers'); setMobileMenuOpen(false); }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold text-left flex items-center gap-2 ${
                  activeSection === 'customers' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <span>👥</span>
                <span>Customers</span>
              </button>

              {/* Clinics */}
              <button
                type="button"
                onClick={() => { setActiveSection('clinics'); setMobileMenuOpen(false); }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold text-left flex items-center gap-2 ${
                  activeSection === 'clinics' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <span>🏥</span>
                <span>Clinics</span>
              </button>

              {/* 5. QR Check-in */}
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); setShowQRPanel(true); }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-left flex items-center gap-2 bg-slate-50 text-slate-700"
              >
                <span>📱</span>
                <span>QR Check-in</span>
              </button>

              {/* 6. Analytics & Reports */}
              <button
                type="button"
                onClick={() => { setActiveSection('analytics'); setMobileMenuOpen(false); }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold text-left flex items-center gap-2 ${
                  activeSection === 'analytics' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <span>📈</span>
                <span>Analytics</span>
              </button>

              {/* 7. TV Display */}
              <a
                href={`/display/${activeBusinessId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-left flex items-center gap-2 bg-slate-50 text-slate-700"
              >
                <span>📺</span>
                <span>TV Display</span>
              </a>

              {/* 8. Queue Settings */}
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); setShowQueueSettingsModal(true); fetchQueueSettings(); }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-left flex items-center gap-2 bg-slate-50 text-slate-700"
              >
                <span>⚙️</span>
                <span>Queue Settings</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              {/* 9. Salon Profile */}
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); setShowProfileModal(true); }}
                className="text-xs font-semibold text-slate-700 hover:text-emerald-700"
              >
                Salon Profile
              </button>

              {/* 10. Logout */}
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
      </div>

      {/* ========================================================= */}
      {/* MAIN WORKSPACE CONTENT AREA                               */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {/* Top Sticky App Header */}
        <header className="hidden lg:flex sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 lg:px-8 py-3.5 items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {queueData?.business?.name || profile?.name || 'Shewwina Salon'}
              </span>
              <h1 className="font-display font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
                {activeSection === 'dashboard' && 'Dashboard Overview'}
                {activeSection === 'queue' && 'Live Queue & Waiting List'}
                {activeSection === 'services' && 'Services & Pricing Menu'}
                {activeSection === 'customers' && 'Customer Directory & Visit Records'}
                {activeSection === 'clinics' && 'Clinics Management & OPD Queues'}
                {activeSection === 'analytics' && 'Operational Analytics & Reports'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Realtime Live Indicator Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>SSE Realtime Sync</span>
            </div>

            {/* Quick Queue Toggle Pill */}
            <button
              type="button"
              onClick={handleQuickToggleQueue}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                qIsOpen
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${qIsOpen ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`} />
              <span>{qIsOpen ? 'Queue is Open' : 'Queue is Paused'}</span>
            </button>

            {/* Sync Refresh Button */}
            <button
              type="button"
              onClick={() => fetchQueue(false)}
              title="Refresh queue data"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
              aria-label="Refresh Queue"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
            </button>

            {/* TV Display Link */}
            <a
              href={`/display/${activeBusinessId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 shadow-xs transition-colors"
              title="Open full-screen TV display"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
              </svg>
              <span>TV View</span>
            </a>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">

          {/* Friendly Personalized Greeting Banner */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center font-bold text-lg shrink-0">
                👋
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-display text-slate-900">
                  Welcome back, {user?.name || 'Manager'}!
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Here is your live {terms.queueTerm.toLowerCase()} status for{' '}
                  <strong className="text-slate-800 font-semibold">{queueData?.business?.name || profile?.name || 'your business'}</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="text-xs font-semibold text-slate-500">Live Status:</span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                qIsOpen ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${qIsOpen ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`} />
                {qIsOpen ? `${terms.queueTerm} Open` : `${terms.queueTerm} Paused`}
              </span>
            </div>
          </div>

          {/* Info / Success Feedback Banner */}
          {infoMessage && (
            <div
              role="status"
              className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">ℹ️</span>
                <span>{infoMessage}</span>
              </div>
              <button
                onClick={() => setInfoMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 p-1 rounded font-bold"
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
              className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn"
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
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg flex-shrink-0">
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

          {/* ========================================================= */}
          {/* 1. DASHBOARD VIEW (MAIN OVERVIEW & HIGHEST HIERARCHY)     */}
          {/* ========================================================= */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Top Summary Statistics Cards */}
              <section aria-label="Key Performance Indicators">
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
                  <StatCard
                    title={`Waiting in ${terms.queueTerm}`}
                    value={queueData?.waitingCount ?? waitingTokens.length}
                    subtitle="Active in queue line"
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
                    accent="slate"
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

              {/* Station Hero Card with Prominent CALL NEXT CUSTOMER */}
              <section aria-label="Active Station Control">
                <div className="rounded-3xl bg-white border border-emerald-200/90 shadow-md shadow-emerald-950/5 p-6 sm:p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50/70 rounded-full blur-3xl -z-10 pointer-events-none" />

                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
                    {/* Left: Active Serving Station Details */}
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                          Active Salon Chair / Service Station
                        </span>
                        {servingToken ? (
                          <Badge variant="emerald" dot size="sm">
                            Serving In Chair
                          </Badge>
                        ) : (
                          <Badge variant="slate" size="sm">
                            Station Ready
                          </Badge>
                        )}
                      </div>

                      {servingToken ? (
                        <div className="flex flex-wrap items-baseline gap-4 pt-1">
                          <span className="text-4xl sm:text-5xl font-black text-emerald-600 font-mono tracking-tight bg-emerald-50 px-4 py-1.5 rounded-2xl border border-emerald-200/70">
                            #{servingToken.tokenNumber}
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                              {servingToken.customerName}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 flex items-center gap-2">
                              <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                                {servingToken.service}
                              </span>
                              <span>•</span>
                              <span className="font-mono text-slate-600">{servingToken.customerPhone}</span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-xl text-slate-400">
                            💺
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              No {terms.customerTerm.toLowerCase()} is currently in chair.
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {waitingTokens.length > 0
                                ? `${waitingTokens.length} waiting. Click "CALL NEXT CUSTOMER" to call Token #${waitingTokens[0]?.tokenNumber}.`
                                : 'Queue line is currently clear.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: High-Impact Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:shrink-0">
                      {servingToken && (
                        <>
                          <Button
                            variant="secondary"
                            size="lg"
                            onClick={handleCompleteService}
                            loading={completingServiceState}
                            disabled={completingServiceState}
                            className="border-emerald-200 hover:border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold"
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
                            className="border-amber-200 text-amber-800 hover:bg-amber-50 hover:border-amber-300 font-semibold"
                            icon={
                              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                              </svg>
                            }
                          >
                            {skippingTokenId ? 'Skipping...' : 'Skip Next'}
                          </Button>
                        </>
                      )}

                      {/* PROMINENT CALL NEXT BUTTON */}
                      <button
                        type="button"
                        onClick={handleCallNext}
                        disabled={callingNext || waitingTokens.length === 0}
                        className={`font-black text-sm sm:text-base px-7 sm:px-9 py-3.5 sm:py-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg ${
                          callingNext || waitingTokens.length === 0
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5'
                        }`}
                      >
                        {callingNext ? (
                          <>
                            <svg className="w-5 h-5 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
                              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" stroke="currentColor" />
                            </svg>
                            <span>CALLING NEXT...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                            <span>{terms.actionCallNext.toUpperCase()}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Queue Overview Snippet */}
              <Card className="border border-slate-200/90 shadow-xs overflow-hidden rounded-3xl bg-white">
                <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <span>Live Waiting Queue</span>
                      <Badge variant="amber" size="sm">
                        {waitingTokens.length} in line
                      </Badge>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Est. Average wait: <strong className="text-slate-800">{avgWaitMins} mins</strong> per ticket.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveSection('queue')}
                  >
                    Open Full Queue ({waitingTokens.length}) →
                  </Button>
                </div>

                {waitingTokens.length === 0 ? (
                  <EmptyState
                    title="Queue is currently clear"
                    description="When customers check in via QR or link, their tokens will appear here."
                    className="py-10"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
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
                        {waitingTokens.slice(0, 5).map((tok, idx) => (
                          <tr key={tok.tokenId || tok.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5 pl-6">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                                #{idx + 1}
                              </span>
                            </td>
                            <td className="p-3.5 font-mono font-bold text-slate-900 text-sm">
                              <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                #{tok.tokenNumber}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-900 font-semibold">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-center shrink-0">
                                  {getInitials(tok.customerName)}
                                </div>
                                <span className="truncate">{tok.customerName}</span>
                              </div>
                            </td>
                            <td className="p-3.5 font-mono text-slate-500">
                              {tok.customerPhone}
                            </td>
                            <td className="p-3.5">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                                {tok.service}
                              </span>
                            </td>
                            <td className="p-3.5 text-emerald-700 font-mono font-semibold">
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

              {/* Bottom Quick Snapshots: Services & Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-5 sm:p-6 border border-slate-200/90 rounded-3xl bg-white shadow-xs">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <span>Salon Services &amp; Menu</span>
                        <Badge variant="emerald" size="sm">
                          {servicesList.length} Items
                        </Badge>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Manage catalog, prices, and durations.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => { setActiveSection('services'); fetchServices(); }}
                    >
                      Manage Services →
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {servicesList.slice(0, 3).map((svc) => (
                      <div
                        key={svc.id}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 truncate block">
                            {svc.name}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            ⏱️ {svc.durationMinutes} mins
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-emerald-700 block">
                            ₹{svc.price}
                          </span>
                          <span className={`text-[10px] font-semibold ${svc.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {svc.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {servicesList.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No services added yet.
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-5 sm:p-6 border border-slate-200/90 rounded-3xl bg-white shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                          <span>Operational Analytics</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Daily flow throughput and metrics.
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setActiveSection('analytics')}
                      >
                        View Full Charts →
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                        <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                          Average Duration
                        </span>
                        <span className="text-xl font-bold font-mono text-emerald-700 mt-1 block">
                          {qAvgDuration || 15} mins
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          Target duration per visit
                        </span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
                          Daily Capacity
                        </span>
                        <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                          {qMaxCapacity || 200} tokens
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          Max daily tokens
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Waitlist Monitoring Active
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveSection('analytics')}
                      className="font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      Explore Reports →
                    </button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. LIVE QUEUE VIEW                                        */}
          {/* ========================================================= */}
          {activeSection === 'queue' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Station Hero Card with Call Next */}
              <section aria-label="Queue Station Control">
                <div className="rounded-3xl bg-white border border-emerald-200/90 shadow-md shadow-emerald-950/5 p-6 sm:p-8 relative overflow-hidden">
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
                    <div className="space-y-2 flex-1 min-w-0">
                      <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                        Station Chair • Live Serving
                      </span>
                      {servingToken ? (
                        <div className="flex items-center gap-4">
                          <span className="text-3xl sm:text-4xl font-black text-emerald-600 font-mono tracking-tight bg-emerald-50 px-3.5 py-1 rounded-2xl border border-emerald-200/70">
                            #{servingToken.tokenNumber}
                          </span>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">
                              {servingToken.customerName}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {servingToken.service} • {servingToken.customerPhone}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-slate-600">
                          Chair is currently open. Click "CALL NEXT CUSTOMER" to advance the queue line.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {servingToken && (
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={handleCompleteService}
                          loading={completingServiceState}
                          disabled={completingServiceState}
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold"
                        >
                          {terms.actionComplete}
                        </Button>
                      )}
                      <button
                        type="button"
                        onClick={handleCallNext}
                        disabled={callingNext || waitingTokens.length === 0}
                        className={`font-black text-sm px-7 py-3 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-md ${
                          callingNext || waitingTokens.length === 0
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-emerald-600/30'
                        }`}
                      >
                        {callingNext ? 'CALLING NEXT...' : terms.actionCallNext.toUpperCase()}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Full Waiting List Table */}
              <section aria-label="Waiting List">
                <Card className="border border-slate-200/90 shadow-xs overflow-hidden rounded-3xl bg-white">
                  <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <span>Waiting Customers Roster</span>
                        <Badge variant="amber" size="sm">
                          {waitingTokens.length} in line
                        </Badge>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Est. Average wait: <strong className="text-slate-800">{avgWaitMins} mins</strong> per ticket.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowQRPanel(true)}
                        icon={
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                          </svg>
                        }
                      >
                        + Add via QR Check-in
                      </Button>
                    </div>
                  </div>

                  {loading ? (
                    <div className="py-16 text-center text-xs text-slate-500 font-mono">
                      Synchronizing queue data...
                    </div>
                  ) : waitingTokens.length === 0 ? (
                    <EmptyState
                      title={`No ${terms.customerPlural.toLowerCase()} currently waiting`}
                      description="New tokens joined via customer QR or link will instantly appear here in real-time."
                      className="py-12"
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">
                          <tr>
                            <th className="p-4 pl-6">Pos</th>
                            <th className="p-4">Token #</th>
                            <th className="p-4">{terms.customerTerm}</th>
                            <th className="p-4">Phone</th>
                            <th className="p-4">{terms.serviceTerm}</th>
                            <th className="p-4">Est. Wait</th>
                            <th className="p-4 pr-6 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {waitingTokens.map((tok, idx) => (
                            <tr key={tok.tokenId || tok.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-4 pl-6">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                                  #{idx + 1}
                                </span>
                              </td>
                              <td className="p-4 font-mono font-bold text-slate-900 text-sm">
                                <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                  #{tok.tokenNumber}
                                </span>
                              </td>
                              <td className="p-4 text-slate-900 font-semibold">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-center shrink-0">
                                    {getInitials(tok.customerName)}
                                  </div>
                                  <span className="truncate">{tok.customerName}</span>
                                </div>
                              </td>
                              <td className="p-4 font-mono text-slate-500">
                                {tok.customerPhone}
                              </td>
                              <td className="p-4">
                                <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                                  {tok.service}
                                </span>
                              </td>
                              <td className="p-4 text-emerald-700 font-mono font-semibold">
                                <span className="inline-flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                                  </svg>
                                  ~{tok.estimatedWaitMinutes} mins
                                </span>
                              </td>
                              <td className="p-4 pr-6 text-right">
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
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. SERVICES MANAGEMENT VIEW                               */}
          {/* ========================================================= */}
          {activeSection === 'services' && (
            <div className="space-y-6 animate-fadeIn">
              <Card className="border border-slate-200/90 shadow-xs overflow-hidden rounded-3xl bg-white p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <span>Salon Service Menu &amp; Pricing</span>
                      <Badge variant="emerald" size="sm">
                        {servicesList.length} Catalog Items
                      </Badge>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure your salon services, duration per service, and customer charges.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleOpenAddService}
                    icon={
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    }
                  >
                    + Add New {terms.serviceTerm}
                  </Button>
                </div>

                {svcSuccess && (
                  <div className="my-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <span>✅</span>
                    <span>{svcSuccess}</span>
                  </div>
                )}

                {svcError && (
                  <div className="my-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{svcError}</span>
                  </div>
                )}

                {/* Inline Add / Edit Service Form */}
                {showServiceForm && (
                  <form onSubmit={handleSaveServiceForm} className="my-6 bg-slate-50/80 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 text-xs shadow-inner">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {editingServiceId ? `Edit ${terms.serviceTerm}` : `Add New ${terms.serviceTerm}`}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowServiceForm(false)}
                        className="text-slate-400 hover:text-slate-600 font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <Input
                          label={`${terms.serviceTerm} Name`}
                          type="text"
                          required
                          placeholder="e.g. Haircut & Styling / Beard Trim / Facial"
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
                        placeholder="Brief summary of service"
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
                        {savingSvc ? 'Saving...' : editingServiceId ? 'Update Service' : 'Save Service'}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Services Catalog Table */}
                <div className="mt-6 overflow-x-auto border border-slate-200/80 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-4">{terms.serviceTerm}</th>
                        <th className="p-4">Duration</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {servicesList.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-slate-400">
                            No services created yet. Click "+ Add New {terms.serviceTerm}" above.
                          </td>
                        </tr>
                      ) : (
                        servicesList.map((svc) => (
                          <tr key={svc.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-4">
                              <span className="font-bold text-slate-900 text-sm block">
                                {svc.name}
                              </span>
                              {svc.description && (
                                <span className="text-[11px] text-slate-400 block mt-0.5">
                                  {svc.description}
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-slate-700 font-mono font-semibold">
                              ⏱️ {svc.durationMinutes} mins
                            </td>
                            <td className="p-4 font-mono font-bold text-emerald-700 text-sm">
                              ₹{svc.price}
                            </td>
                            <td className="p-4">
                              <Badge
                                variant={svc.isActive ? 'emerald' : 'slate'}
                                size="sm"
                              >
                                {svc.isActive ? 'ACTIVE' : 'INACTIVE'}
                              </Badge>
                            </td>
                            <td className="p-4 text-right space-x-2">
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
              </Card>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. CUSTOMERS DIRECTORY VIEW (100% REAL DATA FROM TOKENS)  */}
          {/* ========================================================= */}
          {activeSection === 'customers' && (
            <div className="space-y-6 animate-fadeIn">
              <Card className="border border-slate-200/90 shadow-xs overflow-hidden rounded-3xl bg-white p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <span>Customer Directory &amp; Visit History</span>
                      <Badge variant="emerald" size="sm">
                        {allCustomerTokens.length} Records Today
                      </Badge>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verified customer queue entries and service logs recorded in today's active session.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowQRPanel(true)}
                  >
                    + Check-in New Customer
                  </Button>
                </div>

                {/* Filter & Search Bar */}
                <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <button
                      type="button"
                      onClick={() => setCustomerFilterStatus('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                        customerFilterStatus === 'ALL'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All ({allCustomerTokens.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerFilterStatus('WAITING')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                        customerFilterStatus === 'WAITING'
                          ? 'bg-amber-500 text-white'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      Waiting ({waitingTokens.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerFilterStatus('SERVING')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                        customerFilterStatus === 'SERVING'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      In Chair ({servingToken ? 1 : 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerFilterStatus('SERVED')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                        customerFilterStatus === 'SERVED'
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Completed ({servedTokens.length})
                    </button>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search name, phone, token..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    {customerSearch && (
                      <button
                        type="button"
                        onClick={() => setCustomerSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Customer Records Table */}
                <div className="mt-4 overflow-x-auto border border-slate-200/80 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Contact Phone</th>
                        <th className="p-4">Token #</th>
                        <th className="p-4">Requested Service</th>
                        <th className="p-4">Session Status</th>
                        <th className="p-4 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredCustomerTokens.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-400">
                            {customerSearch ? 'No customer records match your search.' : 'No customer records found for this filter.'}
                          </td>
                        </tr>
                      ) : (
                        filteredCustomerTokens.map((tok) => (
                          <tr key={tok.tokenId || tok.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-center shrink-0">
                                  {getInitials(tok.customerName)}
                                </div>
                                <span className="font-bold text-slate-900 text-sm truncate">
                                  {tok.customerName}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 font-mono text-slate-600">
                              {tok.customerPhone}
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-900">
                              <span className="bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                #{tok.tokenNumber}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                                {tok.service}
                              </span>
                            </td>
                            <td className="p-4">
                              <Badge
                                variant={
                                  tok.status === 'SERVING'
                                    ? 'emerald'
                                    : tok.status === 'WAITING'
                                    ? 'amber'
                                    : tok.status === 'SERVED'
                                    ? 'slate'
                                    : 'rose'
                                }
                                size="sm"
                                dot={tok.status === 'SERVING'}
                              >
                                {tok.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-right font-mono text-[11px] text-slate-400">
                              {tok.estimatedWaitMinutes ? `~${tok.estimatedWaitMinutes}m wait` : 'Completed'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. CLINICS MANAGEMENT VIEW                                */}
          {/* ========================================================= */}
          {activeSection === 'clinics' && (
            <ClinicsSection />
          )}

          {/* ========================================================= */}
          {/* 6. ANALYTICS & REPORTS VIEW                               */}
          {/* ========================================================= */}
          {activeSection === 'analytics' && (
            <div className="space-y-6 animate-fadeIn">
              <AnalyticsSection
                queueData={queueData}
                waitingTokens={waitingTokens}
                servicesList={servicesList}
                terms={terms}
                avgServiceDuration={Number(qAvgDuration || 15)}
              />
            </div>
          )}

        </main>
      </div>

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
