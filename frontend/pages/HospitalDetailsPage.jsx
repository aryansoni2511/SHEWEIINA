import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../Navbar';
import FooterSection from '../FooterSection';
import { getHospitalDetailsApi, requestHospitalOpdTokenApi } from '../services/api';
import HospitalMap from '../components/hospital/HospitalMap';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';

export default function HospitalDetailsPage() {
  const { hospitalId } = useParams();
  const navigate = useNavigate();

  const [hospital, setHospital] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Map preview modal
  const [showMapModal, setShowMapModal] = useState(false);

  // Patient OPD Check-in Modal
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [patientForm, setPatientForm] = useState({
    name: '',
    phone: '',
    age: '',
    gender: 'Not Specified',
  });
  const [patientErrors, setPatientErrors] = useState({});
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  // Load hospital data
  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await getHospitalDetailsApi(hospitalId);
      if (res.data) {
        setHospital(res.data.hospital);
        setDepartments(res.data.departments || []);
        setDoctors(res.data.doctors || []);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load hospital details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [hospitalId]);

  // Filter doctors by selected department
  const filteredDoctors = doctors.filter((doc) => {
    if (selectedDeptId === 'ALL') return true;
    return doc.departmentId === selectedDeptId;
  });

  // Handle Token Request Submit
  const handleConfirmToken = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!patientForm.name.trim() || patientForm.name.trim().length < 2) {
      errors.name = 'Patient name is required (minimum 2 characters).';
    }
    const cleanPhone = patientForm.phone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      errors.phone = 'Valid 10-digit mobile number starting with 7, 8, or 9 is required.';
    }
    setPatientErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setBookingLoading(true);
    setBookingError(null);

    try {
      const res = await requestHospitalOpdTokenApi({
        hospitalId: hospital.id,
        doctorId: bookingDoctor.id,
        patientName: patientForm.name.trim(),
        patientPhone: cleanPhone,
        patientAge: patientForm.age ? Number(patientForm.age) : null,
        patientGender: patientForm.gender,
      });

      if (res.data?.token) {
        navigate(`/hospital/token/${res.data.token.id || res.data.token.token_number}`);
      }
    } catch (err) {
      setBookingError(err.message || 'Failed to request OPD token.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Loading Hospital OPD Departments...</p>
          </div>
        </div>
        <FooterSection />
      </div>
    );
  }

  if (errorMessage || !hospital) {
    return (
      <div className="bg-[#F8FAFC] min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center">
          <EmptyState
            title="Hospital Not Found"
            description={errorMessage || 'The hospital you are looking for does not exist or has been deactivated.'}
            action={
              <Link to="/hospitals">
                <Button variant="primary">← Back to Hospital Directory</Button>
              </Link>
            }
          />
        </div>
        <FooterSection />
      </div>
    );
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;

  return (
    <div className="bg-[#F8FAFC] text-[#172033] font-sans antialiased min-h-screen flex flex-col selection:bg-emerald-600 selection:text-white">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* Hospital Hero Banner */}
        <section className="bg-white border-b border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8 shadow-xs">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-2xl shadow-xs">
                  🏥
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {hospital.hospitalType || 'Multi-Specialty'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Reg. No: <strong>{hospital.registrationNumber}</strong>
                    </span>
                  </div>

                  <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                    {hospital.name}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    📍 {hospital.address}, {hospital.city} - {hospital.pincode}, {hospital.state}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600">
                    <span>📞 <strong>{hospital.phone}</strong></span>
                    <span>✉️ <strong>{hospital.email}</strong></span>
                    <span>🕒 {hospital.openingHours}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <span>Directions</span>
                  <span>↗</span>
                </a>

                {hospital.latitude && hospital.longitude && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowMapModal(true)}
                    className="font-semibold"
                  >
                    🗺️ View on Map
                  </Button>
                )}
              </div>
            </div>

            {/* Available Facilities Bar */}
            {hospital.facilities && hospital.facilities.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2">
                  Facilities Available:
                </span>
                {hospital.facilities.map((fac) => (
                  <span
                    key={fac}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/70"
                  >
                    ✓ {fac}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* OPD Departments & Doctors Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
            <div>
              <h2 className="font-display font-extrabold text-xl text-slate-900 tracking-tight">
                Outpatient Departments (OPD) &amp; Available Doctors
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select your specialty department, check live waiting times, and reserve a doctor OPD token.
              </p>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <strong>{filteredDoctors.length}</strong> available {filteredDoctors.length === 1 ? 'doctor' : 'doctors'}
            </div>
          </div>

          {/* Department Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pb-6 border-b border-slate-200/70">
            <button
              type="button"
              onClick={() => setSelectedDeptId('ALL')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                selectedDeptId === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              All Departments ({doctors.length})
            </button>

            {departments.map((dept) => {
              const count = doctors.filter((d) => d.departmentId === dept.id).length;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setSelectedDeptId(dept.id)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all border ${
                    selectedDeptId === dept.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  {dept.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Doctor Cards Grid */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  title="No doctors available in this department"
                  description="Please select another clinical department or check back during regular OPD hours."
                  action={
                    <Button variant="secondary" size="sm" onClick={() => setSelectedDeptId('ALL')}>
                      Show All Doctors
                    </Button>
                  }
                />
              </div>
            ) : (
              filteredDoctors.map((doc) => {
                const isOpen = doc.queue?.isOpen !== false;
                const waitingCount = doc.queue?.waitingCount || 0;
                const servingToken = doc.queue?.servingTokenNumber;
                const estimatedWait = doc.queue?.estimatedWaitMinutes || 0;

                return (
                  <Card
                    key={doc.id}
                    className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Doctor Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 mb-1">
                            {doc.departmentName || 'General OPD'}
                          </span>
                          <h3 className="font-display font-bold text-base text-slate-900 line-clamp-1">
                            {doc.name}
                          </h3>
                          <span className="text-xs text-slate-500 font-medium block">
                            {doc.qualification}
                          </span>
                        </div>

                        <div>
                          {isOpen ? (
                            <Badge variant="emerald" size="sm" dot>
                              OPD Open
                            </Badge>
                          ) : (
                            <Badge variant="amber" size="sm" dot>
                              Queue Paused
                            </Badge>
                          )}
                        </div>
                      </div>

                      {doc.specialization && (
                        <p className="text-xs text-emerald-800 font-medium mb-3">
                          Specialty: {doc.specialization}
                        </p>
                      )}

                      {/* Room & Availability Details */}
                      <div className="space-y-1.5 py-3 border-y border-slate-100 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Cabin / Room:</span>
                          <span className="font-bold text-slate-800">{doc.roomNumber}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">OPD Timings:</span>
                          <span className="text-slate-700">{doc.availability}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Consultation Fee:</span>
                          <span className="font-bold text-slate-900">
                            {doc.consultationFee ? `₹${doc.consultationFee}` : 'Hospital OPD Free'}
                          </span>
                        </div>
                      </div>

                      {/* Live Queue Station Box */}
                      <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">Currently In Cabin:</span>
                          <span className="font-mono font-bold text-emerald-900">
                            {servingToken ? `#${servingToken}` : 'Ready for next'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">Patients in Queue:</span>
                          <span className="font-bold text-slate-900">
                            {waitingCount} {waitingCount === 1 ? 'patient' : 'patients'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-200/50">
                          <span className="text-slate-500">Estimated Wait:</span>
                          <span className="font-bold text-emerald-800">
                            {waitingCount > 0 ? `~${estimatedWait} mins` : 'Immediate OPD Entry'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Book Button */}
                    <div className="mt-6 pt-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        disabled={!isOpen}
                        onClick={() => {
                          setBookingDoctor(doc);
                          setBookingError(null);
                        }}
                        className="w-full font-bold shadow-xs py-2.5"
                      >
                        {isOpen ? 'Get OPD Token →' : 'Queue Currently Paused'}
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Map Preview Modal */}
      {showMapModal && (
        <Modal
          isOpen={showMapModal}
          onClose={() => setShowMapModal(false)}
          title={hospital.name}
          description={`${hospital.address}, ${hospital.city} - ${hospital.pincode}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <HospitalMap
              hospitals={[hospital]}
              selectedHospital={hospital}
              height="400px"
            />
            <div className="flex items-center justify-between pt-2">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <span>Open in Google Maps</span>
                <span>↗</span>
              </a>
              <Button variant="secondary" size="sm" onClick={() => setShowMapModal(false)}>
                Close Map
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Patient OPD Token Request Modal */}
      {bookingDoctor && (
        <Modal
          isOpen={Boolean(bookingDoctor)}
          onClose={() => setBookingDoctor(null)}
          title={`OPD Token — ${bookingDoctor.name}`}
          description={`Department: ${bookingDoctor.departmentName} • Room: ${bookingDoctor.roomNumber}`}
          maxWidth="max-w-md"
        >
          {bookingError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{bookingError}</span>
            </div>
          )}

          <form onSubmit={handleConfirmToken} className="space-y-4 text-xs">
            <Input
              label="Patient Full Name"
              required
              placeholder="e.g. Rohan Sharma"
              value={patientForm.name}
              onChange={(e) => {
                setPatientForm({ ...patientForm, name: e.target.value });
                if (patientErrors.name) setPatientErrors({ ...patientErrors, name: null });
              }}
              error={patientErrors.name}
            />

            <Input
              label="Mobile Number (for SMS & WhatsApp turn alerts)"
              type="tel"
              required
              placeholder="e.g. 9820123456"
              value={patientForm.phone}
              onChange={(e) => {
                setPatientForm({ ...patientForm, phone: e.target.value });
                if (patientErrors.phone) setPatientErrors({ ...patientErrors, phone: null });
              }}
              error={patientErrors.phone}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Age (Years)"
                type="number"
                placeholder="e.g. 35"
                value={patientForm.age}
                onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
              />

              <Select
                label="Gender"
                value={patientForm.gender}
                onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
              >
                <option value="Not Specified">Not Specified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-slate-600 text-[11px]">
              <div className="flex justify-between">
                <span>Doctor Consultation Fee:</span>
                <strong className="text-slate-900">
                  {bookingDoctor.consultationFee ? `₹${bookingDoctor.consultationFee}` : 'Free'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Estimated Turn Wait:</span>
                <strong className="text-emerald-800">
                  {bookingDoctor.queue?.waitingCount > 0
                    ? `~${bookingDoctor.queue?.estimatedWaitMinutes} mins`
                    : 'Next Available'}
                </strong>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setBookingDoctor(null)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={bookingLoading}
                className="font-bold shadow-xs px-5"
              >
                {bookingLoading ? 'Issuing Token...' : 'Confirm OPD Token'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <FooterSection />
    </div>
  );
}

