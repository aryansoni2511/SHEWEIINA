import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../Navbar';
import FooterSection from '../FooterSection';
import { getHospitalTokenApi } from '../services/api';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';

export default function HospitalTokenPage() {
  const { tokenId } = useParams();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchToken = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setErrorMessage(null);

    try {
      const res = await getHospitalTokenApi(tokenId);
      if (res.data?.token) {
        setToken(res.data.token);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to retrieve OPD token status.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchToken();
    const interval = setInterval(() => {
      fetchToken(true);
    }, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, [tokenId]);

  if (loading) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Retrieving Live OPD Token...</p>
          </div>
        </div>
        <FooterSection />
      </div>
    );
  }

  if (errorMessage || !token) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-lg mx-auto px-4 py-16 text-center">
          <EmptyState
            title="OPD Token Not Found"
            description={errorMessage || 'Invalid token reference or expired consultation.'}
            action={
              <Link to="/hospitals">
                <Button variant="primary">← Find Hospital</Button>
              </Link>
            }
          />
        </div>
        <FooterSection />
      </div>
    );
  }

  const isServing = token.status === 'SERVING';
  const isWaiting = token.status === 'WAITING';
  const isServed = token.status === 'SERVED';
  const isSkipped = token.status === 'SKIPPED';

  return (
    <div className="bg-[#F8FAFC] text-[#172033] font-sans antialiased min-h-screen flex flex-col selection:bg-emerald-600 selection:text-white">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Status Header Banner */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Patient OPD Tracker</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
              {token.hospital_name}
            </h1>
            <p className="text-xs text-slate-500">
              Department: <strong>{token.department_name}</strong> • Duty Room: <strong>{token.room_number}</strong>
            </p>
          </div>

          {/* Main OPD Token Card */}
          <Card className="rounded-3xl bg-white border border-slate-200/90 shadow-md overflow-hidden">
            {/* Top Token Hero Banner */}
            <div className={`p-8 text-center text-white relative transition-colors ${
              isServing
                ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                : isServed
                ? 'bg-gradient-to-br from-slate-700 to-slate-900'
                : 'bg-gradient-to-br from-emerald-700 to-emerald-900'
            }`}>
              <span className="text-[11px] font-bold tracking-wider uppercase opacity-80 block mb-1">
                Your OPD Token Number
              </span>
              <div className="font-mono font-black text-5xl sm:text-6xl tracking-tight my-2">
                {token.token_number}
              </div>

              {/* Status Pill */}
              <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold border border-white/30">
                {isServing && <span>🔔 In Consultation with Doctor</span>}
                {isWaiting && <span>⏳ Waiting in OPD Queue (#{token.position} in line)</span>}
                {isServed && <span>✅ Consultation Completed</span>}
                {isSkipped && <span>⚠️ Consultation Skipped</span>}
              </div>
            </div>

            {/* Token Body Details */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Doctor & Room Highlight Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                    🩺
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Attending Consultant
                    </span>
                    <strong className="text-sm font-bold text-slate-900 block">
                      {token.doctor_name}
                    </strong>
                    <span className="text-xs text-slate-500">
                      {token.doctor_qualification}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Cabin
                  </span>
                  <span className="font-mono font-extrabold text-sm text-emerald-950">
                    {token.room_number}
                  </span>
                </div>
              </div>

              {/* Patient and Queue Metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Patient Name
                  </span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {token.patient_name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    ID: {token.patient_code || 'Walk-in'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Est. Turn Wait
                  </span>
                  <span className="font-bold text-emerald-800 text-sm mt-0.5 block">
                    {isWaiting ? `~${token.estimated_wait_minutes} mins` : isServing ? 'Now' : 'Completed'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Transparent formula
                  </span>
                </div>
              </div>

              {/* Guidance notice */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
                <strong>Patient Guidance:</strong> Please remain within the hospital waiting lobby or OPD waiting lounge. When your token is called, an audio announcement and SMS alert will be dispatched to your phone.
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => fetchToken(true)}
                  disabled={refreshing}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 transition-colors"
                >
                  <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{refreshing ? 'Refreshing...' : 'Refresh Queue Status'}</span>
                </button>

                <Link to={`/hospital/${token.hospital_slug || token.hospital_id}`}>
                  <Button variant="secondary" size="sm">
                    Hospital Profile →
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}

