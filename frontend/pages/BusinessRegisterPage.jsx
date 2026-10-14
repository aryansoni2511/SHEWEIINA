import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateName, validateBusinessName, validatePhone } from '../utils/validation';
import LogoMark from '../components/LogoMark';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export default function BusinessRegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('salon');
  const [city, setCity] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-emerald-600 selection:text-white">
      {/* Ambient background lighting */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(16,185,129,0.08),rgba(255,255,255,0))] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_110%,rgba(5,150,105,0.05),rgba(255,255,255,0))] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl p-1 group transition-transform"
            aria-label="Shewwina Home"
          >
            <LogoMark className="w-11 h-11" variant="emerald" iconSize="w-5 h-5" />
            <span className="font-display font-bold text-2xl tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
              Shewwina
            </span>
          </Link>
          <div className="mt-4 flex justify-center">
            <Badge variant="emerald" dot size="sm">
              Business Portal
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
            Register Your Business
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Set up real-time digital queues, customer tokens, and live TV displays
          </p>
        </div>

        {/* Card Container */}
        <Card className="p-6 sm:p-8 bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 rounded-3xl">
          {/* Global error banner */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start justify-between gap-3 animate-fadeIn"
            >
              <div className="flex items-start gap-2.5">
                <svg
                  className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                aria-label="Dismiss error"
                className="text-rose-400 hover:text-rose-600 p-0.5 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Section 1: Business Identity */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Business Information
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Business Name"
                  id="biz-business-name"
                  type="text"
                  required
                  placeholder="e.g. Royal Unisex Salon"
                  value={businessName}
                  error={fieldErrors.businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    if (fieldErrors.businessName) {
                      const c = validateBusinessName(e.target.value);
                      setFieldErrors((prev) => ({
                        ...prev,
                        businessName: c.valid ? undefined : c.message,
                      }));
                    }
                  }}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                />

                <Select
                  label="Business Category"
                  id="biz-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="salon">Salon &amp; Spa</option>
                  <option value="clinic">Clinic &amp; Healthcare</option>
                  <option value="barber">Barbershop</option>
                  <option value="other">Other Service</option>
                </Select>

                <Input
                  label="City"
                  id="biz-city"
                  type="text"
                  required
                  placeholder="e.g. Mumbai"
                  value={city}
                  error={fieldErrors.city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (fieldErrors.city) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        city: e.target.value.trim().length >= 2 ? undefined : 'City is required.',
                      }));
                    }
                  }}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                />

                <Input
                  label="Owner / Manager Name"
                  id="biz-owner-name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="e.g. Vikram Malhotra"
                  value={name}
                  error={fieldErrors.name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) {
                      const c = validateName(e.target.value);
                      setFieldErrors((prev) => ({
                        ...prev,
                        name: c.valid ? undefined : c.message,
                      }));
                    }
                  }}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />
              </div>
            </div>

            {/* Section 2: Contact Details */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3 mt-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Contact Information
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  id="biz-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="contact@royalsalon.com"
                  value={email}
                  error={fieldErrors.email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        email: e.target.value.trim() ? undefined : 'Email is required.',
                      }));
                    }
                  }}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />

                <Input
                  label="Phone Number"
                  id="biz-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="e.g. 9876543210 (10 digits)"
                  helperText="10-digit Indian mobile number"
                  value={phone}
                  maxLength={10}
                  error={fieldErrors.phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (fieldErrors.phone) {
                      const c = validatePhone(e.target.value);
                      setFieldErrors((prev) => ({
                        ...prev,
                        phone: c.valid ? undefined : c.message,
                      }));
                    }
                  }}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  }
                />
              </div>
            </div>

            {/* Section 3: Credentials */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3 mt-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Security
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Account Password"
                  id="biz-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  error={fieldErrors.password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        password: e.target.value.length >= 8 ? undefined : 'Password must be at least 8 characters.',
                      }));
                    }
                  }}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none focus:text-emerald-600 p-1 rounded-lg transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  }
                />

                <Input
                  label="Confirm Password"
                  id="biz-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  error={fieldErrors.confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value === password ? undefined : 'Passwords do not match.',
                      }));
                    }
                  }}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  }
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none focus:text-emerald-600 p-1 rounded-lg transition-colors"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  }
                />
              </div>
            </div>

            {/* Launch Business Queue CTA */}
            <Button
              type="submit"
              id="biz-submit"
              variant="emerald"
              size="lg"
              loading={loading}
              disabled={loading}
              className="w-full mt-6 font-bold shadow-md shadow-emerald-600/20"
            >
              Launch My Business Queue
            </Button>
          </form>

          {/* Switcher links */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Already registered as a business?</span>
              <Link
                to="/login"
                className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Sign In →
              </Link>
            </div>

            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-indigo-950 font-medium">Looking for a customer account?</span>
              <Link
                to="/register"
                className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Customer Sign Up →
              </Link>
            </div>
          </div>
        </Card>

        {/* Back navigation & Security note */}
        <div className="mt-6 text-center space-y-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Shewwina Home
          </Link>
          <p className="text-[11px] text-slate-400">
            Real-time digital queues · QR code check-in · Live public status boards
          </p>
        </div>
      </div>
    </div>
  );
}
