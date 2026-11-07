import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Navbar';
import FooterSection from '../FooterSection';
import HospitalMap from '../components/hospital/HospitalMap';
import { searchHospitalsApi } from '../services/api';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

const FACILITY_OPTIONS = [
  'Emergency 24x7',
  'ICU',
  'Pharmacy',
  'Diagnostic Lab',
  'Ambulance',
  'Radiology / CT Scan',
  'Dialysis Center',
  'Blood Bank',
  'NICU / PICU',
];

const HOSPITAL_TYPES = ['All', 'Multi-Specialty', 'General', 'Super-Specialty'];

export default function HospitalDiscoveryPage() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedPincode, setSelectedPincode] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'list' | 'map'
  const [errorMessage, setErrorMessage] = useState(null);

  // Fetch hospitals
  const fetchHospitals = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await searchHospitalsApi({
        search: searchQuery,
        city: selectedCity,
        pincode: selectedPincode,
        facility: selectedFacility,
        type: selectedType === 'All' ? '' : selectedType,
      });

      if (res.data?.hospitals) {
        setHospitals(res.data.hospitals);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to load hospitals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHospitals();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCity, selectedPincode, selectedType, selectedFacility]);

  return (
    <div className="bg-[#F8FAFC] text-[#172033] font-sans antialiased min-h-screen flex flex-col selection:bg-emerald-600 selection:text-white">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* Top Header Hero */}
        <section className="bg-white border-b border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8 shadow-xs">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    🏥 Hospital OPD Network
                  </span>
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                    Live Virtual Queues &amp; OPD Booking
                  </span>
                </div>
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                  Find Hospitals &amp; OPD Waiting Queues
                </h1>
                <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  Discover verified multi-specialty hospitals, explore clinical departments, check doctor availability, and reserve OPD tokens before arriving.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link to="/register-hospital">
                  <Button variant="primary" size="md" className="font-bold shadow-sm">
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Register Hospital
                  </Button>
                </Link>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-3 pt-6 border-t border-slate-100">
              {/* Keyword Search */}
              <div className="md:col-span-5 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hospital name, address, or landmark..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* City Filter */}
              <div className="md:col-span-3">
                <input
                  type="text"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  placeholder="City (e.g. Mumbai, Pune)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* PIN Code Filter */}
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={selectedPincode}
                  onChange={(e) => setSelectedPincode(e.target.value)}
                  placeholder="PIN Code"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="md:col-span-2 flex items-center justify-end">
                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 w-full sm:w-auto justify-center">
                  <button
                    type="button"
                    onClick={() => setViewMode('split')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      viewMode === 'split' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Split Map and List View"
                  >
                    Split
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Hospitals List Only"
                  >
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('map')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      viewMode === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Full Interactive Map"
                  >
                    Map
                  </button>
                </div>
              </div>
            </div>

            {/* Hospital Type & Facilities Filter Pills */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Type:
              </span>
              {HOSPITAL_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedType === type
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200/70'
                  }`}
                >
                  {type}
                </button>
              ))}

              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-3 mr-1">
                Facility:
              </span>
              {FACILITY_OPTIONS.slice(0, 5).map((fac) => (
                <button
                  key={fac}
                  type="button"
                  onClick={() => setSelectedFacility(selectedFacility === fac ? '' : fac)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedFacility === fac
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  {fac}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Error Notification */}
        {errorMessage && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
              <span>⚠️ {errorMessage}</span>
              <button type="button" onClick={() => setErrorMessage(null)} className="font-bold">✕</button>
            </div>
          </div>
        )}

        {/* Content Section: Split, List, or Map */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          {viewMode === 'map' ? (
            <div className="space-y-4">
              <HospitalMap
                hospitals={hospitals}
                selectedHospital={selectedHospital}
                onSelectHospital={(h) => setSelectedHospital(h)}
                height="650px"
              />
            </div>
          ) : viewMode === 'list' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-6 rounded-3xl bg-white border border-slate-200 animate-pulse space-y-4">
                    <div className="h-5 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-4 bg-slate-100 rounded-md w-1/2" />
                    <div className="h-16 bg-slate-100 rounded-xl w-full" />
                  </div>
                ))
              ) : hospitals.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState
                    title="No hospitals found"
                    description="Try adjusting your search query, city, or selected facilities filter."
                    action={
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCity('');
                          setSelectedPincode('');
                          setSelectedType('All');
                          setSelectedFacility('');
                        }}
                      >
                        Reset Search Filters
                      </Button>
                    }
                  />
                </div>
              ) : (
                hospitals.map((hospital) => (
                  <HospitalCard key={hospital.id} hospital={hospital} />
                ))
              )}
            </div>
          ) : (
            /* Split View: List on left, Map on right */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Hospital Cards */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {hospitals.length} {hospitals.length === 1 ? 'Hospital' : 'Hospitals'} Found
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    Select a hospital to view OPD rooms &amp; queues
                  </span>
                </div>

                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-5 rounded-3xl bg-white border border-slate-200 animate-pulse space-y-3">
                      <div className="h-5 bg-slate-200 rounded-md w-3/4" />
                      <div className="h-4 bg-slate-100 rounded-md w-1/2" />
                    </div>
                  ))
                ) : hospitals.length === 0 ? (
                  <EmptyState
                    title="No hospitals matched your search"
                    description="Expand your search radius or clear filters to view nearby multi-specialty centers."
                  />
                ) : (
                  hospitals.map((hospital) => (
                    <HospitalCard
                      key={hospital.id}
                      hospital={hospital}
                      isSelected={selectedHospital?.id === hospital.id}
                      onHover={() => setSelectedHospital(hospital)}
                    />
                  ))
                )}
              </div>

              {/* Right Column: Sticky Interactive Leaflet Map */}
              <div className="lg:col-span-6 sticky top-24">
                <HospitalMap
                  hospitals={hospitals}
                  selectedHospital={selectedHospital}
                  onSelectHospital={(h) => setSelectedHospital(h)}
                  height="580px"
                />
              </div>
            </div>
          )}
        </div>
      </main>

      <FooterSection />
    </div>
  );
}

function HospitalCard({ hospital, isSelected = false, onHover = null }) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;

  return (
    <div
      onMouseEnter={onHover}
      className={`p-6 rounded-3xl bg-white border transition-all duration-200 flex flex-col justify-between group ${
        isSelected
          ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
          : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-lg">
              🏥
            </div>
            <div>
              <Link
                to={`/hospital/${hospital.slug || hospital.id}`}
                className="font-display font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1"
              >
                {hospital.name}
              </Link>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                  {hospital.hospitalType || 'Multi-Specialty'}
                </span>
                {hospital.distanceKm !== null && (
                  <span className="text-[11px] font-semibold text-emerald-700">
                    📍 {hospital.distanceKm} km away
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-2">
          {hospital.address}, {hospital.city} - {hospital.pincode}
        </p>

        {/* Facilities tags */}
        {hospital.facilities && hospital.facilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {hospital.facilities.slice(0, 4).map((fac) => (
              <span
                key={fac}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200/60"
              >
                {fac}
              </span>
            ))}
            {hospital.facilities.length > 4 && (
              <span className="text-[10px] text-slate-400 font-semibold px-1 py-0.5">
                +{hospital.facilities.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Department and Doctor counts */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Departments</span>
            <span className="font-bold text-slate-800">{hospital.departmentCount || 'OPD Ready'}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Active Doctors</span>
            <span className="font-bold text-slate-800">{hospital.doctorCount || 'Consultants'}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1"
          title="Open Directions in Google Maps"
        >
          <span>Directions</span>
          <span>↗</span>
        </a>

        <Link to={`/hospital/${hospital.slug || hospital.id}`}>
          <Button variant="primary" size="sm" className="font-bold">
            View OPD &amp; Doctors →
          </Button>
        </Link>
      </div>
    </div>
  );
}

