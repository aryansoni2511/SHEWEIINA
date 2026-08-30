import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBusinessServices, joinQueue } from '../services/api';
import { DEMO_CONFIG } from '../config/demoConfig';

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
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

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

    // Form Validations
    if (!selectedServiceId) {
      setErrorMessage('Please select a service before joining the queue.');
      return;
    }
    if (!customerName || customerName.trim().length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }
    const cleanPhone = customerPhone.replace(/[\s\-\(\)]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMessage('Please enter a valid phone number (minimum 8 digits).');
      return;
    }

    const targetQueueId = queueInfo?.id || DEMO_CONFIG.QUEUE_ID;
    const targetBusinessId = businessInfo?.id || DEMO_CONFIG.BUSINESS_ID;

    setSubmitting(true);

    try {
      const response = await joinQueue({
        businessId: targetBusinessId,
        queueId: targetQueueId,
        serviceId: selectedServiceId,
        customerName: customerName.trim(),
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
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading Shewwina Queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-blue-600 selection:text-white">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-slate-100 relative">
        
        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md">
              S
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                {businessInfo?.name || 'Shewwina Express Queue'}
              </h1>
              <p className="text-xs text-slate-500">
                {businessInfo?.city ? `${businessInfo.city} • Digital Queue` : 'Salons & Clinics Flow OS'}
              </p>
            </div>
          </div>
          <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">
            Close
          </Link>
        </div>

        {/* Queue Status Alert */}
        {queueInfo && !queueInfo.isOpen && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            ⚠️ Queue is currently closed by receptionist. Token registration is paused.
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="ml-2 font-bold text-rose-500 hover:text-rose-800">
              ✕
            </button>
          </div>
        )}

        {/* Queue Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Service Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Select Service
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  onClick={() => setSelectedServiceId(svc.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedServiceId === svc.id
                      ? 'border-blue-600 bg-blue-50/70 shadow-sm shadow-blue-500/10 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{svc.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">⏱️ {svc.durationMinutes} mins service</div>
                  </div>
                  <div className="text-sm font-bold text-blue-600 font-mono">
                    ₹{svc.price}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Name */}
          <div>
            <label htmlFor="customerName" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              2. Your Name
            </label>
            <input
              id="customerName"
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Customer Phone */}
          <div>
            <label htmlFor="customerPhone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              3. Phone Number
            </label>
            <input
              id="customerPhone"
              type="tel"
              required
              placeholder="e.g. +919876543210"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || (queueInfo && !queueInfo.isOpen)}
            className="w-full py-4 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold text-base rounded-2xl shadow-xl shadow-slate-950/20 active:scale-98 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Joining Queue...</span>
              </>
            ) : (
              <span>Get Digital Token</span>
            )}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center mt-6">
          Powered by <span className="font-semibold text-slate-600">Shewwina Customer Flow OS</span>
        </p>
      </div>
    </div>
  );
}
