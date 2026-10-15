import React from 'react';
import { Link } from 'react-router-dom';
import LogoMark from './components/LogoMark';

/* ─────────────────────────────────────────────────────────────────────
   Footer Section — Friendly Shewwina Design
   Concise navigation, project info, and contact links
───────────────────────────────────────────────────────────────────── */

export default function FooterSection() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#172033] text-white border-t border-slate-800 pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <LogoMark className="w-8 h-8" iconSize="w-4 h-4" />
              <span className="font-display font-extrabold text-xl text-white group-hover:text-emerald-400 transition-colors">
                Shewwina<span className="text-emerald-500">.</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Shewwina — Smart Waiting Platform. An interactive queue management platform designed to replace physical waiting lines with live digital token tracking for salons, clinics, and everyday service businesses.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-xs font-mono font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                CSE Mini-Project • Live & Ready
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <a href="#home" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#explore-services" className="hover:text-white transition-colors">
                  Explore Services
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <Link to="/demo" className="text-emerald-300 font-semibold hover:underline">
                  ⚡ Try Live Demo / Simulation
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Access */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
              Account & Access
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  User Login
                </Link>
              </li>
              <li>
                <Link to="/register-business" className="hover:text-white transition-colors">
                  Register Business
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Customer Sign Up
                </Link>
              </li>
              <li>
                <Link to="/join/demo" className="hover:text-white transition-colors">
                  Live Queue Check-In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {year} Shewwina. Built for CSE mini-project presentation.</p>
          <div className="flex items-center gap-4">
            <a href="#top" className="hover:text-emerald-400 transition-colors">
              Back to top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
