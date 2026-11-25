import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../Navbar';
import FooterSection from '../FooterSection';
import { getHospitalDetailsApi, requestHospitalOpdTokenApi } from '../services/api';
import HospitalMap from '../components/hospital/HospitalMap';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';

/* ─────────────────────────────────────────────────────────────────────────
   Hospital Details Page — OPD Departments & Doctor Queue Listing
   Healthcare teal/cyan theme — all API, validation, and navigation preserved
───────────────────────────────────────────────────────────────────────── */

export default function HospitalDetailsPage() {
  const { hospitalId } = useParams();
  const navigate = useNavigate();

  const [hospital, setHospital] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Map modal
  const [showMapModal, setShowMapModal] = useState(false);

  // Patient OPD booking modal
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [patientForm, setPatientForm] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'Not Specified',
  });
  const [patientErrors, setPatientErrors] = useState({});
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [duplicateToken, setDuplicateToken] = useState(null);

  // Load hospital data from real API
  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await getHospitalDetailsApi(hospitalId);
      if (res.data) {
        setHospital(res.data.hospital);
        setDepartments(res.data.departments || []);
        setDoctors(res.data.doctors || []);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load hospital details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [hospitalId]);

  // Filter doctors by selected department
  const filteredDoctors = doctors.filter((doc) => {
    if (selectedDeptId === 'ALL') return true;
    return doc.departmentId === selectedDeptId;
  });

  // Handle OPD token request submit — full validation preserved
  const handleConfirmToken = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!patientForm.name.trim() || patientForm.name.trim().length < 2) {
      errors.name = 'Patient name is required (minimum 2 characters).';
    }
    const cleanPhone = patientForm.phone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      errors.phone = 'Valid 10-digit mobile number is required.';
    }
    setPatientErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBookingLoading(true);
    setBookingError(null);
    setDuplicateToken(null);

    try {
      const res = await requestHospitalOpdTokenApi({
        hospitalId: hospital.id,
        doctorId: bookingDoctor.id,
        patientName: patientForm.name.trim(),
        patientPhone: cleanPhone,
        patientAge: patientForm.age ? Number(patientForm.age) : null,
        patientGender: patientForm.gender,
      });

      if (res.data?.token) {
        navigate(`/hospital/token/${res.data.token.id || res.data.token.token_number}`);
      }
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
        setBookingError(null);
      } else {
        setDuplicateToken(null);
        setBookingError(err.message || 'Failed to request OPD token.');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  /* ── Loading ────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="bg-[#F0F9FF] min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div
              className="w-14 h-14 border-4 border-t-transparent rounded-full animate-spin mx-auto"
              style={{ borderColor: '#0891B2', borderTopColor: 'transparent' }}
            />
            <p className="text-sm font-semibold text-slate-600">Loading Hospital OPD...</p>
          </div>
        </div>
        <FooterSection />
      </div>
    );
  }

  /* ── Error ──────────────────────────────────────────────────────────── */
  if (errorMessage || !hospital) {
    return (
      <div className="bg-[#F0F9FF] min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center">
          <EmptyState
            title="Hospital Not Found"
            description={errorMessage || 'The hospital you are looking for does not exist or has been deactivated.'}
            action={
              <Link to="/hospitals">
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)' }}
                >
                  ← Back to Hospital Directory
                </button>
              </Link>
            }
          />
        </div>
        <FooterSection />
      </div>
    );
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;

  return (
    <div
      className="text-[#172033] font-sans antialiased min-h-screen flex flex-col selection:bg-cyan-600 selection:text-white"
      style={{ background: '#F0F9FF' }}
    >
      <Navbar />

      <main className="flex-1 pb-16">

        {/* ── Hospital Hero Header ──────────────────────────────────────── */}
        <section
          className="relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0E7490 0%, #0891B2 100%)' }}
        >
          {/* Decorative circle */}
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, white, transparent 70%)', transform: 'translate(30%, -30%)' }}
          />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
            {/* Breadcrumb */}
            <Link
              to="/hospitals"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200 hover:text-white mb-6 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Hospital Directory
            </Link>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              {/* Hospital identity */}
              <div className="flex items-start gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 font-bold text-3xl shadow-md border border-white/30"
                  style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
                >
                  🏥
                </div>
                <div>
                  {/* Type + Reg badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
                      {hospital.hospitalType || 'Multi-Specialty'}
                    </span>
                    {hospital.registrationNumber && (
                      <span className="text-xs text-cyan-100 font-medium">
                        Reg. {hospital.registrationNumber}
                      </span>
                    )}
                  </div>

                  <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                    {hospital.name}
                  </h1>

                  <p className="text-sm text-cyan-100 mt-1.5 leading-relaxed">
                    📍 {hospital.address}, {hospital.city} — {hospital.pincode}, {hospital.state}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-cyan-100">
                    {hospital.phone && <span>📞 <strong>{hospital.phone}</strong></span>}
                    {hospital.email && <span>✉️ <strong>{hospital.email}</strong></span>}
                    {hospital.openingHours && <span>🕐 {hospital.openingHours}</span>}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs border border-white/30 transition-colors flex items-center gap-1.5"
                >
                  <span>Directions</span>
                  <span>↗</span>
                </a>
                {hospital.latitude && hospital.longitude && (
                  <button
                    type="button"
                    onClick={() => setShowMapModal(true)}
                    className="px-4 py-2 rounded-xl bg-white text-cyan-800 font-bold text-xs shadow-sm hover:bg-cyan-50 transition-colors flex items-center gap-1.5"
                  >
                    🗺️ View on Map
                  </button>
                )}
              </div>
            </div>

            {/* Facilities strip */}
            {hospital.facilities && hospital.facilities.length > 0 && (
              <div className="mt-6 pt-5 border-t border-white/20 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-cyan-200 uppercase tracking-wider mr-1">
                  Facilities:
                </span>
                {hospital.facilities.map((fac) => (
                  <span
                    key={fac}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium border"
                    style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderColor: 'rgba(255,255,255,0.25)' }}
                  >
                    ✓ {fac}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── OPD Departments & Doctors Section ──────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
            <div>
              <h2 className="font-display font-extrabold text-xl text-slate-900 tracking-tight">
                OPD Departments & Available Doctors
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose a department, check live wait times, and get your OPD token instantly.
              </p>
            </div>
            <div className="text-xs text-slate-500 font-medium shrink-0">
              <strong style={{ color: '#0891B2' }}>{filteredDoctors.length}</strong>{' '}
              {filteredDoctors.length === 1 ? 'doctor' : 'doctors'} available
            </div>
          </div>

          {/* Department filter tabs */}
          <div className="flex flex-wrap items-center gap-2 pb-6 border-b border-slate-200/70">
            <button
              type="button"
              onClick={() => setSelectedDeptId('ALL')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
                selectedDeptId === 'ALL'
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
              style={selectedDeptId === 'ALL' ? { background: 'linear-gradient(135deg, #0E7490, #0891B2)', borderColor: 'transparent' } : {}}
            >
              All Departments ({doctors.length})
            </button>

            {departments.map((dept) => {
              const count = doctors.filter((d) => d.departmentId === dept.id).length;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setSelectedDeptId(dept.id)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all border ${
                    selectedDeptId === dept.id
                      ? 'text-white border-transparent shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                  style={selectedDeptId === dept.id ? { background: 'linear-gradient(135deg, #0E7490, #0891B2)', borderColor: 'transparent' } : {}}
                >
                  {dept.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Doctor cards grid */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  title="No doctors in this department"
                  description="Select another department or check back during regular OPD hours."
                  action={
                    <Button variant="secondary" size="sm" onClick={() => setSelectedDeptId('ALL')}>
                      Show All Doctors
                    </Button>
                  }
                />
              </div>
            ) : (
              filteredDoctors.map((doc) => {
                const isOpen        = doc.queue?.isOpen !== false;
                const waitingCount  = doc.queue?.waitingCount || 0;
                const servingToken  = doc.queue?.servingTokenNumber;
                const estimatedWait = doc.queue?.estimatedWaitMinutes || 0;

                return (
                  <Card
                    key={doc.id}
                    className={`p-6 rounded-3xl bg-white border transition-all flex flex-col justify-between ${
                      isOpen
                        ? 'border-slate-200/90 hover:border-cyan-300 hover:shadow-md shadow-xs'
                        : 'border-slate-200/70 opacity-80'
                    }`}
                  >
                    <div>
                      {/* Doctor header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold text-base border"
                            style={{ background: '#ECFEFF', borderColor: '#A5F3FC', color: '#0E7490' }}
                          >
                            🩺
                          </div>
                          <div>
                            <span
                              className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border mb-1"
                              style={{ background: '#F0F9FF', color: '#0369A1', borderColor: '#BAE6FD' }}
                            >
                              {doc.departmentName || 'General OPD'}
                            </span>
                            <h3 className="font-display font-bold text-sm text-slate-900 line-clamp-1">
                              {doc.name}
                            </h3>
                            <span className="text-xs text-slate-500 font-medium">{doc.qualification}</span>
                          </div>
                        </div>

                        {/* OPD status badge */}
                        {isOpen ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0"
                            style={{ background: '#ECFEFF', color: '#0E7490', borderColor: '#A5F3FC' }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#06B6D4' }} />
                            OPD Open
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Paused
                          </span>
                        )}
                      </div>

                      {/* Specialization */}
                      {doc.specialization && (
                        <p
                          className="text-xs font-medium mb-3 pl-13"
                          style={{ color: '#0891B2' }}
                        >
                          {doc.specialization}
                        </p>
                      )}

                      {/* Room + Timings + Fee */}
                      <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Cabin / Room:</span>
                          <span className="font-bold text-slate-800">{doc.roomNumber}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">OPD Timings:</span>
                          <span className="text-slate-700">{doc.availability}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Consultation Fee:</span>
                          <span className="font-bold text-slate-900">
                            {doc.consultationFee ? `₹${doc.consultationFee}` : 'OPD Free'}
                          </span>
                        </div>
                      </div>

                      {/* Live queue stats */}
                      <div
                        className="mt-4 p-3.5 rounded-2xl border space-y-2"
                        style={{ background: '#ECFEFF', borderColor: '#CFFAFE' }}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">Currently Serving:</span>
                          <span className="font-mono font-bold" style={{ color: '#0E7490' }}>
                            {servingToken ? `#${servingToken}` : 'Ready for next'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">In Queue:</span>
                          <span className="font-bold text-slate-900">
                            {waitingCount} {waitingCount === 1 ? 'patient' : 'patients'}
                          </span>
                        </div>
                        <div
                          className="flex items-center justify-between text-xs pt-1 border-t"
                          style={{ borderColor: '#A5F3FC' }}
                        >
                          <span className="text-slate-500">Est. Wait:</span>
                          <span className="font-bold" style={{ color: '#0E7490' }}>
                            {waitingCount > 0 ? `~${estimatedWait} mins` : 'Walk in now'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CTA button */}
                    <div className="mt-5 pt-2">
                      <button
                        type="button"
                        disabled={!isOpen}
                        onClick={() => {
                          setBookingDoctor(doc);
                          setBookingError(null);
                          setDuplicateToken(null);
                          setPatientForm({ name: '', phone: '', age: '', gender: 'Not Specified' });
                          setPatientErrors({});
                        }}
                        className={`w-full py-3 rounded-2xl text-xs font-bold transition-all ${
                          !isOpen
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'text-white hover:opacity-90 shadow-sm'
                        }`}
                        style={isOpen ? { background: 'linear-gradient(135deg, #0E7490, #0891B2)' } : {}}
                      >
                        {isOpen ? 'Get OPD Token →' : 'Queue Currently Paused'}
                      </button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* ── Map Modal ───────────────────────────────────────────────────── */}
      {showMapModal && (
        <Modal
          isOpen={showMapModal}
          onClose={() => setShowMapModal(false)}
          title={hospital.name}
          description={`${hospital.address}, ${hospital.city} — ${hospital.pincode}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <HospitalMap
              hospitals={[hospital]}
              selectedHospital={hospital}
              height="400px"
            />
            <div className="flex items-center justify-between pt-2">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold flex items-center gap-1 transition-colors"
                style={{ color: '#0891B2' }}
              >
                <span>Open in Google Maps</span>
                <span>↗</span>
              </a>
              <Button variant="secondary" size="sm" onClick={() => setShowMapModal(false)}>
                Close Map
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── OPD Token Request Modal ─────────────────────────────────────── */}
      {bookingDoctor && (
        <Modal
          isOpen={Boolean(bookingDoctor)}
          onClose={() => {
            setBookingDoctor(null);
            setBookingError(null);
            setDuplicateToken(null);
          }}
          title={`OPD Token — ${bookingDoctor.name}`}
          description={`Department: ${bookingDoctor.departmentName} · Room: ${bookingDoctor.roomNumber}`}
          maxWidth="max-w-md"
        >
          {/* Active OPD Token Recovery Alert & Action */}
          {duplicateToken && duplicateToken.tokenId && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-4 p-4 rounded-2xl bg-cyan-50 border border-cyan-200 text-[#0E7490] flex flex-col gap-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-cyan-700 text-lg mt-0.5">🎫</span>
                  <div>
                    <h4 className="text-sm font-bold text-cyan-950">
                      Active OPD Token Already Registered
                    </h4>
                    <p className="text-xs text-cyan-800 mt-1">
                      You already have active OPD Token{' '}
                      <strong className="font-semibold text-cyan-950">
                        #{duplicateToken.tokenNumber || 'Active'}
                      </strong>{' '}
                      in Dr. {bookingDoctor.name}'s OPD queue.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-cyan-100 text-cyan-900 border border-cyan-200">
                        Status: <strong className="ml-1 uppercase">{duplicateToken.status || 'WAITING'}</strong>
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDuplicateToken(null)}
                  className="text-cyan-600 hover:text-cyan-900 text-sm font-bold p-1 leading-none rounded"
                  aria-label="Dismiss active token alert"
                >
                  ✕
                </button>
              </div>

              <div className="pt-2 border-t border-cyan-200/60 flex items-center justify-end">
                <Link
                  to={`/hospital/token/${duplicateToken.tokenId}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:opacity-95"
                  style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)' }}
                >
                  <span>View Active OPD Token</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          )}

          {bookingError && !duplicateToken && (
            <div role="alert" className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{bookingError}</span>
            </div>
          )}

          <form onSubmit={handleConfirmToken} className="space-y-4 text-xs">
            <Input
              label="Patient Full Name"
              required
              placeholder="e.g. Rohan Sharma"
              value={patientForm.name}
              onChange={(e) => {
                setPatientForm({ ...patientForm, name: e.target.value });
                if (patientErrors.name) setPatientErrors({ ...patientErrors, name: null });
              }}
              error={patientErrors.name}
            />

            <Input
              label="Mobile Number (for SMS & turn alerts)"
              type="tel"
              required
              placeholder="e.g. 9820123456"
              value={patientForm.phone}
              onChange={(e) => {
                setPatientForm({ ...patientForm, phone: e.target.value });
                if (patientErrors.phone) setPatientErrors({ ...patientErrors, phone: null });
              }}
              error={patientErrors.phone}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Age (Years)"
                type="number"
                placeholder="e.g. 35"
                value={patientForm.age}
                onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
              />
              <Select
                label="Gender"
                value={patientForm.gender}
                onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
              >
                <option value="Not Specified">Not Specified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
            </div>

            {/* Summary */}
            <div
              className="p-3 rounded-xl border space-y-1.5 text-[11px]"
              style={{ background: '#ECFEFF', borderColor: '#CFFAFE', color: '#164E63' }}
            >
              <div className="flex justify-between">
                <span>Consultation Fee:</span>
                <strong className="text-slate-900">
                  {bookingDoctor.consultationFee ? `₹${bookingDoctor.consultationFee}` : 'Free'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Estimated Wait:</span>
                <strong style={{ color: '#0E7490' }}>
                  {bookingDoctor.queue?.waitingCount > 0
                    ? `~${bookingDoctor.queue?.estimatedWaitMinutes} mins`
                    : 'Walk in now'}
                </strong>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setBookingDoctor(null);
                  setBookingError(null);
                  setDuplicateToken(null);
                }}
              >
                Cancel
              </Button>
              <button
                type="submit"
                disabled={bookingLoading}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 shadow-sm disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)' }}
              >
                {bookingLoading ? 'Issuing Token...' : 'Confirm OPD Token'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <FooterSection />
    </div>
  );
}
