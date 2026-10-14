import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBusinessServices, joinQueue } from '../services/api';
import { DEMO_CONFIG } from '../config/demoConfig';
import { validateName, validatePhone } from '../utils/validation';
import { getIndustryConfig } from '../config/industryTerminology';
import LogoMark from '../components/LogoMark';

// Phase 2 UI Primitives
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

export default function CustomerQueuePage() {
  const { businessId: rawBusinessId } = useParams();
  const navigate = useNavigate();

  const businessId = rawBusinessId || DEMO_CONFIG.BUSINESS_ID;

  // State Management
  const [businessInfo, setBusinessInfo] = useState(null);
  const [services, setServices] = useState([]);
  const [queueInfo, setQueueInfo] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Field-level validation errors
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // UI States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Industry-Agnostic Terminology Resolution
  const terms = getIndustryConfig(businessInfo?.category);

  // Fetch Business & Services on Mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setErrorMessage(null);

    getBusinessServices(businessId)
      .then((res) => {
        if (!isMounted) return;
        const data = res.data;
        setBusinessInfo(data.business);
        setServices(data.services || []);
        setQueueInfo(data.queue);
        if (data.services && data.services.length > 0) {
          setSelectedServiceId(data.services[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMessage(err.message || 'Unable to load business details.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [businessId]);

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form Validations — using shared validateName / validatePhone rules
    if (!selectedServiceId) {
      setErrorMessage(`Please select a ${terms.serviceTerm.toLowerCase()} before joining the ${terms.queueTerm.toLowerCase()}.`);
      return;
    }

    const nameCheck = validateName(customerName);
    if (!nameCheck.valid) {
      setNameError(nameCheck.message);
      setErrorMessage(nameCheck.message);
      return;
    }
    setNameError('');

    const phoneCheck = validatePhone(customerPhone);
    if (!phoneCheck.valid) {
      setPhoneError(phoneCheck.message);
      setErrorMessage(phoneCheck.message);
      return;
    }
    setPhoneError('');

    const targetQueueId = queueInfo?.id || DEMO_CONFIG.QUEUE_ID;
    const targetBusinessId = businessInfo?.id || DEMO_CONFIG.BUSINESS_ID;

    setSubmitting(true);

    try {
      const response = await joinQueue({
        businessId: targetBusinessId,
        queueId: targetQueueId,
        serviceId: selectedServiceId,
        customerName: nameCheck.normalized,
        customerPhone: customerPhone.trim(),
      });

      const tokenData = response.data;
      navigate(`/token/${tokenData.tokenId || tokenData.tokenNumber}`);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to join queue. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading Live Queue...</p>
        </div>
      </div>
    );
  }

  const isQueueClosed = queueInfo && queueInfo.isOpen === false;

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8 selection:bg-indigo-600 selection:text-white">
      {/* Background ambient gradient */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(79,70,229,0.08),rgba(255,255,255,0))] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_110%,rgba(99,102,241,0.05),rgba(255,255,255,0))] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-md w-full">
        {/* Main Card Container */}
        <Card className="p-6 sm:p-8 bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 rounded-3xl">

          {/* Header Branding */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-5 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <LogoMark className="w-10 h-10" variant="blue" iconSize="w-5 h-5" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
                  {businessInfo?.name || 'Shewwina Express Queue'}
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <span>{terms.icon} {terms.categoryName}</span>
                  {businessInfo?.city && (
                    <>
                      <span>•</span>
                      <span className="truncate">{businessInfo.city}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Link
              to="/"
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors flex-shrink-0"
              aria-label="Close"
            >
              ✕
            </Link>
          </div>

          {/* Value Proposition Hero Badge */}
          <div className="mb-5 p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-indigo-950 flex items-start gap-2.5">
            <span className="text-base mt-0.5">🎫</span>
            <div>
              <h2 className="text-xs font-bold text-indigo-900">
                Join the {terms.queueTerm.toLowerCase()} without standing in line
              </h2>
              <p className="text-[11px] text-indigo-700/80 mt-0.5 leading-relaxed">
                Get a digital waiting pass, track your position live, and arrive right when it's your turn.
              </p>
            </div>
          </div>

          {/* Queue Status Alert */}
          {isQueueClosed && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2"
            >
              <span>⚠️</span>
              <span>{terms.queueTerm} is currently closed. Token registration is temporarily paused.</span>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start justify-between gap-2"
            >
              <div className="flex items-start gap-2">
                <span className="text-rose-500 mt-0.5">⚠️</span>
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                aria-label="Dismiss error"
                className="text-rose-400 hover:text-rose-600 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Queue Join Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Service Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  1. Select {terms.serviceTerm}
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {services.length} available
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {services.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-400 border border-slate-200">
                    No active {terms.servicePlural.toLowerCase()} listed.
                  </div>
                ) : (
                  services.map((svc) => {
                    const isSelected = selectedServiceId === svc.id;
                    return (
                      <div
                        key={svc.id}
                        onClick={() => setSelectedServiceId(svc.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 shadow-sm shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            {svc.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <span>⏱️ {svc.durationMinutes} mins</span>
                            {svc.description && (
                              <>
                                <span>•</span>
                                <span className="truncate">{svc.description}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-indigo-600 font-mono flex-shrink-0">
                          {svc.price > 0 ? `₹${svc.price}` : 'Free'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <Input
                label={`2. Your Name (${terms.customerTerm})`}
                id="customerName"
                type="text"
                required
                autoComplete="name"
                placeholder="e.g. Rahul Sharma (letters only)"
                value={customerName}
                error={nameError}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (nameError) {
                    const c = validateName(e.target.value);
                    setNameError(c.valid ? '' : c.message);
                  }
                }}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
            </div>

            {/* Customer Phone */}
            <div>
              <Input
                label="3. Phone Number"
                id="customerPhone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="e.g. 9876543210 (10 digits)"
                helperText="For instant SMS updates when your turn arrives"
                value={customerPhone}
                maxLength={10}
                error={phoneError}
                onChange={(e) => {
                  setCustomerPhone(e.target.value);
                  if (phoneError) {
                    const c = validatePhone(e.target.value);
                    setPhoneError(c.valid ? '' : c.message);
                  }
                }}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                }
              />
            </div>

            {/* Primary Action Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              disabled={submitting || isQueueClosed}
              className="w-full font-bold shadow-md shadow-indigo-600/20 mt-4"
            >
              Get Digital Waiting Pass
            </Button>
          </form>

          {/* Footer Assurances */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-1.5">
            <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live Status Sync
              </span>
              <span>•</span>
              <span>No App Download Needed</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Powered by <span className="font-semibold text-slate-600">Shewwina Customer Flow OS</span>
            </p>
          </div>

        </Card>
      </div>
    </div>
  );
}
