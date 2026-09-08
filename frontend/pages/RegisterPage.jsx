import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateName, validatePhone } from '../utils/validation';
import LogoMark from '../components/LogoMark';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Field-level validation errors shown inline
  const [fieldErrors, setFieldErrors] = useState({});

  const { registerCustomer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || (typeof location.state?.from === 'string' ? location.state.from : null) || '/customer/dashboard';

  /**
   * Run all field validations and return true if all pass.
   * Also sets field-level error messages for inline display.
   */
  function validateAll() {
    const errors = {};

    const nameCheck = validateName(name);
    if (!nameCheck.valid) errors.name = nameCheck.message;

    if (!email || email.trim() === '') {
      errors.email = 'Email is required.';
    }

    const phoneCheck = validatePhone(phone);
    if (!phoneCheck.valid) errors.phone = phoneCheck.message;

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
      await registerCustomer({ name: name.trim(), email, phone, password, confirmPassword });
      navigate(from);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  // Inline error component
  const FieldError = ({ field }) =>
    fieldErrors[field] ? (
      <p className="mt-1.5 text-xs text-rose-400 font-medium">{fieldErrors[field]}</p>
    ) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 selection:bg-blue-600 selection:text-white">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">

        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <LogoMark className="w-12 h-12" variant="blue" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Customer Account</h1>
          <p className="text-xs text-slate-400 mt-1">Skip waiting lines with digital tokens</p>
        </div>

        {/* Global error banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center justify-between">
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} className="text-rose-400 font-bold ml-2">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
            <input
              id="reg-name"
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) {
                  const check = validateName(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, name: check.valid ? undefined : check.message }));
                }
              }}
              className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 transition-all ${
                fieldErrors.name ? 'border-rose-600 focus:ring-rose-500' : 'border-slate-800 focus:ring-blue-500'
              }`}
            />
            <FieldError field="name" />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <input
              id="reg-email"
              type="email"
              required
              placeholder="rahul@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: e.target.value.trim() ? undefined : 'Email is required.' }));
                }
              }}
              className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 transition-all ${
                fieldErrors.email ? 'border-rose-600 focus:ring-rose-500' : 'border-slate-800 focus:ring-blue-500'
              }`}
            />
            <FieldError field="email" />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
            <input
              id="reg-phone"
              type="tel"
              required
              placeholder="e.g. 9876543210 (10 digits, no +91)"
              value={phone}
              maxLength={10}
              onChange={(e) => {
                setPhone(e.target.value);
                if (fieldErrors.phone) {
                  const check = validatePhone(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, phone: check.valid ? undefined : check.message }));
                }
              }}
              className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 transition-all ${
                fieldErrors.phone ? 'border-rose-600 focus:ring-rose-500' : 'border-slate-800 focus:ring-blue-500'
              }`}
            />
            <FieldError field="phone" />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <input
              id="reg-password"
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
              className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 transition-all ${
                fieldErrors.password ? 'border-rose-600 focus:ring-rose-500' : 'border-slate-800 focus:ring-blue-500'
              }`}
            />
            <FieldError field="password" />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Confirm Password</label>
            <input
              id="reg-confirm-password"
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
              className={`w-full px-4 py-3 bg-slate-950 border rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 transition-all ${
                fieldErrors.confirmPassword ? 'border-rose-600 focus:ring-rose-500' : 'border-slate-800 focus:ring-blue-500'
              }`}
            />
            <FieldError field="confirmPassword" />
          </div>

          <button
            type="submit"
            id="reg-submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold text-base rounded-2xl shadow-xl shadow-blue-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Customer Account</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center space-y-2">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 font-semibold hover:underline">Sign In</Link>
          </p>
          <p className="text-xs text-slate-400">
            Register as a Business?{' '}
            <Link to="/register-business" className="text-emerald-400 font-semibold hover:underline">Business Sign Up</Link>
          </p>
          <div className="pt-2">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← Back to Home</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
