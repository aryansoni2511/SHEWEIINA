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
import { Badge } from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import EmptyState from '../components/ui/EmptyState';

export default function HospitalDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('queues'); // 'queues' | 'departments' | 'doctors' | 'profile'
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Department Modals
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '', floorRoom: '' });
  const [deptErrors, setDeptErrors] = useState({});

  // Doctor Modals
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

  // Fetch Dashboard data
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
    }, 15000); // 15s polling sync
    return () => clearInterval(interval);
  }, []);

  const showNotification = (msg) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Queue Operations
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

  // Create Department
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

  // Create Doctor
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading Hospital Administration Dashboard...</p>
        </div>
      </div>
    );
  }

  const { hospital, summary, departments = [], doctorStations = [] } = dashboardData || {};

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 selection:bg-emerald-600 selection:text-white">
      {/* ─── Persistent Left Sidebar (Desktop) ───────────────────────────── */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200/80 bg-white min-h-screen sticky top-0 h-screen overflow-y-auto shrink-0 z-30">
        {/* Brand & Hospital Banner */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <LogoMark className="w-9 h-9" variant="emerald" iconSize="w-5 h-5" />
          <div className="min-w-0">
            <h2 className="font-display font-extrabold text-sm text-slate-900 truncate">
              {hospital?.name || 'Shewwina Hospital'}
            </h2>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Hospital Admin OPD
            </span>
          </div>
        </div>

        {/* Navigation Section Items */}
        <div className="p-3 space-y-1.5 flex-1">
          <button
            type="button"
            onClick={() => setActiveSection('queues')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all ${
              activeSection === 'queues'
                ? 'bg-emerald-50 text-emerald-900 font-bold shadow-xs border border-emerald-200/70'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs">
              <span>🩺</span>
              <span>OPD Live Queues</span>
            </div>
            {summary?.totalWaiting > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {summary.totalWaiting}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('departments')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all ${
              activeSection === 'departments'
                ? 'bg-emerald-50 text-emerald-900 font-bold shadow-xs border border-emerald-200/70'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs">
              <span>🏢</span>
              <span>Departments</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              {departments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('doctors')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all ${
              activeSection === 'doctors'
                ? 'bg-emerald-50 text-emerald-900 font-bold shadow-xs border border-emerald-200/70'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs">
              <span>👨‍⚕️</span>
              <span>Doctors &amp; Queues</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              {doctorStations.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('profile')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all ${
              activeSection === 'profile'
                ? 'bg-emerald-50 text-emerald-900 font-bold shadow-xs border border-emerald-200/70'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs">
              <span>📋</span>
              <span>Hospital Profile</span>
            </div>
          </button>

          <div className="pt-4 pb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">
              Patient View
            </span>
          </div>

          <Link
            to={`/hospital/${hospital?.slug || hospital?.id}`}
            target="_blank"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs"
          >
            <span>Public OPD Page</span>
            <span>↗</span>
          </Link>

          <Link
            to="/hospitals"
            target="_blank"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs"
          >
            <span>Hospital Directory</span>
            <span>↗</span>
          </Link>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-800 block truncate">{user?.name || 'Administrator'}</span>
            <span className="text-[10px] text-slate-400">Hospital Admin</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-rose-600 hover:text-rose-700 font-bold text-xs"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* ─── Main Content Workspace ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {hospital?.name || 'Hospital Dashboard'}
            </span>
            <h1 className="font-display font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
              {activeSection === 'queues' && 'OPD Doctor Live Queue Stations'}
              {activeSection === 'departments' && 'Clinical Departments Management'}
              {activeSection === 'doctors' && 'Doctors & Dedicated OPD Queues'}
              {activeSection === 'profile' && 'Hospital Profile & Facilities'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Realtime Live Pulse */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Queue Sync</span>
            </div>

            <button
              type="button"
              onClick={() => fetchDashboard(false)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200"
              title="Refresh Queue Stations"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
            </button>
          </div>
        </header>

        {/* Feedback / Notification alerts */}
        {feedbackMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-700 text-white text-xs font-semibold shadow-md flex items-center justify-between animate-fadeIn">
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
          {/* Top Metric Cards */}
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
              title="Currently with Doctor"
              value={String(summary?.totalServing || 0)}
              subtitle="In doctor cabins"
              accent="indigo"
              icon={<span className="text-lg">🔔</span>}
            />
            <StatCard
              title="Active OPD Queues"
              value={`${summary?.openQueuesCount || 0} / ${doctorStations.length}`}
              subtitle="Accepting walk-in tokens"
              accent="slate"
              icon={<span className="text-lg">🩺</span>}
            />
          </div>

          {/* ─── 1. OPD LIVE QUEUE STATIONS VIEW ─────────────────────────── */}
          {activeSection === 'queues' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                    Doctor OPD Queue Stations
                  </h2>
                  <p className="text-xs text-slate-500">
                    Each doctor has a dedicated queue. Call next patient, mark completed, or pause queue.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (departments.length === 0) {
                        setIsDeptModalOpen(true);
                      } else {
                        setDoctorForm((prev) => ({ ...prev, departmentId: departments[0]?.id || '' }));
                        setIsDoctorModalOpen(true);
                      }
                    }}
                  >
                    + Register Doctor
                  </Button>
                </div>
              </div>

              {/* Stations Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {doctorStations.length === 0 ? (
                  <div className="col-span-full">
                    <EmptyState
                      title="No Doctor OPD Queues"
                      description="Get started by registering doctors and departments for this hospital."
                      action={
                        <Button variant="primary" size="sm" onClick={() => setIsDoctorModalOpen(true)}>
                          + Add Doctor
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  doctorStations.map((station) => {
                    const isQueueOpen = station.isQueueOpen;
                    const serving = station.servingToken;
                    const waitingList = station.waitingTokens || [];

                    return (
                      <Card
                        key={station.doctorId}
                        className="rounded-3xl bg-white border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between"
                      >
                        <div>
                          {/* Station Header */}
                          <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  {station.departmentName}
                                </span>
                                <span className="text-xs font-mono font-bold text-slate-500">
                                  Cabin: {station.roomNumber}
                                </span>
                              </div>
                              <h3 className="font-display font-extrabold text-base text-slate-900 mt-1">
                                {station.doctorName}
                              </h3>
                              <span className="text-xs text-slate-500 block">
                                {station.qualification} • {station.specialization}
                              </span>
                            </div>

                            {/* Queue Toggle switch */}
                            <button
                              type="button"
                              onClick={() => handleToggleQueue(station.doctorId, isQueueOpen, station.doctorName)}
                              className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                                isQueueOpen
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                              }`}
                            >
                              {isQueueOpen ? '● Queue Open' : '⏸ Paused'}
                            </button>
                          </div>

                          {/* Active Serving Patient Box */}
                          <div className="p-5 border-b border-slate-100 bg-emerald-50/30">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Now in Cabin
                            </span>

                            {serving ? (
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <div className="font-mono font-black text-2xl text-emerald-900">
                                    #{serving.token_number}
                                  </div>
                                  <strong className="text-xs font-bold text-slate-800 block">
                                    {serving.patient_name}
                                  </strong>
                                  <span className="text-[11px] font-mono text-slate-500">
                                    📞 {serving.patient_phone}
                                  </span>
                                </div>

                                <Button
                                  type="button"
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleCompleteConsultation(station.doctorId, station.doctorName)}
                                  className="font-bold text-xs bg-slate-900 hover:bg-slate-800"
                                >
                                  ✓ Complete Visit
                                </Button>
                              </div>
                            ) : (
                              <div className="py-2 text-xs text-slate-500 italic flex items-center justify-between">
                                <span>Doctor cabin is currently ready for the next patient.</span>
                              </div>
                            )}
                          </div>

                          {/* Waiting Patient List */}
                          <div className="p-5">
                            <div className="flex items-center justify-between pb-3">
                              <span className="text-xs font-bold text-slate-600">
                                Waiting Patients ({waitingList.length})
                              </span>
                              <span className="text-[11px] text-emerald-800 font-semibold">
                                {waitingList.length > 0 ? `~${station.estimatedWaitMinutes}m wait load` : 'No wait'}
                              </span>
                            </div>

                            {waitingList.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-4 text-center">
                                No patients currently waiting in this queue.
                              </p>
                            ) : (
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {waitingList.map((tok, idx) => (
                                  <div
                                    key={tok.id}
                                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
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
                                        className="text-[11px] font-semibold text-slate-400 hover:text-amber-700 p-1"
                                        title="Skip patient token"
                                      >
                                        Skip
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Station Action Station */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/70">
                          <Button
                            type="button"
                            variant="primary"
                            size="md"
                            disabled={!isQueueOpen || waitingList.length === 0}
                            onClick={() => handleCallNext(station.doctorId, station.doctorName)}
                            className="w-full font-bold shadow-xs py-2.5"
                          >
                            🔔 Call Next Patient ({waitingList.length})
                          </Button>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ─── 2. DEPARTMENTS MANAGEMENT VIEW ──────────────────────────── */}
          {activeSection === 'departments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                    Clinical Departments
                  </h2>
                  <p className="text-xs text-slate-500">
                    Manage hospital clinical departments, floor allocation, and specialties.
                  </p>
                </div>

                <Button variant="primary" size="sm" onClick={() => setIsDeptModalOpen(true)}>
                  + Add Department
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept) => (
                  <Card key={dept.id} className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Code: {dept.code || 'GEN'}
                      </span>
                      <Badge variant="emerald" size="sm">Active</Badge>
                    </div>

                    <h3 className="font-display font-bold text-base text-slate-900">
                      {dept.name}
                    </h3>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      {dept.description || 'General outpatient specialty department.'}
                    </p>

                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
                      <span>Location: <strong>{dept.floor_room || 'OPD Wing'}</strong></span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ─── 3. DOCTORS MANAGEMENT VIEW ──────────────────────────────── */}
          {activeSection === 'doctors' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                    Registered Doctors &amp; OPD Counters
                  </h2>
                  <p className="text-xs text-slate-500">
                    Each doctor has dedicated queue parameters, duration, room number, and consultation fees.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setDoctorForm((prev) => ({ ...prev, departmentId: departments[0]?.id || '' }));
                    setIsDoctorModalOpen(true);
                  }}
                >
                  + Add Doctor
                </Button>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Doctor Name</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Room</th>
                      <th className="py-3 px-4">Consultation Time</th>
                      <th className="py-3 px-4">Fee</th>
                      <th className="py-3 px-4">Queue Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {doctorStations.map((station) => (
                      <tr key={station.doctorId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <strong className="text-slate-900 block">{station.doctorName}</strong>
                          <span className="text-[11px] text-slate-400">{station.qualification}</span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-800">
                          {station.departmentName}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          {station.roomNumber}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          {station.consultationDurationMinutes} mins / patient
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          ₹{station.consultationFee || 500}
                        </td>
                        <td className="py-3.5 px-4">
                          {station.isQueueOpen ? (
                            <Badge variant="emerald" size="sm" dot>Open</Badge>
                          ) : (
                            <Badge variant="amber" size="sm" dot>Paused</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── 4. HOSPITAL PROFILE VIEW ────────────────────────────────── */}
          {activeSection === 'profile' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                  Hospital Profile &amp; Location
                </h2>
                <p className="text-xs text-slate-500">
                  Registered institution information visible on patient search directory.
                </p>
              </div>

              <Card className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Hospital Name</span>
                    <strong className="text-slate-900 text-sm mt-0.5 block">{hospital?.name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Registration License</span>
                    <strong className="text-slate-900 text-sm mt-0.5 block">{hospital?.registrationNumber}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Contact Phone</span>
                    <span className="text-slate-800 font-mono block mt-0.5">{hospital?.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Official Email</span>
                    <span className="text-slate-800 font-mono block mt-0.5">{hospital?.email}</span>
                  </div>
                </div>

                <div className="pb-4 border-b border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Address</span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed">
                    {hospital?.address}, {hospital?.city} - {hospital?.pincode}, {hospital?.state}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Facilities</span>
                  <div className="flex flex-wrap gap-2">
                    {hospital?.facilities?.map((f) => (
                      <span key={f} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-medium">
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

      {/* Modal: Add Department */}
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
              <Button type="submit" variant="primary" size="sm" className="font-bold">
                Save Department
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Add Doctor */}
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
                placeholder="e.g. MBBS, MD (Medicine)"
                value={doctorForm.qualification}
                onChange={(e) => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                error={doctorErrors.qualification}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Specialization / Sub-specialty"
                placeholder="e.g. Diabetologist, Senior Consultant"
                value={doctorForm.specialization}
                onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
              />

              <Input
                label="OPD Cabin / Room Number"
                required
                placeholder="e.g. Cabin 104, 1st Floor"
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
              <Button type="submit" variant="primary" size="sm" className="font-bold">
                Register Doctor &amp; Queue
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

