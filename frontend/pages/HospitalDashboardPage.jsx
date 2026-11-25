import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoMark from '../components/LogoMark';
import {
  getHospitalDashboardApi,
  createHospitalDepartmentApi,
  updateHospitalDepartmentApi,
  createHospitalDoctorApi,
  callNextHospitalPatientApi,
  completeHospitalConsultationApi,
  skipHospitalPatientTokenApi,
  toggleHospitalDoctorQueueApi,
} from '../services/api';
import Button from '../components/ui/Button';
import { subscribeQueueRealtime } from '../services/realtime';
import { Badge } from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';
import {
  Stethoscope,
  Building2,
  UserCheck,
  FileText,
  ExternalLink,
  ArrowRight,
  Landmark,
  LogOut,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────
   Hospital Administration Dashboard — Clinical Blue / Editorial Identity
   All state management, polling (15s), queue operations, CRUD modals preserved
───────────────────────────────────────────────────────────────────────── */

/* Sidebar nav item helper */
function NavItem({ active, onClick, icon, label, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left text-xs ${
        active
          ? 'font-semibold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] shadow-xs'
          : 'text-[#57534E] hover:text-[#171717] hover:bg-[#F5F2EB]'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex-shrink-0">{icon}</span>
        <span>{label}</span>
      </div>
      {badge !== undefined && badge !== null && (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          active ? 'bg-[#DBEAFE] text-[#1E40AF]' : 'bg-[#E7E3DC] text-[#57534E]'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

export default function HospitalDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('queues');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Department modal
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '', floorRoom: '' });
  const [deptErrors, setDeptErrors] = useState({});

  // Doctor modal
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    departmentId: '',
    qualification: '',
    specialization: '',
    roomNumber: '',
    consultationDuration: 15,
    consultationFee: 500,
    availability: 'Mon - Sat (09:00 AM - 01:00 PM)',
  });
  const [doctorErrors, setDoctorErrors] = useState({});

  /* ── API: Fetch Dashboard (preserved) ─────────────────────────────── */
  const fetchDashboard = async (silent = false) => {
    if (!silent) setLoading(true);
    setErrorMessage(null);
    try {
      const res = await getHospitalDashboardApi();
      if (res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load hospital dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(() => {
      fetchDashboard(true);
    }, 15000); // 15s polling — preserved
    return () => clearInterval(interval);
  }, []);

  // Live SSE Stream for Hospital Operator Dashboard
  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    if (dashboardData?.hospital?.id) {
      unsubscribe = subscribeQueueRealtime({
        businessId: dashboardData.hospital.id,
        onUpdate: () => {
          if (isMounted) {
            fetchDashboard(true);
          }
        },
      });
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [dashboardData?.hospital?.id]);

  const showNotification = (msg) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  /* ── Queue Operations (preserved exactly) ─────────────────────────── */
  const handleCallNext = async (doctorId, doctorName) => {
    try {
      const res = await callNextHospitalPatientApi(doctorId);
      showNotification(`Called patient #${res.data?.token?.token_number} for Dr. ${doctorName}`);
      fetchDashboard(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to call next patient.');
    }
  };

  const handleCompleteConsultation = async (doctorId, doctorName) => {
    try {
      await completeHospitalConsultationApi(doctorId);
      showNotification(`Consultation completed for Dr. ${doctorName}`);
      fetchDashboard(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to complete consultation.');
    }
  };

  const handleSkipToken = async (doctorId, tokenId, tokenNumber) => {
    try {
      await skipHospitalPatientTokenApi(doctorId, tokenId);
      showNotification(`Skipped token #${tokenNumber}`);
      fetchDashboard(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to skip token.');
    }
  };

  const handleToggleQueue = async (doctorId, currentStatus, doctorName) => {
    try {
      const nextStatus = !currentStatus;
      await toggleHospitalDoctorQueueApi(doctorId, nextStatus);
      showNotification(`Dr. ${doctorName}'s OPD queue is now ${nextStatus ? 'OPEN' : 'PAUSED'}`);
      fetchDashboard(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to toggle queue.');
    }
  };

  /* ── Department CRUD (preserved exactly) ─────────────────────────── */
  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    if (!deptForm.name.trim()) {
      setDeptErrors({ name: 'Department name is required.' });
      return;
    }
    try {
      await createHospitalDepartmentApi({
        hospitalId: dashboardData?.hospital?.id,
        name: deptForm.name.trim(),
        code: deptForm.code.trim(),
        description: deptForm.description.trim(),
        floorRoom: deptForm.floorRoom.trim(),
      });
      showNotification(`Department "${deptForm.name}" created successfully.`);
      setIsDeptModalOpen(false);
      setDeptForm({ name: '', code: '', description: '', floorRoom: '' });
      fetchDashboard(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create department.');
    }
  };

  /* ── Doctor CRUD (preserved exactly) ─────────────────────────────── */
  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!doctorForm.name.trim()) errors.name = 'Doctor name is required.';
    if (!doctorForm.departmentId) errors.departmentId = 'Department is required.';
    if (!doctorForm.qualification.trim()) errors.qualification = 'Medical qualification is required.';
    if (!doctorForm.roomNumber.trim()) errors.roomNumber = 'Room/Cabin number is required.';
    setDoctorErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await createHospitalDoctorApi({
        hospitalId: dashboardData?.hospital?.id,
        ...doctorForm,
      });
      showNotification(`Dr. ${doctorForm.name} registered with dedicated OPD queue.`);
      setIsDoctorModalOpen(false);
      setDoctorForm({
        name: '',
        departmentId: '',
        qualification: '',
        specialization: '',
        roomNumber: '',
        consultationDuration: 15,
        consultationFee: 500,
        availability: 'Mon - Sat (09:00 AM - 01:00 PM)',
      });
      fetchDashboard(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to register doctor.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /* ── Loading ────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F0F9FF' }}>
        <div className="text-center space-y-4">
          <div
            className="w-14 h-14 border-4 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: '#0891B2', borderTopColor: 'transparent' }}
          />
          <p className="text-sm font-semibold text-slate-600">Loading Hospital OPD Dashboard...</p>
        </div>
      </div>
    );
  }

  const { hospital, summary, departments = [], doctorStations = [] } = dashboardData || {};

  return (
    <div
      className="min-h-screen flex text-[#171717] bg-[#FAF8F5] selection:bg-[#1E3A8A] selection:text-white"
    >

      {/* ── Persistent Left Sidebar (Desktop) ─────────────────────────── */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-[#E7E3DC] bg-white min-h-screen sticky top-0 h-screen overflow-y-auto shrink-0 z-30">

        {/* Brand bar with editorial navy accent */}
        <div className="p-5 border-b border-[#F0ECE4] flex items-center gap-3 bg-[#FAF8F5]">
          <div className="w-10 h-10 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] flex items-center justify-center font-bold text-lg shrink-0">
            <Building2 className="w-5 h-5 text-[#1E40AF]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-sm text-[#171717] truncate">
              {hospital?.name || 'Hospital Dashboard'}
            </h2>
            <span className="text-[10px] font-semibold text-[#1E40AF] uppercase tracking-wider block">
              Hospital Admin · OPD
            </span>
          </div>
        </div>

        {/* Multi-Module Switcher for dual-admin users */}
        {user?.isMultiModule && (
          <div className="p-3 bg-[#EFF6FF] border-b border-[#BFDBFE]">
            <span className="text-[10px] font-semibold text-[#1E40AF] uppercase tracking-wider block mb-1.5">
              Multi-Module Operator
            </span>
            <Link
              to="/government/dashboard"
              className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#BFDBFE] text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5" />
                <span>Govt Kendra</span>
              </span>
              <ArrowRight className="w-3 h-3 text-[#78716C]" />
            </Link>
          </div>
        )}

        {/* Nav items */}
        <div className="p-3 space-y-1 flex-1">
          <NavItem
            active={activeSection === 'queues'}
            onClick={() => setActiveSection('queues')}
            icon={<Stethoscope className="w-4 h-4 text-[#1E40AF]" />}
            label="OPD Live Queues"
            badge={summary?.totalWaiting > 0 ? summary.totalWaiting : null}
          />
          <NavItem
            active={activeSection === 'departments'}
            onClick={() => setActiveSection('departments')}
            icon={<Building2 className="w-4 h-4 text-[#1E40AF]" />}
            label="Departments"
            badge={departments.length}
          />
          <NavItem
            active={activeSection === 'doctors'}
            onClick={() => setActiveSection('doctors')}
            icon={<UserCheck className="w-4 h-4 text-[#1E40AF]" />}
            label="Doctors & Queues"
            badge={doctorStations.length}
          />
          <NavItem
            active={activeSection === 'profile'}
            onClick={() => setActiveSection('profile')}
            icon={<FileText className="w-4 h-4 text-[#1E40AF]" />}
            label="Hospital Profile"
            badge={null}
          />

          {/* External links */}
          <div className="pt-4 pb-1">
            <span className="text-[10px] font-semibold text-[#78716C] uppercase tracking-wider px-3">
              Patient View
            </span>
          </div>
          <Link
            to={`/hospital/${hospital?.slug || hospital?.id}`}
            target="_blank"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-[#57534E] hover:text-[#171717] hover:bg-[#F5F2EB] text-xs transition-colors"
          >
            <span>Public OPD Page</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#78716C]" />
          </Link>
          <Link
            to="/hospitals"
            target="_blank"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-[#57534E] hover:text-[#171717] hover:bg-[#F5F2EB] text-xs transition-colors"
          >
            <span>Hospital Directory</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#78716C]" />
          </Link>
        </div>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-800 block truncate">{user?.name || 'Administrator'}</span>
            <span className="text-[10px] text-slate-400">Hospital Admin</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-rose-600 hover:text-rose-700 font-bold text-xs transition-colors"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* ── Main Content Workspace ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Sticky top header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between gap-4">
          {/* Mobile menu + title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {hospital?.name || 'Hospital Dashboard'}
              </span>
              <h1 className="font-display font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                {activeSection === 'queues' && 'OPD Live Queue Stations'}
                {activeSection === 'departments' && 'Clinical Departments'}
                {activeSection === 'doctors' && 'Doctors & OPD Queues'}
                {activeSection === 'profile' && 'Hospital Profile'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live sync pulse */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
              style={{ background: '#ECFEFF', color: '#0E7490', borderColor: '#A5F3FC' }}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: '#06B6D4' }}
                />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#0891B2' }} />
              </span>
              <span>Live Queue Sync</span>
            </div>

            {/* Refresh button */}
            <button
              type="button"
              onClick={() => fetchDashboard(false)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Refresh Dashboard"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
            </button>
          </div>
        </header>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 p-3 space-y-1">
            {[
              { id: 'queues', icon: '🩺', label: 'OPD Live Queues' },
              { id: 'departments', icon: '🏢', label: 'Departments' },
              { id: 'doctors', icon: '👨‍⚕️', label: 'Doctors & Queues' },
              { id: 'profile', icon: '📋', label: 'Hospital Profile' },
            ].map(({ id, icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setActiveSection(id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeSection === id ? 'text-white' : 'text-slate-700 hover:bg-slate-50'
                }`}
                style={activeSection === id ? { background: 'linear-gradient(135deg, #0E7490, #0891B2)' } : {}}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Notification banners */}
        {feedbackMessage && (
          <div
            className="mx-6 mt-4 p-3.5 rounded-2xl text-white text-xs font-semibold shadow-md flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)' }}
          >
            <span>✅ {feedbackMessage}</span>
            <button type="button" onClick={() => setFeedbackMessage(null)}>✕</button>
          </div>
        )}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
            <span>⚠️ {errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage(null)}>✕</button>
          </div>
        )}

        <main className="p-6 space-y-6">

          {/* ── Stat Cards ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Patients Waiting"
              value={String(summary?.totalWaiting || 0)}
              subtitle="Across all OPD rooms"
              accent="amber"
              icon={<span className="text-lg">⏳</span>}
            />
            <StatCard
              title="Consultations Today"
              value={String(summary?.totalServedToday || 0)}
              subtitle="Completed patient visits"
              accent="emerald"
              icon={<span className="text-lg">✅</span>}
            />
            <StatCard
              title="In Doctor's Cabin"
              value={String(summary?.totalServing || 0)}
              subtitle="Currently being seen"
              accent="indigo"
              icon={<span className="text-lg">🔔</span>}
            />
            <StatCard
              title="Active OPD Queues"
              value={`${summary?.openQueuesCount || 0} / ${doctorStations.length}`}
              subtitle="Accepting new tokens"
              accent="slate"
              icon={<span className="text-lg">🩺</span>}
            />
          </div>

          {/* ── 1. OPD LIVE QUEUE STATIONS ──────────────────────────────── */}
          {activeSection === 'queues' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                    Doctor OPD Queue Stations
                  </h2>
                  <p className="text-xs text-slate-500">
                    Call next patient, mark consultation complete, or pause any queue.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (departments.length === 0) {
                        setIsDeptModalOpen(true);
                      } else {
                        setDoctorForm((prev) => ({ ...prev, departmentId: departments[0]?.id || '' }));
                        setIsDoctorModalOpen(true);
                      }
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)' }}
                  >
                    + Register Doctor
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {doctorStations.length === 0 ? (
                  <div className="col-span-full">
                    <EmptyState
                      title="No Doctor OPD Queues"
                      description="Start by adding clinical departments, then register doctors to activate live OPD queues."
                      action={
                        <button
                          type="button"
                          onClick={() => setIsDeptModalOpen(true)}
                          className="mt-3 px-5 py-2.5 rounded-xl text-xs font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)' }}
                        >
                          + Add Department First
                        </button>
                      }
                    />
                  </div>
                ) : (
                  doctorStations.map((station) => {
                    const isQueueOpen  = station.isQueueOpen;
                    const serving      = station.servingToken;
                    const waitingList  = station.waitingTokens || [];

                    return (
                      <Card
                        key={station.doctorId}
                        className="rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden flex flex-col"
                      >
                        {/* Station header */}
                        <div
                          className="p-5 border-b border-slate-100 flex items-start justify-between gap-3"
                          style={{ background: '#F8FAFC' }}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border"
                                style={{ background: '#ECFEFF', color: '#0E7490', borderColor: '#A5F3FC' }}
                              >
                                {station.departmentName}
                              </span>
                              <span className="text-xs font-mono font-bold text-slate-500">
                                Cabin: {station.roomNumber}
                              </span>
                            </div>
                            <h3 className="font-display font-extrabold text-base text-slate-900">
                              {station.doctorName}
                            </h3>
                            <span className="text-xs text-slate-500">
                              {station.qualification}{station.specialization ? ` · ${station.specialization}` : ''}
                            </span>
                          </div>

                          {/* Queue toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleQueue(station.doctorId, isQueueOpen, station.doctorName)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0 ${
                              isQueueOpen
                                ? 'border-cyan-200 hover:bg-cyan-100'
                                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            }`}
                            style={isQueueOpen ? { background: '#ECFEFF', color: '#0E7490' } : {}}
                          >
                            {isQueueOpen ? '● Queue Open' : '⏸ Paused'}
                          </button>
                        </div>

                        {/* Currently serving patient */}
                        <div
                          className="p-5 border-b border-slate-100"
                          style={{ background: '#F0FDFA' }}
                        >
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            Now in Cabin
                          </span>
                          {serving ? (
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <div className="font-mono font-black text-2xl" style={{ color: '#0E7490' }}>
                                  #{serving.token_number}
                                </div>
                                <strong className="text-xs font-bold text-slate-800 block">
                                  {serving.patient_name}
                                </strong>
                                <span className="text-[11px] font-mono text-slate-500">
                                  📞 {serving.patient_phone}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCompleteConsultation(station.doctorId, station.doctorName)}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition-colors shadow-sm"
                              >
                                ✓ Complete
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic py-1">
                              Doctor is ready — no patient currently in cabin.
                            </p>
                          )}
                        </div>

                        {/* Waiting patients list */}
                        <div className="p-5 flex-1">
                          <div className="flex items-center justify-between pb-3">
                            <span className="text-xs font-bold text-slate-600">
                              Waiting ({waitingList.length})
                            </span>
                            <span
                              className="text-[11px] font-semibold"
                              style={{ color: '#0891B2' }}
                            >
                              {waitingList.length > 0 ? `~${station.estimatedWaitMinutes}m load` : 'No queue'}
                            </span>
                          </div>

                          {waitingList.length === 0 ? (
                            <p className="text-xs text-slate-400 italic text-center py-4">
                              No patients waiting in this queue.
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {waitingList.map((tok, idx) => (
                                <div
                                  key={tok.id}
                                  className="p-2.5 rounded-xl border flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                                  style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span
                                      className="w-5 h-5 rounded-full font-bold text-[10px] flex items-center justify-center shrink-0 text-white"
                                      style={{ background: '#0891B2' }}
                                    >
                                      {idx + 1}
                                    </span>
                                    <div>
                                      <strong className="text-slate-900 font-mono block">
                                        #{tok.token_number}
                                      </strong>
                                      <span className="text-[11px] text-slate-600">
                                        {tok.patient_name} ({tok.patient_phone})
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      ~{tok.estimated_wait_minutes}m
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleSkipToken(station.doctorId, tok.id, tok.token_number)}
                                      className="text-[11px] font-semibold text-slate-400 hover:text-amber-700 transition-colors p-1"
                                      title="Skip this patient token"
                                    >
                                      Skip
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Call next CTA */}
                        <div className="p-4 border-t border-slate-100" style={{ background: '#F8FAFC' }}>
                          <button
                            type="button"
                            disabled={!isQueueOpen || waitingList.length === 0}
                            onClick={() => handleCallNext(station.doctorId, station.doctorName)}
                            className="w-full py-3 rounded-2xl text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                            style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)' }}
                          >
                            🔔 Call Next Patient ({waitingList.length})
                          </button>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── 2. DEPARTMENTS MANAGEMENT ──────────────────────────────── */}
          {activeSection === 'departments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                    Clinical Departments
                  </h2>
                  <p className="text-xs text-slate-500">
                    Manage hospital departments, floor allocation, and specialties.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)' }}
                >
                  + Add Department
                </button>
              </div>

              {departments.length === 0 ? (
                <EmptyState
                  title="No departments yet"
                  description="Add your first clinical department to start registering doctors and OPD queues."
                  action={
                    <button
                      type="button"
                      onClick={() => setIsDeptModalOpen(true)}
                      className="mt-3 px-5 py-2.5 rounded-xl text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)' }}
                    >
                      + Add First Department
                    </button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {departments.map((dept) => (
                    <Card
                      key={dept.id}
                      className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-base border"
                          style={{ background: '#ECFEFF', borderColor: '#A5F3FC', color: '#0E7490' }}
                        >
                          🏢
                        </div>
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                          style={{ background: '#ECFEFF', color: '#0E7490', borderColor: '#A5F3FC' }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#06B6D4' }} />
                          Active
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Code: {dept.code || 'GEN'}
                        </span>
                        <h3 className="font-display font-bold text-base text-slate-900 mt-0.5">
                          {dept.name}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mt-1">
                          {dept.description || 'General outpatient specialty department.'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
                        <span>
                          Floor / Location: <strong>{dept.floor_room || 'OPD Wing'}</strong>
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 3. DOCTORS TABLE VIEW ──────────────────────────────────── */}
          {activeSection === 'doctors' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                    Registered Doctors & OPD Counters
                  </h2>
                  <p className="text-xs text-slate-500">
                    Each doctor has a dedicated queue with custom duration, room, and fees.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDoctorForm((prev) => ({ ...prev, departmentId: departments[0]?.id || '' }));
                    setIsDoctorModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)' }}
                >
                  + Add Doctor
                </button>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white overflow-x-auto shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr
                      className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider"
                      style={{ background: '#F8FAFC' }}
                    >
                      <th className="py-3 px-4">Doctor Name</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Room</th>
                      <th className="py-3 px-4">Consult Time</th>
                      <th className="py-3 px-4">Fee</th>
                      <th className="py-3 px-4">Queue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {doctorStations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                          No doctors registered yet. Add departments first, then register doctors.
                        </td>
                      </tr>
                    ) : (
                      doctorStations.map((station) => (
                        <tr key={station.doctorId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <strong className="text-slate-900 block">{station.doctorName}</strong>
                            <span className="text-[11px] text-slate-400">{station.qualification}</span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold" style={{ color: '#0E7490' }}>
                            {station.departmentName}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                            {station.roomNumber}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-700">
                            {station.consultationDurationMinutes} mins
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            ₹{station.consultationFee || 500}
                          </td>
                          <td className="py-3.5 px-4">
                            {station.isQueueOpen ? (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border"
                                style={{ background: '#ECFEFF', color: '#0E7490', borderColor: '#A5F3FC' }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#06B6D4' }} />
                                Open
                              </span>
                            ) : (
                              <Badge variant="amber" size="sm" dot>Paused</Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── 4. HOSPITAL PROFILE ────────────────────────────────────── */}
          {activeSection === 'profile' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                  Hospital Profile & Location
                </h2>
                <p className="text-xs text-slate-500">
                  Registered institution information displayed on patient search directory.
                </p>
              </div>

              <Card className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5 text-xs">
                {/* Hospital identity */}
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl border shrink-0"
                    style={{ background: '#ECFEFF', borderColor: '#A5F3FC' }}
                  >
                    🏥
                  </div>
                  <div>
                    <strong className="text-slate-900 text-base block">{hospital?.name}</strong>
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-1"
                      style={{ background: '#ECFEFF', color: '#0E7490', borderColor: '#A5F3FC' }}
                    >
                      {hospital?.hospitalType || 'Multi-Specialty'}
                    </span>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Registration No.</span>
                    <strong className="text-slate-900 mt-0.5 block">{hospital?.registrationNumber}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">OPD Hours</span>
                    <span className="text-slate-700 mt-0.5 block">{hospital?.openingHours || '—'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Contact Phone</span>
                    <span className="text-slate-800 font-mono mt-0.5 block">{hospital?.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Official Email</span>
                    <span className="text-slate-800 font-mono mt-0.5 block break-all">{hospital?.email}</span>
                  </div>
                </div>

                <div className="pb-4 border-b border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Address</span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed">
                    {hospital?.address}, {hospital?.city} — {hospital?.pincode}, {hospital?.state}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Facilities</span>
                  <div className="flex flex-wrap gap-2">
                    {hospital?.facilities?.map((f) => (
                      <span
                        key={f}
                        className="px-2.5 py-1 rounded-lg font-medium border text-xs"
                        style={{ background: '#ECFEFF', color: '#0E7490', borderColor: '#A5F3FC' }}
                      >
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* ── Modal: Add Department ─────────────────────────────────────────── */}
      {isDeptModalOpen && (
        <Modal
          isOpen={isDeptModalOpen}
          onClose={() => setIsDeptModalOpen(false)}
          title="Add Clinical Department"
          description="Register a new outpatient department in this hospital."
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveDepartment} className="space-y-4 text-xs">
            <Input
              label="Department Name"
              required
              placeholder="e.g. Pediatrics & Child Health"
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              error={deptErrors.name}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Department Code"
                placeholder="e.g. PED"
                value={deptForm.code}
                onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
              />
              <Input
                label="Floor / Room Allocation"
                placeholder="e.g. 1st Floor, Wing B"
                value={deptForm.floorRoom}
                onChange={(e) => setDeptForm({ ...deptForm, floorRoom: e.target.value })}
              />
            </div>
            <Input
              label="Description / Scope"
              placeholder="e.g. Primary pediatric OPD, immunizations"
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
            />
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsDeptModalOpen(false)}>
                Cancel
              </Button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)' }}
              >
                Save Department
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal: Add Doctor ─────────────────────────────────────────────── */}
      {isDoctorModalOpen && (
        <Modal
          isOpen={isDoctorModalOpen}
          onClose={() => setIsDoctorModalOpen(false)}
          title="Register Doctor & OPD Queue"
          description="Each doctor is assigned to a department with a dedicated live consultation queue."
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSaveDoctor} className="space-y-4 text-xs">
            <Input
              label="Doctor Full Name"
              required
              placeholder="e.g. Dr. Ramesh Kulkarni"
              value={doctorForm.name}
              onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
              error={doctorErrors.name}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Department"
                required
                value={doctorForm.departmentId}
                onChange={(e) => setDoctorForm({ ...doctorForm, departmentId: e.target.value })}
                error={doctorErrors.departmentId}
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code || 'GEN'})
                  </option>
                ))}
              </Select>
              <Input
                label="Qualification"
                required
                placeholder="e.g. MBBS, MD"
                value={doctorForm.qualification}
                onChange={(e) => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                error={doctorErrors.qualification}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Specialization"
                placeholder="e.g. Diabetologist"
                value={doctorForm.specialization}
                onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
              />
              <Input
                label="OPD Cabin / Room"
                required
                placeholder="e.g. Cabin 104"
                value={doctorForm.roomNumber}
                onChange={(e) => setDoctorForm({ ...doctorForm, roomNumber: e.target.value })}
                error={doctorErrors.roomNumber}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Avg Consultation Time (mins)"
                type="number"
                value={doctorForm.consultationDuration}
                onChange={(e) => setDoctorForm({ ...doctorForm, consultationDuration: Number(e.target.value) })}
              />
              <Input
                label="Consultation Fee (₹)"
                type="number"
                value={doctorForm.consultationFee}
                onChange={(e) => setDoctorForm({ ...doctorForm, consultationFee: Number(e.target.value) })}
              />
            </div>
            <Input
              label="Availability Schedule"
              value={doctorForm.availability}
              onChange={(e) => setDoctorForm({ ...doctorForm, availability: e.target.value })}
            />
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsDoctorModalOpen(false)}>
                Cancel
              </Button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)' }}
              >
                Register Doctor & Queue
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
