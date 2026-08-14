import React from 'react';

// Import All Individual Modular Landing Page Section Components
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

/**
 * Shewwina Production-Ready Master Landing Page Component
 * 
 * Combines all 12 modular sections into a single, cohesive, highly-optimized React application.
 * 
 * Features:
 * - 100% Responsive & Mobile-First layout
 * - Unified Tailwind CSS Design System (Apple + Stripe + Linear caliber)
 * - Accessible ARIA attributes & semantic HTML tags
 * - Smooth scroll anchor navigation
 */
export default function App() {
  return (
    <div id="top" className="bg-white text-slate-900 font-sans antialiased min-h-screen relative selection:bg-blue-600 selection:text-white">
      
      {/* 1. Sticky Navigation Header */}
      <Navbar />

      {/* Main Content Flow */}
      <main id="main-content">
        {/* 2. Hero Showcase */}
        <Hero />

        {/* 3. Problem We Solve */}
        <ProblemSection />

        {/* 4. How Shewwina Solves It (Solutions) */}
        <SolutionSection />

        {/* 5. Enterprise Feature Suite */}
        <FeaturesSection />

        {/* 6. Timeline (How Shewwina Works) */}
        <TimelineSection />

        {/* 7. Industries We Serve */}
        <IndustriesSection />

        {/* 8. Impact Statistics with Animated Counters */}
        <StatsSection />

        {/* 9. Testimonials & Reviews */}
        <TestimonialsSection />

        {/* 10. Frequently Asked Questions Accordion */}
        <FAQSection />

        {/* 11. High-Impact Call To Action Banner */}
        <CTASection />
      </main>

      {/* 12. Startup Footer */}
      <FooterSection />

    </div>
  );
}
