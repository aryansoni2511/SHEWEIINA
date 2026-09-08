import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateName, validateBusinessName, validatePhone } from '../utils/validation';
import LogoMark from '../components/LogoMark';

export default function BusinessRegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('salon');
  const [city, setCity] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Field-level validation errors shown inline
  const [fieldErrors, setFieldErrors] = useState({});

  const { registerBusiness } = useAuth();
  const navigate = useNavigate();

  /**
   * Run all field validations and return true if all pass.
   * Also sets field-level error messages for inline display.
   */
  function validateAll() {
    const errors = {};

    const ownerNameCheck = validateName(name);
    if (!ownerNameCheck.valid) errors.name = ownerNameCheck.message;

    const bizNameCheck = validateBusinessName(businessName);
    if (!bizNameCheck.valid) errors.businessName = bizNameCheck.message;

    if (!email || email.trim() === '') {
      errors.email = 'Email is required.';
    }

    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.valid) errors.phone = phoneCheck.message;

    if (!city || city.trim().length < 2) {
      errors.city = 'City is required.';
    }

    if (!password || password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate on submit — prevent invalid form submission
    if (!validateAll()) return;

    setLoading(true);

    try {
      await registerBusiness({
        name: name.trim(),
        email,
        phone,
        password,
        confirmPassword,
        businessName: businessName.trim(),
        category,
        city,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Business registration failed. Please try again.');
      setLoading(false);
    }
  };

  // Inline error component
  const FieldError = ({ field }) =>
    fieldErrors[field] ? (
      <p className="mt-1.5 text-xs text-rose-400 font-medium">{fieldErrors[field]}</p>
    ) : null;

  const inputClass = (field) =>
    `w-full px-4 py-3 bg-slate-950 border rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 transition-all ${
      fieldErrors[field] ? 'border-rose-600 focus:ring-rose-500' : 'border-slate-800 focus:ring-emerald-500'
    }`;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 selection:bg-blue-600 selection:text-white">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">

        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <LogoMark className="w-12 h-12" variant="emerald" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Register Your Business</h1>
          <p className="text-xs text-slate-400 mt-1">Set up your digital queue in less than 2 minutes</p>
        </div>

        {/* Global error banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center justify-between">
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} className="text-rose-400 font-bold ml-2">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Owner Name + Business Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Owner Name</label>
              <input
                id="biz-owner-name"
                type="text"
                required
                placeholder="e.g. Vikram Malhotra"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) {
                    const c = validateName(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, name: c.valid ? undefined : c.message }));
                  }
                }}
                className={inputClass('name')}
              />
              <FieldError field="name" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Business Name</label>
              <input
                id="biz-business-name"
                type="text"
                required
                placeholder="e.g. Royal Unisex Salon"
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  if (fieldErrors.businessName) {
                    const c = validateBusinessName(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, businessName: c.valid ? undefined : c.message }));
                  }
                }}
                className={inputClass('businessName')}
              />
              <FieldError field="businessName" />
            </div>
          </div>

          {/* Category + City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Category</label>
              <select
                id="biz-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              >
                <option value="salon">Salon &amp; Spa</option>
                <option value="clinic">Clinic &amp; Healthcare</option>
                <option value="barber">Barbershop</option>
                <option value="other">Other Service</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">City</label>
              <input
                id="biz-city"
                type="text"
                required
                placeholder="e.g. Mumbai"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  if (fieldErrors.city) {
                    setFieldErrors((prev) => ({ ...prev, city: e.target.value.trim().length >= 2 ? undefined : 'City is required.' }));
                  }
                }}
                className={inputClass('city')}
              />
              <FieldError field="city" />
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <input
                id="biz-email"
                type="email"
                required
                placeholder="contact@royalsalon.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: e.target.value.trim() ? undefined : 'Email is required.' }));
                  }
                }}
                className={inputClass('email')}
              />
              <FieldError field="email" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
              <input
                id="biz-phone"
                type="tel"
                required
                placeholder="e.g. 9876543210 (10 digits)"
                value={phone}
                maxLength={10}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) {
                    const c = validatePhone(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, phone: c.valid ? undefined : c.message }));
                  }
                }}
                className={inputClass('phone')}
              />
              <FieldError field="phone" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Account Password</label>
            <input
              id="biz-password"
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: e.target.value.length >= 8 ? undefined : 'Password must be at least 8 characters.' }));
                }
              }}
              className={inputClass('password')}
            />
            <FieldError field="password" />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Confirm Password</label>
            <input
              id="biz-confirm-password"
              type="password"
              required
              minLength={8}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: e.target.value === password ? undefined : 'Passwords do not match.' }));
                }
              }}
              className={inputClass('confirmPassword')}
            />
            <FieldError field="confirmPassword" />
          </div>

          <button
            type="submit"
            id="biz-submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-bold text-base rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Registering Business...</span>
              </>
            ) : (
              <span>Launch My Business Queue</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center space-y-2">
          <p className="text-xs text-slate-400">
            Already have a business account?{' '}
            <Link to="/login" className="text-emerald-400 font-semibold hover:underline">Sign In</Link>
          </p>
          <div className="pt-2">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← Back to Home</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
