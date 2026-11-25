import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import FooterSection from '../FooterSection';
import HospitalMap from '../components/hospital/HospitalMap';
import { registerHospitalApi, setStoredToken } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Card } from '../components/ui/Card';

/* ─────────────────────────────────────────────────────────────────────────
   Hospital Registration Page — Premium Healthcare Identity
   Healthcare teal/cyan theme — all state, validation, and API logic preserved
───────────────────────────────────────────────────────────────────────── */

const HOSPITAL_TYPES = [
  'Multi-Specialty',
  'General',
  'Super-Specialty',
  'District Hospital',
  'Clinic & Daycare',
];

const AVAILABLE_FACILITIES = [
  'Emergency 24x7',
  'ICU',
  'Pharmacy',
  'Diagnostic Lab',
  'Ambulance',
  'Radiology / CT Scan',
  'Dialysis Center',
  'Blood Bank',
  'NICU / PICU',
  'Pathology Lab',
  'Physiotherapy Center',
];

export default function HospitalRegisterPage() {
  const navigate = useNavigate();
  const { setAuthSession } = useAuth();

  const [formData, setFormData] = useState({
    hospitalName: '',
    registrationNumber: '',
    hospitalType: 'Multi-Specialty',
    phone: '',
    email: '',
    address: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '',
    latitude: 19.076,
    longitude: 72.8777,
    facilities: ['Emergency 24x7', 'Pharmacy', 'OPD'],
    openingHours: '24x7 Emergency / OPD: 09:00 AM - 05:00 PM',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminPhone: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  /* Facility toggle — preserved exactly */
  const toggleFacility = (facility) => {
    setFormData((prev) => {
      const exists = prev.facilities.includes(facility);
      return {
        ...prev,
        facilities: exists
          ? prev.facilities.filter((f) => f !== facility)
          : [...prev.facilities, facility],
      };
    });
  };

  /* Map location pick — preserved exactly */
  const handlePickLocation = (lat, lng, addressInfo = {}) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      ...(addressInfo.city ? { city: addressInfo.city } : {}),
      ...(addressInfo.pincode ? { pincode: addressInfo.pincode } : {}),
      ...(addressInfo.state ? { state: addressInfo.state } : {}),
      ...(addressInfo.address && !prev.address ? { address: addressInfo.address } : {}),
    }));
  };

  /* Validation — preserved exactly */
  const validate = () => {
    const errors = {};
    if (!formData.hospitalName.trim() || formData.hospitalName.trim().length < 2) {
      errors.hospitalName = 'Hospital name is required.';
    }
    if (!formData.registrationNumber.trim()) {
      errors.registrationNumber = 'Hospital Registration / License number is required.';
    }
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Valid 10-digit hospital contact number is required.';
    }
    if (!formData.email.includes('@')) {
      errors.email = 'Valid hospital email is required.';
    }
    if (!formData.address.trim() || formData.address.trim().length < 5) {
      errors.address = 'Full hospital address is required.';
    }
    if (!formData.city.trim()) {
      errors.city = 'City is required.';
    }
    if (!/^\d{6}$/.test(formData.pincode.trim())) {
      errors.pincode = 'Valid 6-digit Indian PIN code is required.';
    }
    if (!formData.adminName.trim() || formData.adminName.trim().length < 2) {
      errors.adminName = 'Administrator name is required.';
    }
    if (!formData.adminEmail.includes('@')) {
      errors.adminEmail = 'Valid administrator email address is required.';
    }
    if (!formData.adminPassword || formData.adminPassword.length < 8) {
      errors.adminPassword = 'Password must be at least 8 characters.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* Submit — preserved exactly */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await registerHospitalApi({
        ...formData,
        adminPhone: formData.adminPhone || formData.phone,
      });

      if (res.data?.token) {
        setAuthSession(res.data.token, {
          ...res.data.admin,
          hospitalId: res.data.hospital?.id,
          module: 'hospital',
        });
        navigate('/hospital/dashboard');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="text-[#172033] font-sans antialiased min-h-screen flex flex-col selection:bg-cyan-600 selection:text-white"
      style={{ background: '#F0F9FF' }}
    >
      <Navbar />

      {/* ── Page Hero ──────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0E7490 0%, #0891B2 100%)' }}
      >
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, white, transparent 70%)', transform: 'translate(30%,-30%)' }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <Link
            to="/hospitals"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200 hover:text-white mb-6 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Hospital Directory
          </Link>

          <div className="flex items-start gap-3 sm:gap-4">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xl sm:text-2xl border border-white/30 shadow-md"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
            >
              🏥
            </div>
            <div className="text-white min-w-0 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-2 border border-white/20">
                For Hospital Administrators
              </div>
              <h1 className="font-display font-black text-xl sm:text-3xl tracking-tight">
                Register Your Hospital
              </h1>
              <p className="text-cyan-100 text-xs sm:text-sm mt-1.5 leading-relaxed max-w-xl break-words">
                Set up your hospital's OPD digital queue system in minutes. Patients discover your
                departments, find doctors, and join virtual OPD queues — no physical waiting needed.
              </p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-cyan-100 font-medium">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Free to register
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Live OPD dashboard access
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Manage departments & doctors
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Secure admin login
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">

          {/* Global error */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
              <span>⚠️ {errorMessage}</span>
              <button type="button" onClick={() => setErrorMessage(null)} className="font-bold">✕</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>

            {/* ── Section 1: Hospital Information ─────────────────────── */}
            <Card className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)' }}
                >
                  1
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-slate-900">Hospital Information</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Official hospital details visible to patients in search results.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Hospital Name"
                  required
                  placeholder="e.g. City Care Multi-Specialty Hospital"
                  value={formData.hospitalName}
                  onChange={(e) => {
                    setFormData({ ...formData, hospitalName: e.target.value });
                    if (formErrors.hospitalName) setFormErrors({ ...formErrors, hospitalName: null });
                  }}
                  error={formErrors.hospitalName}
                />
                <Input
                  label="Registration / License Number"
                  required
                  placeholder="e.g. MH-MU-2024-12345"
                  value={formData.registrationNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, registrationNumber: e.target.value });
                    if (formErrors.registrationNumber) setFormErrors({ ...formErrors, registrationNumber: null });
                  }}
                  error={formErrors.registrationNumber}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Hospital Type"
                  value={formData.hospitalType}
                  onChange={(e) => setFormData({ ...formData, hospitalType: e.target.value })}
                >
                  {HOSPITAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
                <Input
                  label="Contact Phone"
                  type="tel"
                  required
                  placeholder="e.g. 9820000000"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                  }}
                  error={formErrors.phone}
                />
                <Input
                  label="Official Email"
                  type="email"
                  required
                  placeholder="e.g. opd@hospital.in"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (formErrors.email) setFormErrors({ ...formErrors, email: null });
                  }}
                  error={formErrors.email}
                />
              </div>

              <Input
                label="OPD / Emergency Hours"
                placeholder="e.g. 24x7 Emergency / OPD: 09:00 AM - 05:00 PM"
                value={formData.openingHours}
                onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
              />
            </Card>

            {/* ── Section 2: Location & Address ───────────────────────── */}
            <Card className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)' }}
                >
                  2
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-slate-900">Location & Address</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Accurate location helps patients find directions and discover nearby hospitals.</p>
                </div>
              </div>

              <Input
                label="Full Street Address"
                required
                placeholder="e.g. 45, MG Road, Andheri West"
                value={formData.address}
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value });
                  if (formErrors.address) setFormErrors({ ...formErrors, address: null });
                }}
                error={formErrors.address}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="City"
                  required
                  placeholder="e.g. Mumbai"
                  value={formData.city}
                  onChange={(e) => {
                    setFormData({ ...formData, city: e.target.value });
                    if (formErrors.city) setFormErrors({ ...formErrors, city: null });
                  }}
                  error={formErrors.city}
                />
                <Input
                  label="State"
                  placeholder="e.g. Maharashtra"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
                <Input
                  label="PIN Code"
                  required
                  placeholder="e.g. 400053"
                  value={formData.pincode}
                  onChange={(e) => {
                    setFormData({ ...formData, pincode: e.target.value });
                    if (formErrors.pincode) setFormErrors({ ...formErrors, pincode: null });
                  }}
                  error={formErrors.pincode}
                />
              </div>

              {/* Map location picker */}
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  📍 Pin hospital location on map — click to place marker
                </p>
                <div
                  className="rounded-2xl overflow-hidden border"
                  style={{ borderColor: '#A5F3FC' }}
                >
                  <HospitalMap
                    hospitals={[{
                      id: 'preview',
                      name: formData.hospitalName || 'Your Hospital',
                      latitude: formData.latitude,
                      longitude: formData.longitude,
                      hospitalType: formData.hospitalType,
                      address: formData.address,
                      city: formData.city,
                      pincode: formData.pincode,
                      facilities: formData.facilities,
                    }]}
                    selectedHospital={{
                      id: 'preview',
                      latitude: formData.latitude,
                      longitude: formData.longitude,
                    }}
                    onMapClick={handlePickLocation}
                    height="300px"
                    isEditable
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Coordinates: {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
                </p>
              </div>
            </Card>

            {/* ── Section 3: Facilities ────────────────────────────────── */}
            <Card className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)' }}
                >
                  3
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-slate-900">Available Facilities</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Select all amenities available at your hospital. These appear on patient search results.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {AVAILABLE_FACILITIES.map((facility) => {
                  const isChecked = formData.facilities.includes(facility);
                  return (
                    <button
                      key={facility}
                      type="button"
                      onClick={() => toggleFacility(facility)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        isChecked
                          ? 'text-white border-transparent shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                      }`}
                      style={isChecked ? { background: 'linear-gradient(135deg, #0E7490, #0891B2)', borderColor: 'transparent' } : {}}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {facility}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* ── Section 4: Admin Account ─────────────────────────────── */}
            <Card className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)' }}
                >
                  4
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-slate-900">Hospital Administrator Account</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Login credentials to manage OPD queues, departments and doctors.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Administrator Full Name"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={formData.adminName}
                  onChange={(e) => {
                    setFormData({ ...formData, adminName: e.target.value });
                    if (formErrors.adminName) setFormErrors({ ...formErrors, adminName: null });
                  }}
                  error={formErrors.adminName}
                />
                <Input
                  label="Administrator Email (Login ID)"
                  type="email"
                  required
                  placeholder="e.g. admin@hospital.org"
                  value={formData.adminEmail}
                  onChange={(e) => {
                    setFormData({ ...formData, adminEmail: e.target.value });
                    if (formErrors.adminEmail) setFormErrors({ ...formErrors, adminEmail: null });
                  }}
                  error={formErrors.adminEmail}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={formData.adminPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, adminPassword: e.target.value });
                    if (formErrors.adminPassword) setFormErrors({ ...formErrors, adminPassword: null });
                  }}
                  error={formErrors.adminPassword}
                />
                <Input
                  label="Administrator Mobile"
                  type="tel"
                  placeholder="Leave blank to use hospital phone"
                  value={formData.adminPhone}
                  onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                />
              </div>
            </Card>

            {/* Disclaimer */}
            <div className="p-4 rounded-2xl border text-xs text-slate-500 leading-relaxed"
              style={{ background: '#F8FAFC', borderColor: '#E2E8F0' }}
            >
              <strong>Notice:</strong> Submitting this form activates the hospital OPD queue management
              dashboard. Registration numbers are logged for administrative reference. SHEWWINA does
              not issue or verify state statutory medical licenses.
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-2">
              <Link
                to="/hospitals"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Directory
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3.5 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 shadow-md disabled:opacity-60"
                style={{ background: submitting ? '#94A3B8' : 'linear-gradient(135deg, #0E7490, #0891B2)' }}
              >
                {submitting ? 'Registering Hospital...' : 'Complete Hospital Registration →'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
