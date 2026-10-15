import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import LogoMark from '../components/LogoMark';

/**
 * Initial 5 clearly labeled demo customers
 */
const INITIAL_DEMO_CUSTOMERS = [
  { id: 'D-101', name: 'Rahul Sharma', service: 'Haircut & Styling', status: 'SERVING', joinedAt: '10:00 AM' },
  { id: 'D-102', name: 'Priya Mehta', service: 'General Consultation', status: 'WAITING', joinedAt: '10:05 AM' },
  { id: 'D-103', name: 'Amit Kumar', service: 'Beard Grooming', status: 'WAITING', joinedAt: '10:10 AM' },
  { id: 'D-104', name: 'Sneha Patel', service: 'Health Checkup', status: 'WAITING', joinedAt: '10:14 AM' },
  { id: 'D-105', name: 'Vikram Rao', service: 'Device Diagnosis', status: 'WAITING', joinedAt: '10:18 AM' },
];

export default function QueueSimulationPage() {
  const [customers, setCustomers] = useState(INITIAL_DEMO_CUSTOMERS);
  const [nextTokenNum, setNextTokenNum] = useState(106);
  const [avgServiceDuration, setAvgServiceDuration] = useState(5); // 5 mins per customer
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [simSecondsRemaining, setSimSecondsRemaining] = useState(15);
  const [feedbackMessage, setFeedbackMessage] = useState('Simulation initialized with 5 sample customers.');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Add Customer Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerService, setNewCustomerService] = useState('Haircut & Styling');

  const timerRef = useRef(null);

  // Derived state
  const currentServing = customers.find((c) => c.status === 'SERVING');
  const waitingCustomers = customers.filter((c) => c.status === 'WAITING');
  const servedCustomers = customers.filter((c) => c.status === 'SERVED');
  const totalWaitingCount = waitingCustomers.length;

  // Estimated wait calculation: waitingCount * avgDuration (explained as an estimate)
  const estimatedWaitMinutes = totalWaitingCount * avgServiceDuration;

  // Auto-simulation progression timer
  useEffect(() => {
    if (isAutoSimulating) {
      timerRef.current = setInterval(() => {
        setSimSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleAutoStep();
            return 15; // Reset step countdown
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAutoSimulating, customers]);

  // Automated step: if currently serving, mark served; else call next
  const handleAutoStep = () => {
    setCustomers((prevCustomers) => {
      const activeServing = prevCustomers.find((c) => c.status === 'SERVING');
      const nextWaiting = prevCustomers.find((c) => c.status === 'WAITING');

      if (activeServing) {
        // Complete current customer
        setFeedbackMessage(`[Auto-Sim] Completed service for token #${activeServing.id} (${activeServing.name}).`);
        return prevCustomers.map((c) => (c.id === activeServing.id ? { ...c, status: 'SERVED' } : c));
      } else if (nextWaiting) {
        // Call next customer
        setFeedbackMessage(`[Auto-Sim] Called token #${nextWaiting.id} (${nextWaiting.name}) to Counter.`);
        return prevCustomers.map((c) => (c.id === nextWaiting.id ? { ...c, status: 'SERVING' } : c));
      } else {
        setIsAutoSimulating(false);
        setFeedbackMessage('Queue is now clear! All demo customers have been served.');
        return prevCustomers;
      }
    });
  };

  // Manual Control: Call Next
  const handleCallNext = () => {
    if (waitingCustomers.length === 0) {
      setFeedbackMessage('No waiting customers in the queue to call.');
      return;
    }

    const nextCust = waitingCustomers[0];

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.status === 'SERVING') {
          // Finish previously serving customer
          return { ...c, status: 'SERVED' };
        }
        if (c.id === nextCust.id) {
          return { ...c, status: 'SERVING' };
        }
        return c;
      })
    );

    setFeedbackMessage(`Called token #${nextCust.id} (${nextCust.name}) to Counter.`);
  };

  // Manual Control: Mark Served
  const handleMarkServed = () => {
    if (!currentServing) {
      setFeedbackMessage('No customer is currently being served.');
      return;
    }

    setCustomers((prev) =>
      prev.map((c) => (c.id === currentServing.id ? { ...c, status: 'SERVED' } : c))
    );

    setFeedbackMessage(`Token #${currentServing.id} (${currentServing.name}) marked as Served.`);
  };

  // Add Customer Form Submit
  const handleAddCustomer = (e) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    const newTokId = `D-${nextTokenNum}`;
    const newEntry = {
      id: newTokId,
      name: newCustomerName.trim(),
      service: newCustomerService,
      status: 'WAITING',
      joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setCustomers((prev) => [...prev, newEntry]);
    setNextTokenNum((n) => n + 1);
    setNewCustomerName('');
    setShowAddModal(false);
    setFeedbackMessage(`Added new demo customer ${newEntry.name} with Token #${newTokId}.`);
  };

  // Reset Demo State
  const handleResetDemo = () => {
    setIsAutoSimulating(false);
    setCustomers(INITIAL_DEMO_CUSTOMERS);
    setNextTokenNum(106);
    setSimSecondsRemaining(15);
    setFeedbackMessage('Reset simulation to initial 5 sample customers.');
  };

  const filteredCustomers = customers.filter((c) => {
    if (filterStatus === 'WAITING') return c.status === 'WAITING';
    if (filterStatus === 'SERVING') return c.status === 'SERVING';
    if (filterStatus === 'SERVED') return c.status === 'SERVED';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#172033] flex flex-col selection:bg-[#22C55E] selection:text-white">
      {/* ── Top Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-emerald-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2" aria-label="Back to Shewwina Home">
              <LogoMark className="w-8 h-8" iconSize="w-4 h-4" />
              <span className="font-display font-extrabold text-lg text-[#172033]">
                Shewwina<span className="text-emerald-600">.</span>
              </span>
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
              ⚡ Queue Playground
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs font-semibold text-slate-600 hover:text-emerald-800 transition-colors hidden sm:inline-block"
            >
              ← Back to Main Website
            </Link>
            <Link
              to="/join/demo"
              className="text-xs font-bold px-3 py-1.5 rounded-full text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              Test Live Join Flow
            </Link>
          </div>
        </div>
      </header>

      {/* ── Prominent Demo Mode Banner ─────────────────────────────── */}
      <div className="bg-emerald-800 text-white px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold">
              “You're in Demo Mode — Explore how a queue works with sample customers.”
            </span>
          </div>
          <div className="text-[11px] font-mono bg-emerald-900/80 text-emerald-200 px-3 py-1 rounded-full border border-emerald-700">
            Isolated In-Memory State • Zero Database Mutations
          </div>
        </div>
      </div>

      {/* ── Main Playground Workspace ──────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Title & Context */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-[#172033] tracking-tight">
              Interactive Queue Simulation
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              Use the manual or automated controls below to test token progression, serving logic, and wait time estimates.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs text-xs">
            <span className="text-slate-500 font-medium">Service Duration:</span>
            <select
              value={avgServiceDuration}
              onChange={(e) => setAvgServiceDuration(Number(e.target.value))}
              className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
            >
              <option value={3}>3 min / customer</option>
              <option value={5}>5 min / customer (Default)</option>
              <option value={10}>10 min / customer</option>
              <option value={15}>15 min / customer</option>
            </select>
          </div>
        </div>

        {/* ── Live Feedback Alert ─────────────────────────────── */}
        {feedbackMessage && (
          <div className="mb-6 p-3.5 rounded-2xl bg-white border border-emerald-200 shadow-xs flex items-center justify-between text-xs text-slate-700 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">ℹ️</span>
              <span>{feedbackMessage}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage('')}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Demo Dashboard KPI Cards ───────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Currently Serving Token */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
              <span>Currently Serving</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-800 mt-1">
              {currentServing ? `#${currentServing.id}` : 'None'}
            </div>
            <div className="text-xs text-slate-600 mt-1.5 truncate">
              {currentServing ? (
                <>
                  <strong className="text-slate-900">{currentServing.name}</strong> • {currentServing.service}
                </>
              ) : (
                'Counter is idle. Call next customer.'
              )}
            </div>
          </div>

          {/* Card 2: Customers Waiting */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
              <span>Waiting Customers</span>
              <span className="text-amber-600 font-bold">⏳</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-1">
              {totalWaitingCount}
            </div>
            <div className="text-xs text-slate-500 mt-1.5">
              {totalWaitingCount === 0 ? 'Queue is clear' : `${totalWaitingCount} people in virtual line`}
            </div>
          </div>

          {/* Card 3: Estimated Waiting Time */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
              <span>Estimated Wait Time</span>
              <span className="text-emerald-700 font-bold">⏱️</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-800 mt-1">
              ~{estimatedWaitMinutes} <span className="text-sm font-semibold text-slate-500 font-sans">min</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5">
              Calculated: {totalWaitingCount} waiting × {avgServiceDuration}m duration
            </div>
          </div>

          {/* Card 4: Total Served Today */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
              <span>Customers Served</span>
              <span className="text-emerald-600 font-bold">✓</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-slate-700 mt-1">
              {servedCustomers.length}
            </div>
            <div className="text-xs text-slate-500 mt-1.5">
              Completed demo interactions
            </div>
          </div>
        </div>

        {/* ── Simulation Control Panel ───────────────────────── */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#172033] flex items-center gap-2">
                <span>Simulation Controls</span>
                {isAutoSimulating && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full animate-pulse">
                    Auto-Run: Next action in {simSecondsRemaining}s
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Execute queue operations manually or trigger continuous progression.
              </p>
            </div>

            {/* Control Button Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Call Next Button */}
              <button
                type="button"
                onClick={handleCallNext}
                disabled={waitingCustomers.length === 0}
                className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>📢 Call Next</span>
                {waitingCustomers.length > 0 && (
                  <span className="bg-emerald-950/60 px-1.5 py-0.5 rounded text-[10px]">
                    #{waitingCustomers[0].id}
                  </span>
                )}
              </button>

              {/* Mark Served Button */}
              <button
                type="button"
                onClick={handleMarkServed}
                disabled={!currentServing}
                className="px-4 py-2.5 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all flex items-center gap-1.5"
              >
                <span>✓ Mark Served</span>
              </button>

              {/* Add Demo Customer Button */}
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1"
              >
                <span>+ Add Customer</span>
              </button>

              {/* Auto Run / Pause Toggle */}
              {isAutoSimulating ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsAutoSimulating(false);
                    setFeedbackMessage('Auto-simulation paused.');
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <span>⏸ Pause</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsAutoSimulating(true);
                    setFeedbackMessage('Auto-simulation started. Customers will advance automatically every 15s.');
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:border-emerald-400 hover:text-emerald-800 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <span>▶ Start Simulation</span>
                </button>
              )}

              {/* Reset Demo Button */}
              <button
                type="button"
                onClick={handleResetDemo}
                title="Restore initial 5 customers state"
                className="px-3.5 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
              >
                ↺ Reset Demo
              </button>
            </div>
          </div>
        </div>

        {/* ── Ordered List of Demo Customers ─────────────────── */}
        <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          {/* Header & Filter Tabs */}
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#172033]">
                Customer Queue Registry ({customers.length} total)
              </h3>
              <p className="text-xs text-slate-500">
                Ordered queue progression list showing token statuses and services.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filterStatus === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({customers.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('SERVING')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filterStatus === 'SERVING' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Serving ({currentServing ? 1 : 0})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('WAITING')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filterStatus === 'WAITING' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Waiting ({waitingCustomers.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('SERVED')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filterStatus === 'SERVED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Served ({servedCustomers.length})
              </button>
            </div>
          </div>

          {/* Table / List View */}
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-3xl mb-2">🎉</div>
              <h4 className="text-sm font-bold text-slate-800">No customers found in this category</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {filterStatus === 'WAITING'
                  ? 'There are currently no customers waiting in line. Add a new customer to test the queue!'
                  : 'Adjust your status filter or use the controls above.'}
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl"
              >
                + Add Demo Customer
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredCustomers.map((cust, idx) => {
                const isServingCust = cust.status === 'SERVING';
                const isWaitingCust = cust.status === 'WAITING';
                const isServedCust = cust.status === 'SERVED';

                // Find position in waiting line
                const waitIndex = waitingCustomers.findIndex((w) => w.id === cust.id);
                const peopleAhead = waitIndex >= 0 ? waitIndex : 0;
                const custEstWait = isWaitingCust ? (peopleAhead + 1) * avgServiceDuration : 0;

                return (
                  <div
                    key={cust.id}
                    className={`p-4 sm:px-6 flex items-center justify-between gap-4 transition-colors ${
                      isServingCust ? 'bg-emerald-50/50' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Token Badge */}
                      <div
                        className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          isServingCust
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : isWaitingCust
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span className="text-[9px] uppercase tracking-wider opacity-70">Pass</span>
                        <span>{cust.id}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#172033] truncate">
                            {cust.name}
                          </span>
                          {isServingCust && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              IN SESSION
                            </span>
                          )}
                          {isWaitingCust && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              #{waitIndex + 1} in line
                            </span>
                          )}
                          {isServedCust && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                              ✓ Completed
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-[#64748B] mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>{cust.service}</span>
                          <span>•</span>
                          <span>Joined {cust.joinedAt}</span>
                          {isWaitingCust && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-semibold">
                                Est. wait: ~{custEstWait}m ({peopleAhead} ahead)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Row Action */}
                    <div className="shrink-0 flex items-center gap-2">
                      {isWaitingCust && waitIndex === 0 && (
                        <button
                          type="button"
                          onClick={handleCallNext}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs transition-colors"
                        >
                          Call Now
                        </button>
                      )}
                      {isServingCust && (
                        <button
                          type="button"
                          onClick={handleMarkServed}
                          className="px-3 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors"
                        >
                          Mark Served
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── College Presentation Guide Note ─────────────────── */}
        <div className="mt-8 p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <span>📘 How to Explain This Simulation to Your Teacher</span>
            </h4>
            <p className="text-xs text-[#64748B] mt-1 max-w-2xl leading-relaxed">
              This interactive playground isolates the queue state machine: tokens transition strictly from
              <code className="text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded font-mono mx-1">WAITING</code> →
              <code className="text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded font-mono mx-1">SERVING</code> →
              <code className="text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded font-mono mx-1">SERVED</code>.
              Wait times are estimated based on active queue length multiplied by average duration.
            </p>
          </div>
          <a
            href="#faq"
            onClick={(e) => {
              e.preventDefault();
              alert(
                'Presentation Tip for Teacher:\n1. Click "Call Next" to show how D-102 (Priya) is called.\n2. Click "Mark Served" to show transition to completed.\n3. Add a new customer to show sequential token generation.\n4. Show that Live database tokens are completely isolated.'
              );
            }}
            className="px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl shrink-0 transition-colors"
          >
            Show Teacher Script
          </a>
        </div>
      </main>

      {/* ── Add Demo Customer Modal ──────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-[#172033]">
                Add Demo Customer
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ananya Roy"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Requested Service
                </label>
                <select
                  value={newCustomerService}
                  onChange={(e) => setNewCustomerService(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Haircut & Styling">Haircut & Styling (Salon)</option>
                  <option value="Beard Grooming">Beard Grooming (Salon)</option>
                  <option value="General Consultation">General Consultation (Clinic)</option>
                  <option value="Health Checkup">Health Checkup (Clinic)</option>
                  <option value="Table Waitlist">Table Waitlist (Dining)</option>
                  <option value="Device Diagnosis">Device Diagnosis (Service Center)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-xs"
                >
                  Add to Demo Queue (Token #D-{nextTokenNum})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
