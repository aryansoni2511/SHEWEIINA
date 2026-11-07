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
  const { login } = useAuth();

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
        setStoredToken(res.data.token);
        // Login session in context
        login(res.data.token, res.data.admin);
        navigate('/hospital/dashboard');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] text-[#172033] font-sans antialiased min-h-screen flex flex-col selection:bg-emerald-600 selection:text-white">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-bold tracking-wider uppercase text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              Healthcare Institution Onboarding
            </span>
            <h1 className="mt-3 font-display text-3xl font-extrabold text-slate-900 tracking-tight">
              Register Your Hospital on Shewwina
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Provide multi-department OPD live queues, eliminate crowded waiting rooms, and allow patients to track consultation turns on mobile.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
              <span>⚠️ {errorMessage}</span>
              <button type="button" onClick={() => setErrorMessage(null)} className="font-bold">✕</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Hospital Information */}
            <Card className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                  <span>🏥</span>
                  <span>Hospital Profile &amp; Licensure</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  General identification and contact information. License numbers are securely stored for operational tracking.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Hospital Name"
                  required
                  placeholder="e.g. Metro Care Multi-Specialty Hospital"
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
                  placeholder="e.g. MAH-HOSP-2024-9182"
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
                  label="Hospital Category"
                  value={formData.hospitalType}
                  onChange={(e) => setFormData({ ...formData, hospitalType: e.target.value })}
                >
                  {HOSPITAL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Reception Phone"
                  type="tel"
                  required
                  placeholder="e.g. 9820123456"
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
                  placeholder="e.g. opd@hospital.org"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (formErrors.email) setFormErrors({ ...formErrors, email: null });
                  }}
                  error={formErrors.email}
                />
              </div>
            </Card>

            {/* 2. Location & Interactive Map Picker */}
            <Card className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                  <span>📍</span>
                  <span>Hospital Location &amp; Address</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pinpoint your hospital on the interactive map so patients can find navigation directions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Full Street Address"
                    required
                    placeholder="e.g. Plot 42, Health City Avenue, Andheri West"
                    value={formData.address}
                    onChange={(e) => {
                      setFormData({ ...formData, address: e.target.value });
                      if (formErrors.address) setFormErrors({ ...formErrors, address: null });
                    }}
                    error={formErrors.address}
                  />
                </div>

                <Input
                  label="City"
                  required
                  value={formData.city}
                  onChange={(e) => {
                    setFormData({ ...formData, city: e.target.value });
                    if (formErrors.city) setFormErrors({ ...formErrors, city: null });
                  }}
                  error={formErrors.city}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />

                <Input
                  label="PIN Code"
                  required
                  placeholder="e.g. 400058"
                  value={formData.pincode}
                  onChange={(e) => {
                    setFormData({ ...formData, pincode: e.target.value });
                    if (formErrors.pincode) setFormErrors({ ...formErrors, pincode: null });
                  }}
                  error={formErrors.pincode}
                />

                <Input
                  label="Opening & OPD Hours"
                  value={formData.openingHours}
                  onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                />
              </div>

              {/* Interactive Map Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Hospital GPS Pin (Click or drag pin on map to set coordinates)
                </label>
                <HospitalMap
                  isPickerMode={true}
                  pickerLocation={{ lat: formData.latitude, lng: formData.longitude }}
                  onPickLocation={handlePickLocation}
                  height="340px"
                />
                <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-mono">
                  <span>Selected Latitude: <strong>{formData.latitude}</strong></span>
                  <span>•</span>
                  <span>Longitude: <strong>{formData.longitude}</strong></span>
                </div>
              </div>
            </Card>

            {/* 3. Facilities Selection */}
            <Card className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                  <span>🩺</span>
                  <span>Available Medical Facilities</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select available amenities displayed on patient search and discovery cards.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-2">
                {AVAILABLE_FACILITIES.map((facility) => {
                  const isChecked = formData.facilities.includes(facility);
                  return (
                    <button
                      key={facility}
                      type="button"
                      onClick={() => toggleFacility(facility)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                        isChecked
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {facility}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* 4. Administrator Account */}
            <Card className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                  <span>🔐</span>
                  <span>Hospital Administrator Account</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Login credentials to manage OPD queues, departments, and doctors.
                </p>
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
                  label="Administrator Mobile Phone"
                  type="tel"
                  placeholder="Leave empty to use hospital phone"
                  value={formData.adminPhone}
                  onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                />
              </div>
            </Card>

            {/* Disclaimer & Submit */}
            <div className="p-4 rounded-2xl bg-slate-100/90 border border-slate-200 text-xs text-slate-500 leading-relaxed">
              <strong>Notice:</strong> Submitting this form activates the hospital OPD queue management dashboard. Registration numbers are logged for administrative reference; Shewwina does not issue state statutory medical licenses.
            </div>

            <div className="flex items-center justify-between pt-4">
              <Link to="/hospitals" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                ← Back to Hospital Directory
              </Link>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={submitting}
                className="font-bold shadow-md px-8"
              >
                {submitting ? 'Registering Hospital...' : 'Complete Hospital Registration'}
              </Button>
            </div>
          </form>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}

