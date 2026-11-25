import React from 'react';
import { Link } from 'react-router-dom';
import LogoMark from './components/LogoMark';
import { Compass, Building2, Landmark, Stethoscope, Scissors, ArrowUpRight } from 'lucide-react';

export default function FooterSection() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#171717] text-[#FAF8F5] border-t border-[#292524] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-[#292524]">

          {/* Brand Info (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <LogoMark className="w-8 h-8" iconSize="w-4 h-4" />
              <span className="font-display font-bold text-xl text-[#FAF8F5] tracking-tight">
                Shewwina<span className="text-[#C25E38]">.</span>
              </span>
            </Link>
            <p className="text-xs text-[#A8A196] leading-relaxed max-w-sm">
              India's Smart Queue &amp; Customer Flow Platform. Connecting citizens, patients, and customers to physical service establishments with transparent wait times and digital queue passes.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#262626] border border-[#3D372E] text-[#D5CEC2] text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                Operating System for Customer Flow
              </span>
            </div>
          </div>

          {/* Service Verticals */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A8A196] mb-4">
              Service Verticals
            </h4>
            <ul className="space-y-2.5 text-xs text-[#D5CEC2]">
              <li>
                <Link to="/hospitals" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span>Hospital OPDs</span>
                </Link>
              </li>
              <li>
                <Link to="/explore?category=clinic" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-[#2DD4BF]" />
                  <span>Clinics &amp; Wellness</span>
                </Link>
              </li>
              <li>
                <Link to="/explore?category=salon" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-[#FBBF24]" />
                  <span>Salons &amp; Grooming</span>
                </Link>
              </li>
              <li>
                <Link to="/government-services" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-[#F87171]" />
                  <span>Citizen Kendras</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Access */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A8A196] mb-4">
              Platform &amp; Portals
            </h4>
            <ul className="space-y-2.5 text-xs text-[#D5CEC2]">
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Operator Sign In
                </Link>
              </li>
              <li>
                <Link to="/register-business" className="hover:text-white transition-colors">
                  Register Establishment
                </Link>
              </li>
              <li>
                <Link to="/register-hospital" className="hover:text-white transition-colors">
                  Register Hospital
                </Link>
              </li>
              <li>
                <Link to="/register-government-centre" className="hover:text-white transition-colors">
                  Register Seva Kendra
                </Link>
              </li>
              <li>
                <Link to="/demo" className="text-[#E7E3DC] hover:text-white font-medium flex items-center gap-1">
                  <span>Interactive Simulation</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support & Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#A8A196] mb-4">
              Trust &amp; Governance
            </h4>
            <ul className="space-y-2.5 text-xs text-[#D5CEC2]">
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <span className="text-[#78716C] cursor-default">
                  Zero Data Selling Policy
                </span>
              </li>
              <li>
                <span className="text-[#78716C] cursor-default">
                  Verified Identity Standards
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#78716C]">
          <p>© {year} Shewwina Technologies. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="text-[#78716C]">India Customer Flow Network</span>
            <a href="#top" className="text-[#D5CEC2] hover:text-white transition-colors">
              Back to top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
