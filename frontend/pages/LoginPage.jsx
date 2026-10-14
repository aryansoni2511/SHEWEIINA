import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoMark from '../components/LogoMark';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || (typeof location.state?.from === 'string' ? location.state.from : null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      const user = res.data.user;
      if (user.role === 'BUSINESS') {
        navigate(from && from !== '/' && !from.startsWith('/customer') ? from : '/dashboard');
      } else {
        navigate(from && from !== '/dashboard' ? from : '/customer/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-indigo-600 selection:text-white">
      {/* Background ambient lighting */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(79,70,229,0.08),rgba(255,255,255,0))] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_110%,rgba(99,102,241,0.05),rgba(255,255,255,0))] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl p-1 group transition-transform"
            aria-label="Shewwina Home"
          >
            <LogoMark className="w-11 h-11" variant="blue" iconSize="w-5 h-5" />
            <span className="font-display font-bold text-2xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
              Shewwina
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-4">
            Sign in to Shewwina
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Access your queues, appointments, and live service status
          </p>
        </div>

        {/* Card Container */}
        <Card className="p-6 sm:p-8 bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 rounded-3xl">
          {/* Error Banner */}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              id="login-email"
              type="email"
              required
              autoComplete="email"
              placeholder="owner@shewwina.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
            />

            <Input
              label="Password"
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                  className="text-slate-400 hover:text-slate-600 focus:outline-none focus:text-indigo-600 p-1 rounded-lg transition-colors"
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

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              className="w-full mt-2 font-semibold shadow-md shadow-indigo-600/20"
            >
              Sign In
            </Button>
          </form>

          {/* Account Creation Switchers */}
          <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">New customer?</span>
              <Link
                to="/register"
                className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Create Account →
              </Link>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-emerald-950 font-medium">Salon, Clinic or Studio?</span>
              <Link
                to="/register-business"
                className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Register Business →
              </Link>
            </div>
          </div>
        </Card>

        {/* Back navigation & Trust */}
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
            Protected by SSL encryption · Real-time digital queue management
          </p>
        </div>
      </div>
    </div>
  );
}
