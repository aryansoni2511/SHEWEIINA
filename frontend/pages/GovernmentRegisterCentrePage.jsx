import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../Navbar';
import FooterSection from '../FooterSection';
import GovtCentreMap from '../components/government/GovtCentreMap';
import { registerGovernmentCentreApi, setStoredToken } from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────────────────────────────────
   Government Kendra Registration Page
   Onboarding for CSCs, Maha E-Seva Kendras, and Municipal Desks.
───────────────────────────────────────────────────────────────────────── */

const CENTRE_TYPES = [
  'Citizen Facilitation Centre',
  'Maha E-Seva Kendra',
  'Common Service Centre (CSC)',
  'Jan Seva Kendra',
  'Aadhaar Enrolment / Update Desk',
  'RTO Citizen Helpdesk',
  'Municipal Ward Facilitation Desk',
];

const ALL_CATEGORIES = ['Aadhaar', 'Passport', 'RTO', 'Municipal'];

export default function GovernmentRegisterCentrePage() {
  const navigate = useNavigate();
  const { setAuthSession } = useAuth();

  const [formData, setFormData] = useState({
    centreName: '',
    centreCode: '',
    centreType: 'Citizen Facilitation Centre',
    phone: '',
    email: '',
    address: '',
    city: 'Mumbai',
    district: 'Mumbai',
    state: 'Maharashtra',
    pincode: '',
    latitude: 19.0760,
    longitude: 72.8777,
    operatingHours: 'Mon - Sat (09:30 AM - 05:30 PM)',
    supportedCategories: ['Aadhaar', 'Passport', 'RTO', 'Municipal'],
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminPhone: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (category) => {
    setFormData((prev) => {
      const exists = prev.supportedCategories.includes(category);
      const updated = exists
        ? prev.supportedCategories.filter((c) => c !== category)
        : [...prev.supportedCategories, category];
      return { ...prev, supportedCategories: updated };
    });
  };

  const handlePickLocation = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.supportedCategories.length === 0) {
      setError('Please select at least one supported citizen service category.');
      return;
    }

    if (formData.adminPassword.length < 6) {
      setError('Admin password must be at least 6 characters long.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await registerGovernmentCentreApi(formData);

      if (res?.success && res.data?.token) {
        setAuthSession(res.data.token, {
          ...res.data.admin,
          centreId: res.data.centre?.id,
          module: 'government',
        });
        navigate('/government/dashboard');
      } else {
        setError(res?.message || 'Failed to register centre. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* ── Header Banner ──────────────────────────────────────────────── */}
        <section
          className="text-white py-12 px-4 sm:px-6 lg:px-8 text-center"
          style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)' }}
        >
          <div className="max-w-4xl mx-auto">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-amber-300 border border-white/20 mb-3">
              🏢 Seva Kendra &amp; Desk Onboarding
            </span>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight">
              Register Your Citizen Facilitation Kendra
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              Equip your CSC or Seva Kendra with live counter tokens, citizen wait-time display, and paperless queue management.
            </p>
          </div>
        </section>

        {/* ── Form Container ─────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6 sm:p-10">
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1: Centre Information */}
              <div>
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                  <span>🏛️</span>
                  <span>Facilitation Kendra Details</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kendra / Desk Name *
                    </label>
                    <input
                      type="text"
                      name="centreName"
                      placeholder="e.g. Dadar Citizen Seva Kendra & CSC"
                      value={formData.centreName}
                      onChange={handleChange}
                      className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Centre Type *
                    </label>
                    <select
                      name="centreType"
                      value={formData.centreType}
                      onChange={handleChange}
                      className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                      required
                    >
                      {CENTRE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Centre Registration / CSC Code *
                    </label>
                    <input
                      type="text"
                      name="centreCode"
                      placeholder="e.g. MH-MUM-CSC-091"
                      value={formData.centreCode}
                      onChange={handleChange}
                      className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kendra Official Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="10-digit phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kendra Official Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="e.g. contact@sevakendra.in"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Address & Location Pin */}
              <div>
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                  <span>📍</span>
                  <span>Physical Location &amp; Pin</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Complete Street Address *
                    </label>
                    <textarea
                      name="address"
                      rows={2}
                      placeholder="Shop/Office number, building, landmark, road..."
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      placeholder="e.g. 400028"
                      value={formData.pincode}
                      onChange={handleChange}
                      className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Operating Hours
                    </label>
                    <input
                      type="text"
                      name="operatingHours"
                      value={formData.operatingHours}
                      onChange={handleChange}
                      className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                    />
                  </div>
                </div>

                {/* Map Pin Picker */}
                <div className="mt-4">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Click on the map or drag the amber pin to pinpoint Kendra location
                  </label>
                  <GovtCentreMap
                    isPickerMode={true}
                    pickerLocation={{ lat: formData.latitude, lng: formData.longitude }}
                    onPickLocation={handlePickLocation}
                    height="280px"
                  />
                  <div className="text-[11px] text-slate-500 mt-1.5 flex gap-4">
                    <span>Latitude: <strong>{formData.latitude}</strong></span>
                    <span>Longitude: <strong>{formData.longitude}</strong></span>
                  </div>
                </div>
              </div>

              {/* Section 3: Supported Categories */}
              <div>
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                  <span>📋</span>
                  <span>Supported Citizen Service Categories</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ALL_CATEGORIES.map((cat) => {
                    const isChecked = formData.supportedCategories.includes(cat);
                    return (
                      <div
                        key={cat}
                        onClick={() => handleCategoryToggle(cat)}
                        className={`p-4 rounded-2xl border text-center cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-blue-50 border-blue-900 ring-1 ring-blue-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xl mb-1">
                          {cat === 'Aadhaar' ? '🪪' : cat === 'Passport' ? '🛂' : cat === 'RTO' ? '🚗' : '🏢'}
                        </div>
                        <div className="font-bold text-xs text-slate-900">{cat} Services</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {isChecked ? '✓ Enabled' : 'Disabled'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 4: Admin Credentials */}
              <div>
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                  <span>🔐</span>
                  <span>Kendra Admin &amp; Operator Credentials</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Operator / Administrator Full Name *
                    </label>
                    <input
                      type="text"
                      name="adminName"
                      placeholder="e.g. Rajesh Patil"
                      value={formData.adminName}
                      onChange={handleChange}
                      className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Login Email Address *
                    </label>
                    <input
                      type="email"
                      name="adminEmail"
                      placeholder="e.g. operator@sevakendra.in"
                      value={formData.adminEmail}
                      onChange={handleChange}
                      className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Create Password (min 6 characters) *
                    </label>
                    <input
                      type="password"
                      name="adminPassword"
                      placeholder="••••••••"
                      value={formData.adminPassword}
                      onChange={handleChange}
                      className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-blue-950 hover:bg-blue-900 disabled:opacity-50 text-white font-bold text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Setting Up Facilitation Kendra...</span>
                    </>
                  ) : (
                    <span>Register Facilitation Kendra &amp; Open Dashboard →</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
