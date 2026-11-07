import React, { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import Button from './ui/Button';
import { Badge } from './ui/Badge';
import Input from './ui/Input';
import Select from './ui/Select';
import Modal from './ui/Modal';
import StatCard from './ui/StatCard';
import EmptyState from './ui/EmptyState';

const INITIAL_CLINICS = [
  {
    id: 'clinic-1',
    name: 'Metro Heart & Cardiology Center',
    department: 'Cardiology',
    doctorName: 'Dr. Ananya Roy, MD (Cardio)',
    phone: '9820123456',
    operatingHours: '09:00 AM - 01:00 PM',
    room: 'OPD Room 102, 1st Floor',
    status: 'OPEN',
    patientsInQueue: 4,
    avgWaitMin: 18,
  },
  {
    id: 'clinic-2',
    name: 'Apex Skin & Aesthetics Clinic',
    department: 'Dermatology',
    doctorName: 'Dr. Rajesh Gupta, MBBS, DDVL',
    phone: '9820234567',
    operatingHours: '10:00 AM - 02:00 PM',
    room: 'OPD Room 204, 2nd Floor',
    status: 'OPEN',
    patientsInQueue: 2,
    avgWaitMin: 12,
  },
  {
    id: 'clinic-3',
    name: 'CareWell Pediatric Clinic',
    department: 'Pediatrics',
    doctorName: 'Dr. Priya Nair, MD (Pediatrics)',
    phone: '9820345678',
    operatingHours: '04:00 PM - 08:00 PM',
    room: 'OPD Room 108, Ground Floor',
    status: 'CLOSED',
    patientsInQueue: 0,
    avgWaitMin: 15,
  },
  {
    id: 'clinic-4',
    name: 'LifeLine Orthopedic & Joint Care',
    department: 'Orthopedics',
    doctorName: 'Dr. Vikram Deshmukh, MS (Ortho)',
    phone: '9820456789',
    operatingHours: '11:00 AM - 03:00 PM',
    room: 'OPD Room 301, 3rd Floor',
    status: 'OPEN',
    patientsInQueue: 5,
    avgWaitMin: 22,
  },
];

const SPECIALTY_OPTIONS = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Dentistry',
  'ENT',
  'Gynecology & Obstetrics',
  'Neurology',
  'Ophthalmology',
  'Physiotherapy',
];

