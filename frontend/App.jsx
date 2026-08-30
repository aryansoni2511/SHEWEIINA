import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Landing Page Modular Components
import Navbar from './Navbar';
import Hero from './Hero';
import ProblemSection from './ProblemSection';
import SolutionSection from './SolutionSection';
import FeaturesSection from './FeaturesSection';
import TimelineSection from './TimelineSection';
import IndustriesSection from './IndustriesSection';
import StatsSection from './StatsSection';
import TestimonialsSection from './TestimonialsSection';
import FAQSection from './FAQSection';
import CTASection from './CTASection';
import FooterSection from './FooterSection';

// Application Route Pages
import CustomerQueuePage from './pages/CustomerQueuePage';
import TokenStatusPage from './pages/TokenStatusPage';
import BusinessDashboardPage from './pages/BusinessDashboardPage';
import CustomerDashboardPage from './pages/CustomerDashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BusinessRegisterPage from './pages/BusinessRegisterPage';

/**
 * Protected Route Wrapper for Authenticated Business Access
 */
function ProtectedBusinessRoute({ children }) {
  const { isAuthenticated, isBusiness, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-400">Verifying Business Credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isBusiness) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * Protected Route Wrapper for Authenticated Customer Access
 */
function ProtectedCustomerRoute({ children }) {
  const { isAuthenticated, isCustomer, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-400">Verifying Customer Account...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isCustomer) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * Landing Page Assembly Component
 */
function LandingPage() {
  return (
    <div id="top" className="bg-white text-slate-900 font-sans antialiased min-h-screen relative selection:bg-blue-600 selection:text-white">
      <Navbar />
      <main id="main-content">
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <FeaturesSection />
        <TimelineSection />
        <IndustriesSection />
        <StatsSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <FooterSection />
    </div>
  );
}

/**
 * Main Application Component with React Router Navigation & AuthProvider
 */
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-business" element={<BusinessRegisterPage />} />
        <Route path="/join/:businessId" element={<CustomerQueuePage />} />
        <Route path="/token/:tokenId" element={<TokenStatusPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedBusinessRoute>
              <BusinessDashboardPage />
            </ProtectedBusinessRoute>
          }
        />
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedCustomerRoute>
              <CustomerDashboardPage />
            </ProtectedCustomerRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
