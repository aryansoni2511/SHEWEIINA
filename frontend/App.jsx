import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Landing Page Modular Components
import Navbar from './Navbar';
import Hero from './Hero';
import HowItWorksSection from './HowItWorksSection';
import ExploreServicesSection from './ExploreServicesSection';
import FriendlyTrustSection from './FriendlyTrustSection';
import FAQSection from './FAQSection';
import CTASection from './CTASection';
import FooterSection from './FooterSection';

// Application Route Pages
import CustomerQueuePage from './pages/CustomerQueuePage';
import TokenStatusPage from './pages/TokenStatusPage';
import BusinessDashboardPage from './pages/BusinessDashboardPage';
import CustomerDashboardPage from './pages/CustomerDashboardPage';
import QueueSimulationPage from './pages/QueueSimulationPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BusinessRegisterPage from './pages/BusinessRegisterPage';
import PublicDisplayPage from './pages/PublicDisplayPage';
import ExplorePage from './pages/ExplorePage';
// Hospital Module Route Pages
import HospitalDiscoveryPage from './pages/HospitalDiscoveryPage';
import HospitalRegisterPage from './pages/HospitalRegisterPage';
import HospitalDetailsPage from './pages/HospitalDetailsPage';
import HospitalTokenPage from './pages/HospitalTokenPage';
import HospitalDashboardPage from './pages/HospitalDashboardPage';
// Government & Citizen Services Route Pages
import GovernmentDiscoveryPage from './pages/GovernmentDiscoveryPage';
import GovernmentServiceDetailsPage from './pages/GovernmentServiceDetailsPage';
import GovernmentTokenPage from './pages/GovernmentTokenPage';
import GovernmentRegisterCentrePage from './pages/GovernmentRegisterCentrePage';
import GovernmentDashboardPage from './pages/GovernmentDashboardPage';
import MobileBottomNav from './components/navigation/MobileBottomNav';


/**
 * Protected Route Wrapper for Authenticated Business Access
 */
function ProtectedBusinessRoute({ children }) {
  const { isAuthenticated, isBusiness, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
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
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
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
  const [heroFilter, setHeroFilter] = React.useState({});

  return (
    <div id="top" className="bg-[#FAF8F5] text-[#171717] font-sans antialiased min-h-screen relative selection:bg-[#171717] selection:text-white">
      <Navbar />
      <main id="main-content">
        <Hero onSearchSubmit={(filter) => setHeroFilter(filter)} />
        <HowItWorksSection />
        <ExploreServicesSection initialFilter={heroFilter} />
        <FriendlyTrustSection />
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
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/demo" element={<QueueSimulationPage />} />
        <Route path="/simulation" element={<QueueSimulationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-business" element={<BusinessRegisterPage />} />
        <Route path="/join/:businessId" element={<CustomerQueuePage />} />
        <Route path="/display/:businessId" element={<PublicDisplayPage />} />
        <Route path="/live/:businessId" element={<PublicDisplayPage />} />
        <Route path="/token/:tokenId" element={<TokenStatusPage />} />
        {/* Hospital Management & OPD Queue Routes */}
        <Route path="/hospitals" element={<HospitalDiscoveryPage />} />
        <Route path="/register-hospital" element={<HospitalRegisterPage />} />
        <Route path="/hospital/:hospitalId" element={<HospitalDetailsPage />} />
        <Route path="/hospital/token/:tokenId" element={<HospitalTokenPage />} />
        <Route
          path="/hospital/dashboard"
          element={
            <ProtectedBusinessRoute>
              <HospitalDashboardPage />
            </ProtectedBusinessRoute>
          }
        />

        {/* Government & Citizen Services Queue Routes */}
        <Route path="/government-services" element={<GovernmentDiscoveryPage />} />
        <Route path="/government-services/service/:slug" element={<GovernmentServiceDetailsPage />} />
        <Route path="/government/token/:tokenId" element={<GovernmentTokenPage />} />
        <Route path="/register-government-centre" element={<GovernmentRegisterCentrePage />} />
        <Route
          path="/government/dashboard"
          element={
            <ProtectedBusinessRoute>
              <GovernmentDashboardPage />
            </ProtectedBusinessRoute>
          }
        />

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
      <MobileBottomNav />
    </AuthProvider>
  );
}