export default function ClinicsSection() {
  const [clinics, setClinics] = useState(INITIAL_CLINICS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'OPEN' | 'CLOSED'
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' | 'edit'
  const [currentClinicId, setCurrentClinicId] = useState(null);
  const [viewingClinic, setViewingClinic] = useState(null);

  // Form inputs state
  const [formData, setFormData] = useState({
    name: '',
    department: 'General Medicine',
    doctorName: '',
    phone: '',
    operatingHours: '09:00 AM - 01:00 PM',
    room: '',
    status: 'OPEN',
  });
  const [formErrors, setFormErrors] = useState({});

  // Summary statistics
  const stats = useMemo(() => {
    const total = clinics.length;
    const openCount = clinics.filter((c) => c.status === 'OPEN').length;
    const closedCount = clinics.filter((c) => c.status === 'CLOSED').length;
    const totalPatients = clinics.reduce((acc, c) => acc + (c.patientsInQueue || 0), 0);
    return { total, openCount, closedCount, totalPatients };
  }, [clinics]);

  // Filtered & Searched Clinics
  const filteredClinics = useMemo(() => {
    return clinics.filter((clinic) => {
      const matchesSearch =
        clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clinic.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clinic.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clinic.phone.includes(searchQuery);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'OPEN' && clinic.status === 'OPEN') ||
        (statusFilter === 'CLOSED' && clinic.status === 'CLOSED');

      return matchesSearch && matchesStatus;
    });
  }, [clinics, searchQuery, statusFilter]);

  const showNotification = (msg) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Open Add Clinic Modal
  const handleOpenAddModal = () => {
    setFormMode('add');
    setCurrentClinicId(null);
    setFormData({
      name: '',
      department: 'General Medicine',
      doctorName: '',
      phone: '',
      operatingHours: '09:00 AM - 01:00 PM, 05:00 PM - 09:00 PM',
      room: 'OPD Room 101',
      status: 'OPEN',
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Open Edit Clinic Modal
  const handleOpenEditModal = (clinic) => {
    setFormMode('edit');
    setCurrentClinicId(clinic.id);
    setFormData({
      name: clinic.name,
      department: clinic.department,
      doctorName: clinic.doctorName,
      phone: clinic.phone,
      operatingHours: clinic.operatingHours,
      room: clinic.room || '',
      status: clinic.status,
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Clinic name is required (minimum 2 characters).';
    }
    if (!formData.doctorName.trim() || formData.doctorName.trim().length < 2) {
      errors.doctorName = 'Doctor name is required.';
    }
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = 'Valid 10-digit contact number is required.';
    }
    if (!formData.operatingHours.trim()) {
      errors.operatingHours = 'Operating hours are required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Save Form (Add or Edit)
  const handleSaveClinic = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (formMode === 'add') {
      const newClinic = {
        id: `clinic-${Date.now()}`,
        name: formData.name.trim(),
        department: formData.department,
        doctorName: formData.doctorName.trim(),
        phone: formData.phone.trim(),
        operatingHours: formData.operatingHours.trim(),
        room: formData.room.trim() || 'General OPD',
        status: formData.status,
        patientsInQueue: 0,
        avgWaitMin: 15,
      };
      setClinics((prev) => [newClinic, ...prev]);
      showNotification(`Clinic "${newClinic.name}" added successfully.`);
    } else {
      setClinics((prev) =>
        prev.map((c) =>
          c.id === currentClinicId
            ? {
                ...c,
                name: formData.name.trim(),
                department: formData.department,
                doctorName: formData.doctorName.trim(),
                phone: formData.phone.trim(),
                operatingHours: formData.operatingHours.trim(),
                room: formData.room.trim() || 'General OPD',
                status: formData.status,
              }
            : c
        )
      );
      showNotification(`Clinic "${formData.name.trim()}" updated successfully.`);
    }

    setIsFormModalOpen(false);
  };

  // Toggle Queue Status (Open vs Paused)
  const handleToggleQueueStatus = (clinicId) => {
    setClinics((prev) =>
      prev.map((c) => {
        if (c.id === clinicId) {
          const nextStatus = c.status === 'OPEN' ? 'CLOSED' : 'OPEN';
          showNotification(
            `Queue for ${c.name} is now ${nextStatus === 'OPEN' ? 'OPEN' : 'PAUSED'}.`
          );
          return {
            ...c,
            status: nextStatus,
          };
        }
        return c;
      })
    );

    // If viewing in details modal, update viewing reference
    if (viewingClinic && viewingClinic.id === clinicId) {
      setViewingClinic((prev) =>
        prev
          ? {
              ...prev,
              status: prev.status === 'OPEN' ? 'CLOSED' : 'OPEN',
            }
          : null
      );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Demo / Prototype Mode Notice Banner */}
      <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-900">
                Clinics &amp; OPD Module
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/70 text-emerald-900 border border-emerald-300">
                Interactive Demo
              </span>
            </div>
            <p className="text-xs text-emerald-800/90 mt-0.5">
              Manage multi-specialty clinics, assigned doctors, and patient OPD queues. Data is handled in client state for prototype demonstration and is not saved to the production database.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleOpenAddModal}
          className="shrink-0 font-bold shadow-sm"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Clinic
        </Button>
      </div>

      {/* Floating Feedback Notification */}
      {feedbackMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-700 text-white text-xs font-semibold shadow-md flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Summary Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clinics"
          value={String(stats.total)}
          subtitle="Registered OPD units"
          accent="slate"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />

        <StatCard
          title="Queues Open"
          value={String(stats.openCount)}
          subtitle="Currently seeing patients"
          accent="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Queues Paused"
          value={String(stats.closedCount)}
          subtitle="Off duty / Break"
          accent="amber"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Waiting Patients"
          value={String(stats.totalPatients)}
          subtitle="Across all departments"
          accent="indigo"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
      </div>

      {/* Main Clinics Card */}
      <Card className="border border-slate-200/90 shadow-xs overflow-hidden rounded-3xl bg-white p-6">
        {/* Header with Title and Search/Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
                Clinics Management
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {filteredClinics.length} {filteredClinics.length === 1 ? 'Clinic' : 'Clinics'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage clinics, departments, doctors, and patient queues.
            </p>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clinic, doctor, or department..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({clinics.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('OPEN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'OPEN'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Open ({stats.openCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('CLOSED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  statusFilter === 'CLOSED'
                    ? 'bg-white text-amber-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Closed ({stats.closedCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Clinics Table List */}
        {filteredClinics.length === 0 ? (
          <EmptyState
            title="No clinics found"
            description={
              searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or status filter.'
                : 'Get started by adding your first clinic or OPD department.'
            }
            icon={
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            action={
              searchQuery || statusFilter !== 'ALL' ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                  }}
                >
                  Reset Filters
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
                  + Add Clinic
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Clinic &amp; Specialty</th>
                  <th className="py-3 px-3">Doctor Name</th>
                  <th className="py-3 px-3">Contact Number</th>
                  <th className="py-3 px-3">Operating Hours</th>
                  <th className="py-3 px-3">Queue Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredClinics.map((clinic) => {
                  const isOpen = clinic.status === 'OPEN';
                  return (
                    <tr
                      key={clinic.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Clinic Name & Department */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                            isOpen
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            🏥
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-emerald-700 transition-colors">
                              {clinic.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                                {clinic.department}
                              </span>
                              {clinic.room && (
                                <span className="text-[10px] text-slate-400">
                                  • {clinic.room}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Doctor Name */}
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-800 block">
                          {clinic.doctorName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Duty Consultant
                        </span>
                      </td>

                      {/* Contact Number */}
                      <td className="py-3.5 px-3 font-mono text-slate-700">
                        <a
                          href={`tel:${clinic.phone}`}
                          className="hover:text-emerald-700 hover:underline flex items-center gap-1"
                          title="Call Clinic"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{clinic.phone}</span>
                        </a>
                      </td>

                      {/* Operating Hours */}
                      <td className="py-3.5 px-3">
                        <span className="text-slate-700 block">
                          {clinic.operatingHours}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isOpen ? `${clinic.patientsInQueue} in waiting` : 'Queue offline'}
                        </span>
                      </td>

                      {/* Queue Status */}
                      <td className="py-3.5 px-3">
                        {isOpen ? (
                          <Badge variant="emerald" size="sm" dot>
                            Queue Open
                          </Badge>
                        ) : (
                          <Badge variant="amber" size="sm" dot>
                            Queue Paused
                          </Badge>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Queue Status (Open Queue / Pause Queue) */}
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleToggleQueueStatus(clinic.id)}
                            className={`text-xs px-2.5 py-1 ${
                              isOpen
                                ? 'text-amber-800 hover:bg-amber-50 hover:border-amber-300'
                                : 'text-emerald-800 hover:bg-emerald-50 hover:border-emerald-300'
                            }`}
                            title={isOpen ? 'Pause Queue' : 'Open Queue'}
                          >
                            {isOpen ? (
                              <span className="flex items-center gap-1">
                                <span>⏸</span>
                                <span className="hidden sm:inline">Pause Queue</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <span>▶</span>
                                <span className="hidden sm:inline">Open Queue</span>
                              </span>
                            )}
                          </Button>

                          {/* View Details Button */}
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setViewingClinic(clinic)}
                            className="text-xs px-2.5 py-1"
                            title="View Clinic Details"
                          >
                            Details
                          </Button>

                          {/* Edit Clinic Button */}
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenEditModal(clinic)}
                            className="text-xs px-2.5 py-1"
                            title="Edit Clinic Information"
                          >
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ========================================================= */}
      {/* ADD / EDIT CLINIC MODAL                                   */}
      {/* ========================================================= */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={formMode === 'add' ? 'Add New Clinic' : 'Edit Clinic'}
        description="Enter clinic details, assigned physician, and OPD operating hours."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveClinic} className="space-y-4 text-xs">
          <Input
            label="Clinic Name"
            type="text"
            required
            placeholder="e.g. Metro Heart & Cardiology Center"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (formErrors.name) setFormErrors({ ...formErrors, name: null });
            }}
            error={formErrors.name}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Department / Specialty"
              required
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            >
              {SPECIALTY_OPTIONS.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </Select>

            <Input
              label="Assigned Doctor / Consultant"
              type="text"
              required
              placeholder="e.g. Dr. Ananya Roy, MD"
              value={formData.doctorName}
              onChange={(e) => {
                setFormData({ ...formData, doctorName: e.target.value });
                if (formErrors.doctorName) setFormErrors({ ...formErrors, doctorName: null });
              }}
              error={formErrors.doctorName}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Contact Phone"
              type="tel"
              required
              placeholder="e.g. 9820123456"
              value={formData.phone}
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value });
                if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
              }}
              error={formErrors.phone}
            />

            <Input
              label="OPD Room / Cabin (Optional)"
              type="text"
              placeholder="e.g. OPD Room 102, 1st Floor"
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
            />
          </div>

          <Input
            label="Operating Hours"
            type="text"
            required
            placeholder="e.g. 09:00 AM - 01:00 PM, 05:00 PM - 09:00 PM"
            value={formData.operatingHours}
            onChange={(e) => {
              setFormData({ ...formData, operatingHours: e.target.value });
              if (formErrors.operatingHours) setFormErrors({ ...formErrors, operatingHours: null });
            }}
            error={formErrors.operatingHours}
          />

          <Select
            label="Initial Queue Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="OPEN">Queue Open (Accepting Patients)</option>
            <option value="CLOSED">Queue Paused (Offline / Closed)</option>
          </Select>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsFormModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="font-bold">
              {formMode === 'add' ? 'Save & Create Clinic' : 'Update Clinic'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================= */}
      {/* VIEW CLINIC DETAILS MODAL                                 */}
      {/* ========================================================= */}
      {viewingClinic && (
        <Modal
          isOpen={Boolean(viewingClinic)}
          onClose={() => setViewingClinic(null)}
          title={viewingClinic.name}
          description="Complete clinic profile and current OPD queue configuration."
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Department
                </span>
                <span className="font-bold text-sm text-slate-900">
                  {viewingClinic.department}
                </span>
              </div>
              <div>
                {viewingClinic.status === 'OPEN' ? (
                  <Badge variant="emerald" size="sm" dot>
                    Queue Open
                  </Badge>
                ) : (
                  <Badge variant="amber" size="sm" dot>
                    Queue Paused
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-100 bg-white">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                  Physician
                </span>
                <span className="font-bold text-slate-800 block mt-0.5">
                  {viewingClinic.doctorName}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-white">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                  OPD Room
                </span>
                <span className="font-bold text-slate-800 block mt-0.5">
                  {viewingClinic.room || 'General OPD'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-100 bg-white">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                  Contact
                </span>
                <span className="font-mono text-slate-800 block mt-0.5">
                  {viewingClinic.phone}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 bg-white">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                  Operating Hours
                </span>
                <span className="font-medium text-slate-800 block mt-0.5">
                  {viewingClinic.operatingHours}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                  Active Waiting Load
                </span>
                <span className="font-display font-extrabold text-base text-emerald-950">
                  {viewingClinic.patientsInQueue || 0} Patients Waiting
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleToggleQueueStatus(viewingClinic.id)}
                className={`text-xs ${
                  viewingClinic.status === 'OPEN'
                    ? 'text-amber-800 hover:bg-amber-50'
                    : 'text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                {viewingClinic.status === 'OPEN' ? 'Pause Queue' : 'Open Queue'}
              </Button>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const toEdit = viewingClinic;
                  setViewingClinic(null);
                  handleOpenEditModal(toEdit);
                }}
              >
                Edit Clinic
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setViewingClinic(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

