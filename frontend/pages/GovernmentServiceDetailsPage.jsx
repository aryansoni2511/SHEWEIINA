import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import FooterSection from '../FooterSection';
import DocumentChecklist from '../components/government/DocumentChecklist';
import {
  getGovernmentServiceDetailsApi,
  searchGovernmentCentresApi,
  requestGovernmentTokenApi,
} from '../services/api';
import Button from '../components/ui/Button';

export default function GovernmentServiceDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Token Request Form State
  const [selectedCentreId, setSelectedCentreId] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [docsConfirmed, setDocsConfirmed] = useState(false);
  const [submittingToken, setSubmittingToken] = useState(false);
  const [tokenError, setTokenError] = useState(null);
  const [duplicateToken, setDuplicateToken] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const servRes = await getGovernmentServiceDetailsApi(slug);
        if (!servRes?.success || !servRes.data?.service) {
          setError('Service not found or inactive.');
          return;
        }

        const currentService = servRes.data.service;
        setService(currentService);

        // Load Kendras that support this category
        const centreRes = await searchGovernmentCentresApi({
          category: currentService.category,
        });

        if (centreRes?.success) {
          const loadedCentres = centreRes.data.centres || [];
          setCentres(loadedCentres);
          if (loadedCentres.length > 0) {
            setSelectedCentreId(loadedCentres[0].id);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load service details.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [slug]);

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setTokenError(null);
    setDuplicateToken(null);

    if (!citizenName.trim() || !citizenPhone.trim()) {
      setTokenError('Please enter your full name and 10-digit mobile number.');
      return;
    }

    if (!selectedCentreId) {
      setTokenError('Please select a facilitation Kendra.');
      return;
    }

    if (!docsConfirmed) {
      setTokenError('Please confirm that you have checked the required documents.');
      return;
    }

    try {
      setSubmittingToken(true);
      const res = await requestGovernmentTokenApi({
        centreId: selectedCentreId,
        serviceId: service.id,
        citizenName: citizenName.trim(),
        citizenPhone: citizenPhone.trim(),
        notes: notes.trim(),
      });

      if (res?.success && res.data?.token) {
        navigate(`/government/token/${res.data.token.id}`);
      } else {
        setTokenError(res?.message || 'Could not issue token. Please try again.');
      }
    } catch (err) {
      const errorData = err.data || {};
      const errorCode = errorData.code || errorData.details?.code;
      const tokenDetails = errorData.details || errorData.existingToken;

      if (
        (errorCode === 'DUPLICATE_ACTIVE_TOKEN' ||
          (err.status === 409 && /already have an active (queue )?token/i.test(err.message || ''))) &&
        tokenDetails?.tokenId
      ) {
        setDuplicateToken({
          tokenId: tokenDetails.tokenId,
          tokenNumber: tokenDetails.tokenNumber || null,
          status: tokenDetails.status || 'WAITING',
          message: err.message,
        });
        setTokenError(null);
      } else {
        setDuplicateToken(null);
        setTokenError(err.message || 'Failed to request token pass.');
      }
    } finally {
      setSubmittingToken(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-sm">Loading service checklist &amp; Kendra counters...</p>
        </div>
        <FooterSection />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto px-4 py-20 text-center">
          <div className="text-4xl mb-3">🏛️</div>
          <h2 className="text-xl font-bold text-slate-900">Service Not Found</h2>
          <p className="text-sm text-slate-500 mt-2">{error || 'This government service is unavailable.'}</p>
          <div className="mt-6">
            <Link to="/government-services" className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold">
              ← Return to Government Services
            </Link>
          </div>
        </div>
        <FooterSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* ── Breadcrumb & Notice ────────────────────────────────────────── */}
        <div className="bg-slate-900 text-slate-300 py-3 px-4 sm:px-6 lg:px-8 text-xs border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to="/government-services" className="hover:text-white transition-colors">
                🏛️ Govt Services
              </Link>
              <span>/</span>
              <span className="text-amber-400 font-semibold">{service.category}</span>
              <span>/</span>
              <span className="text-white truncate max-w-xs">{service.name}</span>
            </div>
            <span className="hidden sm:inline text-slate-400">
              Facilitation &amp; Token Pass
            </span>
          </div>
        </div>

        {/* ── Service Header Banner ──────────────────────────────────────── */}
        <section
          className="text-white py-10 px-4 sm:px-6 lg:px-8"
          style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)' }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/20">
                {service.category} Service
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ⏱️ Est. {service.estimated_duration_minutes} Minutes
              </span>
            </div>

            <h1 className="font-display font-extrabold text-2xl sm:text-4xl tracking-tight">
              {service.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-3xl leading-relaxed">
              {service.description}
            </p>
          </div>
        </section>

        {/* ── Main Two-Column Layout ─────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Cols: Checklist & Details */}
            <div className="lg:col-span-7 space-y-6">
              {/* Official Fee Box */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">
                    Transparent Official Fees
                  </h3>
                  <span className="text-xs text-slate-500">
                    Verified {service.fee_last_verified_date || 'Nov 2026'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <div className="text-xs text-slate-500 font-medium">Official Government Fee</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      {Number(service.official_fee) === 0 ? 'FREE' : `₹${Number(service.official_fee).toFixed(0)}`}
                    </div>
                    {service.official_fee_source && (
                      <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                        Ref: {service.official_fee_source}
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <div className="text-xs text-slate-500 font-medium">Kendra Facilitation Desk</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                      {Number(service.facilitation_fee) === 0 ? 'Nil' : `₹${Number(service.facilitation_fee).toFixed(0)}`}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                      Assistance, printing, scanning &amp; token coordination.
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  <strong>Important:</strong> SHEWWINA does not charge any online convenience fee for digital tokens. All statutory fees are paid directly at the physical Kendra counter.
                </div>
              </div>

              {/* Eligibility Box */}
              {service.eligibility_criteria && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-sm text-slate-900 mb-2">
                    Eligibility &amp; Pre-requisites
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {service.eligibility_criteria}
                  </p>
                </div>
              )}

              {/* Interactive Document Checklist Component */}
              <DocumentChecklist
                documents={service.required_documents || []}
                serviceName={service.name}
              />
            </div>

            {/* Right 5 Cols: Kendra Selection & Token Request Pass */}
            <div className="lg:col-span-5 sticky top-20">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-sm">
                    🎫
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Request Citizen Digital Token
                    </h3>
                    <p className="text-xs text-slate-500">
                      Get a live queue pass for your preferred Kendra
                    </p>
                  </div>
                </div>

                {/* Active Service Token Recovery Alert & Action */}
                {duplicateToken && duplicateToken.tokenId && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="mb-4 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-[#1E3A8A] flex flex-col gap-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className="text-blue-700 text-lg mt-0.5">🎫</span>
                        <div>
                          <h4 className="text-sm font-bold text-blue-950">
                            Active Service Token Already Registered
                          </h4>
                          <p className="text-xs text-blue-800 mt-1">
                            You already have active Token{' '}
                            <strong className="font-semibold text-blue-950">
                              #{duplicateToken.tokenNumber || 'Active'}
                            </strong>{' '}
                            for {service.name} at this Kendra today.
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-100 text-blue-900 border border-blue-200">
                              Status: <strong className="ml-1 uppercase">{duplicateToken.status || 'WAITING'}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDuplicateToken(null)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-bold p-1 leading-none rounded"
                        aria-label="Dismiss active token alert"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="pt-2 border-t border-blue-200/60 flex items-center justify-end">
                      <Link
                        to={`/government/token/${duplicateToken.tokenId}`}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-950 hover:bg-blue-900 shadow-sm transition-all"
                      >
                        <span>View Active Service Token</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                )}

                {tokenError && !duplicateToken && (
                  <div role="alert" className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                    ⚠️ {tokenError}
                  </div>
                )}

                <form onSubmit={handleRequestToken} className="space-y-4">
                  {/* Select Kendra */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Choose Facilitation Kendra / Desk *
                    </label>
                    {centres.length === 0 ? (
                      <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                        No active kendras listed for this category yet.
                      </div>
                    ) : (
                      <select
                        value={selectedCentreId}
                        onChange={(e) => setSelectedCentreId(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                        required
                      >
                        {centres.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.city} — {c.pincode})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Citizen Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Citizen Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="As shown in your official documents"
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                      required
                    />
                  </div>

                  {/* Citizen Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number (For Token SMS &amp; Live Tracking) *
                    </label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      value={citizenPhone}
                      onChange={(e) => setCitizenPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                      required
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      We never ask for your Aadhaar number or biometric details.
                    </p>
                  </div>

                  {/* Notes / Specific Request */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Notes / Specific Update (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Address change with electricity bill"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                    />
                  </div>

                  {/* Confirm Checklist Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={docsConfirmed}
                        onChange={(e) => setDocsConfirmed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-blue-900 focus:ring-blue-800 border-slate-300 accent-blue-900 cursor-pointer"
                        required
                      />
                      <span className="text-xs text-slate-600 leading-snug">
                        I confirm that I have reviewed the required document checklist and will bring original documents to the Kendra.
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submittingToken || centres.length === 0}
                    className="w-full py-3 rounded-xl bg-blue-950 hover:bg-blue-900 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md mt-2 flex items-center justify-center gap-2"
                  >
                    {submittingToken ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating Live Token...</span>
                      </>
                    ) : (
                      <span>Get Citizen Token Pass →</span>
                    )}
                  </button>
                </form>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                  Instant token allocation • SMS notification • Free cancellation
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
