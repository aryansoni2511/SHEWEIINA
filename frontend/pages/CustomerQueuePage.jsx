import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBusinessServices, joinQueue } from '../services/api';
import { DEMO_CONFIG } from '../config/demoConfig';
import { validateName, validatePhone } from '../utils/validation';
import { getIndustryConfig } from '../config/industryTerminology';
import LogoMark from '../components/LogoMark';

// Phase 1 UI Primitives
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
  const [duplicateToken, setDuplicateToken] = useState(null);

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
        setErrorMessage(err.message || 'Unable to load service details.');
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
    setDuplicateToken(null);

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
      const errorData = err.data || {};
      const errorCode = errorData.code || errorData.details?.code;
      const tokenDetails = errorData.details || errorData.existingToken;

      if (
        (errorCode === 'DUPLICATE_ACTIVE_TOKEN' ||
          (err.status === 409 && /already have an active token/i.test(err.message || ''))) &&
        tokenDetails?.tokenId
      ) {
        setDuplicateToken({
          tokenId: tokenDetails.tokenId,
          tokenNumber: tokenDetails.tokenNumber || null,
          status: tokenDetails.status || 'WAITING',
          message: err.message,
        });
        setErrorMessage(null);
      } else {
        setDuplicateToken(null);
        setErrorMessage(err.message || 'Failed to join queue. Please try again.');
      }
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4 selection:bg-[#171717] selection:text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#171717] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#171717]">Connecting to Live Queue...</p>
          <p className="text-xs text-[#78716C]">Checking real-time service counter availability</p>
        </div>
      </div>
    );
  }

  if (!businessInfo && !loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] relative flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8 selection:bg-[#171717] selection:text-white">
        <div className="max-w-md w-full bg-white border border-[#E7E3DC] shadow-sm rounded-3xl p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-[#FAF8F5] border border-[#E7E3DC] rounded-2xl flex items-center justify-center mx-auto text-xl">
            🎫
          </div>
          <h2 className="text-lg font-bold text-[#171717] font-editorial">Queue Not Found</h2>
          <p className="text-xs text-[#78716C] leading-relaxed">
            {errorMessage || 'The queue or service link you accessed is not currently available or active.'}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              to="/explore"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#171717] hover:bg-[#262626] transition-colors"
            >
              Explore Active Queues
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isQueueClosed = queueInfo && queueInfo.isOpen === false;

  return (
    <div className="min-h-screen bg-[#FAF8F5] relative flex flex-col items-center justify-center py-6 sm:py-10 px-3 sm:px-6 lg:px-8 pb-28 lg:pb-12 selection:bg-[#171717] selection:text-white">
      <div className="relative z-10 max-w-md w-full">
        {/* Main Card Container */}
        <Card className="p-4 sm:p-8 bg-white border border-[#E7E3DC] shadow-sm rounded-3xl">

          {/* Header Branding */}
          <div className="flex items-center justify-between border-b border-[#E7E3DC] pb-5 mb-5 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <LogoMark className="w-9 h-9" variant="blue" iconSize="w-4.5 h-4.5" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-[#171717] leading-tight truncate font-editorial">
                  {businessInfo?.name || 'Shewwina Express Queue'}
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-[#78716C] mt-0.5">
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
              to="/explore"
              className="text-xs font-semibold text-[#78716C] hover:text-[#171717] p-1 rounded-lg transition-colors flex-shrink-0"
              aria-label="Back to explore"
            >
              ✕
            </Link>
          </div>

          {/* Value Proposition Hero Badge */}
          <div className="mb-5 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E7E3DC] text-[#171717] flex items-start gap-2.5">
            <span className="text-base mt-0.5">🎫</span>
            <div>
              <h2 className="text-xs font-bold text-[#171717]">
                Join the {terms.queueTerm.toLowerCase()} without standing in line
              </h2>
              <p className="text-[11px] text-[#57534E] mt-0.5 leading-relaxed">
                Receive a digital token pass on your phone with live position sync, countdown wait time, and counter arrival alerts.
              </p>
            </div>
          </div>

          {/* Queue Status Alert */}
          {isQueueClosed && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs font-medium flex items-center gap-2"
            >
              <span>⚠️</span>
              <span>{terms.queueTerm} is currently closed. Token registration is temporarily paused.</span>
            </div>
          )}

          {/* Duplicate Active Token Recovery Alert & Action */}
          {duplicateToken && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-5 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-[#1E3A8A] flex flex-col gap-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-blue-600 text-lg mt-0.5">🎫</span>
                  <div>
                    <h4 className="text-sm font-bold text-blue-950">
                      Active Token Already Registered
                    </h4>
                    <p className="text-xs text-blue-800 mt-1">
                      {duplicateToken.tokenNumber ? (
                        <span>
                          You already have active Token{' '}
                          <strong className="font-semibold text-blue-950">#{duplicateToken.tokenNumber}</strong> in this{' '}
                          {terms.queueTerm.toLowerCase()}.
                        </span>
                      ) : (
                        <span>You already have an active token in this {terms.queueTerm.toLowerCase()}.</span>
                      )}
                    </p>
                    {duplicateToken.status && (
                      <p className="text-[11px] text-blue-700 mt-1 font-medium">
                        Current Status:{' '}
                        <span className="uppercase font-semibold tracking-wide text-blue-900">
                          {duplicateToken.status}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDuplicateToken(null)}
                  aria-label="Dismiss active token notification"
                  className="text-blue-400 hover:text-blue-700 font-bold text-sm px-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="pt-2 border-t border-blue-200/60">
                <Link
                  to={`/token/${duplicateToken.tokenId}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                >
                  <span>View Active Token</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          )}

          {/* Normal Error Alert */}
          {errorMessage && !duplicateToken && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] text-[#991B1B] text-xs font-medium flex items-start justify-between gap-2"
            >
              <div className="flex items-start gap-2">
                <span className="text-[#991B1B] mt-0.5">⚠️</span>
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                aria-label="Dismiss error"
                className="text-[#991B1B] font-bold"
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
                <label className="block text-xs font-bold text-[#171717] uppercase tracking-wider">
                  1. Select {terms.serviceTerm}
                </label>
                <span className="text-[11px] text-[#78716C] font-mono tabular-nums">
                  {services.length} available
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {services.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#FAF8F5] text-center text-xs text-[#78716C] border border-[#E7E3DC]">
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
                            ? 'border-[#171717] bg-[#FAF8F5] shadow-xs ring-1 ring-[#171717]'
                            : 'border-[#E7E3DC] hover:border-[#78716C] bg-white'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-sm font-semibold text-[#171717] truncate">
                            {svc.name}
                          </div>
                          <div className="text-xs text-[#78716C] mt-0.5 flex items-center gap-1.5">
                            <span className="font-mono tabular-nums">⏱️ {svc.durationMinutes} mins</span>
                            {svc.description && (
                              <>
                                <span>•</span>
                                <span className="truncate">{svc.description}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-[#171717] font-mono tabular-nums flex-shrink-0">
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
                placeholder="e.g. Rahul Sharma"
                value={customerName}
                error={nameError}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (nameError) {
                    const c = validateName(e.target.value);
                    setNameError(c.valid ? '' : c.message);
                  }
                }}
              />
            </div>

            {/* Customer Phone */}
            <div>
              <Input
                label="3. Mobile Number"
                id="customerPhone"
                type="tel"
                required
                autoComplete="tel"
                placeholder="e.g. 9876543210 (10 digits)"
                helperText="For SMS / WhatsApp alerts when your turn arrives"
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
              />
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={submitting || isQueueClosed}
              className={`w-full font-bold text-sm sm:text-base py-3.5 px-6 rounded-2xl transition-all duration-150 shadow-sm mt-4 flex items-center justify-center gap-2 active-press ${
                submitting || isQueueClosed
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-blue-500/20'
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Joining Live Queue...</span>
                </>
              ) : (
                <span>Get Digital Waiting Pass</span>
              )}
            </button>
          </form>

          {/* Footer Assurances */}
          <div className="mt-6 pt-4 border-t border-[#E7E3DC] text-center space-y-1.5">
            <div className="flex items-center justify-center gap-3 text-[11px] text-[#78716C] font-medium">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                Live Status Sync
              </span>
              <span>•</span>
              <span>No App Download Needed</span>
            </div>
            <p className="text-[10px] text-[#78716C]">
              Powered by <span className="font-semibold text-[#171717]">SHEWWINA Customer Flow OS</span>
            </p>
          </div>

        </Card>
      </div>
    </div>
  );
}
