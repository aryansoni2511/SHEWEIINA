import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validateName, validatePhone, validateBusinessName } from '../utils/validation.js';
import {
  findHospitalById,
  findHospitalBySlug,
  findHospitalByAdminUserId,
  searchHospitals,
  createHospital,
  findDepartmentsByHospitalId,
  findDepartmentById,
  createDepartment,
  updateDepartment,
  findDoctorsByHospitalId,
  findDoctorById,
  createDoctorWithQueue,
  findDoctorQueueByDoctorId,
  findDoctorQueueById,
  toggleDoctorQueueStatus,
  findPatientByPhone,
  findPatientById,
  createPatient,
  findHospitalTokensByQueueId,
  findHospitalTokensByDoctorId,
  findHospitalTokenById,
  createHospitalToken,
  callNextDoctorToken,
  completeDoctorServingToken,
  skipDoctorToken,
} from '../models/hospitalModel.js';
import { createUser, findUserByEmail } from '../models/queueModel.js';
import { realtimeService } from './realtimeService.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set. Set it in your .env file before starting the server.');
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 400;
  }
}

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 404;
  }
}

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 409;
  }
}

export class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 403;
  }
}

/**
 * Distance helper: Haversine formula in kilometers
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * 1. Hospital Registration
 */
export async function processRegisterHospital({
  hospitalName,
  registrationNumber,
  hospitalType = 'General',
  phone,
  email,
  address,
  city,
  state = 'Maharashtra',
  pincode,
  latitude = null,
  longitude = null,
  facilities = [],
  openingHours = '24x7 Emergency / OPD 09:00 AM - 05:00 PM',
  adminName,
  adminEmail,
  adminPassword,
  adminPhone,
}) {
  if (!hospitalName || hospitalName.trim().length < 2) {
    throw new ValidationError('Hospital name is required (minimum 2 characters).');
  }
  if (!registrationNumber || registrationNumber.trim().length < 3) {
    throw new ValidationError('Valid Hospital Registration / License number is required.');
  }
  if (!phone || !validatePhone(phone).valid) {
    throw new ValidationError('Valid 10-digit hospital contact phone is required.');
  }
  if (!email || !email.includes('@')) {
    throw new ValidationError('Valid hospital email is required.');
  }
  if (!address || address.trim().length < 5) {
    throw new ValidationError('Full hospital address is required.');
  }
  if (!city || city.trim().length < 2) {
    throw new ValidationError('City is required.');
  }
  if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) {
    throw new ValidationError('Valid 6-digit Indian PIN code is required.');
  }

  // Admin account validation
  if (!adminName || adminName.trim().length < 2) {
    throw new ValidationError('Hospital administrator full name is required.');
  }
  if (!adminEmail || !adminEmail.includes('@')) {
    throw new ValidationError('Valid administrator email address is required.');
  }
  if (!adminPassword || adminPassword.length < 8) {
    throw new ValidationError('Administrator password must be at least 8 characters.');
  }
  const cleanAdminPhone = adminPhone ? String(adminPhone).trim() : phone.trim();
  if (!validatePhone(cleanAdminPhone).valid) {
    throw new ValidationError('Valid 10-digit administrator phone number is required.');
  }

  // Check if admin email already taken
  const existingUser = await findUserByEmail(adminEmail.trim().toLowerCase());
  if (existingUser) {
    throw new ConflictError('A user account with this administrator email already exists.');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  // 1. Create Hospital Admin User with role = 'BUSINESS'
  const adminUser = await createUser({
    name: adminName.trim(),
    email: adminEmail.trim().toLowerCase(),
    phone: cleanAdminPhone,
    passwordHash,
    role: 'BUSINESS',
    businessId: null,
  });

  // 2. Create Hospital Record
  const hospital = await createHospital({
    name: hospitalName.trim(),
    registrationNumber: registrationNumber.trim(),
    hospitalType,
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
    address: address.trim(),
    city: city.trim(),
    state: state.trim(),
    pincode: String(pincode).trim(),
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    facilities: Array.isArray(facilities) && facilities.length > 0 ? facilities : ['Emergency 24x7', 'Pharmacy', 'OPD'],
    openingHours,
    adminUserId: adminUser.id,
    businessId: null,
  });

  // 3. Create default starter departments
  const genDept = await createDepartment({
    hospitalId: hospital.id,
    name: 'General Medicine',
    code: 'GEN',
    description: 'Primary care, fever clinic, and internal medicine OPD.',
    floorRoom: 'Ground Floor, OPD Wing A',
  });

  const cardioDept = await createDepartment({
    hospitalId: hospital.id,
    name: 'Cardiology',
    code: 'CARD',
    description: 'Heart health, ECG, echocardiography, and cardiac consultation.',
    floorRoom: '1st Floor, Heart Wing',
  });

  // Generate Admin JWT Token
  const token = jwt.sign(
    {
      userId: adminUser.id,
      email: adminUser.email,
      role: 'BUSINESS',
      businessId: hospital.id, // hospital ID as tenant identifier
      hospitalId: hospital.id,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    hospital,
    admin: {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
    },
    token,
    starterDepartments: [genDept, cardioDept],
  };
}

/**
 * 2. Patient Registration
 */
export async function processRegisterPatient({
  name,
  age = null,
  dob = null,
  gender = 'Not Specified',
  phone,
  email = null,
  address = '',
  userId = null,
}) {
  const nameCheck = validateName(name);
  if (!nameCheck.valid) {
    throw new ValidationError(nameCheck.message);
  }

  if (!phone || String(phone).trim() === '') {
    throw new ValidationError('Patient mobile number is required.');
  }
  const cleanPhone = String(phone).trim();
  const phoneCheck = validatePhone(cleanPhone);
  if (!phoneCheck.valid) {
    throw new ValidationError(phoneCheck.message);
  }

  // Check if patient already registered with this phone number
  let patient = await findPatientByPhone(cleanPhone);
  if (patient) {
    return {
      isNew: false,
      patient,
    };
  }

  patient = await createPatient({
    name: nameCheck.normalized,
    age: age ? Number(age) : null,
    dob: dob || null,
    gender: gender || 'Not Specified',
    phone: cleanPhone,
    email: email && email.includes('@') ? email.trim().toLowerCase() : null,
    address: address ? address.trim() : '',
    userId,
  });

  return {
    isNew: true,
    patient,
  };
}

/**
 * 3. Search Hospitals & Directory
 */
export async function processSearchHospitals({
  search = '',
  city = '',
  pincode = '',
  facility = '',
  hospitalType = '',
  userLat = null,
  userLng = null,
}) {
  const hospitals = await searchHospitals({ search, city, pincode, facility, hospitalType });

  const enriched = await Promise.all(
    hospitals.map(async (hosp) => {
      const depts = await findDepartmentsByHospitalId(hosp.id);
      const doctors = await findDoctorsByHospitalId(hosp.id);

      let distanceKm = null;
      if (userLat && userLng && hosp.latitude && hosp.longitude) {
        distanceKm = calculateDistanceKm(
          parseFloat(userLat),
          parseFloat(userLng),
          parseFloat(hosp.latitude),
          parseFloat(hosp.longitude)
        );
      }

      // Count active doctors and queues
      const activeDoctors = doctors.filter((d) => d.is_active);
      const openQueues = doctors.filter((d) => d.queue_is_open);

      return {
        id: hosp.id,
        name: hosp.name,
        slug: hosp.slug,
        registrationNumber: hosp.registration_number,
        hospitalType: hosp.hospital_type,
        phone: hosp.phone,
        email: hosp.email,
        address: hosp.address,
        city: hosp.city,
        state: hosp.state,
        pincode: hosp.pincode,
        latitude: hosp.latitude ? parseFloat(hosp.latitude) : null,
        longitude: hosp.longitude ? parseFloat(hosp.longitude) : null,
        facilities: hosp.facilities || [],
        openingHours: hosp.opening_hours,
        distanceKm,
        departmentCount: depts.length,
        doctorCount: activeDoctors.length,
        openQueueCount: openQueues.length,
      };
    })
  );

  // If user location provided, sort by distance
  if (userLat && userLng) {
    enriched.sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }

  return enriched;
}

/**
 * 4. Get Hospital Details by ID or Slug
 */
export async function processGetHospitalDetails(idOrSlug) {
  if (!idOrSlug) throw new ValidationError('Hospital ID or slug is required.');

  let hospital = (await findHospitalById(idOrSlug)) || (await findHospitalBySlug(idOrSlug));
  if (!hospital) {
    throw new NotFoundError(`Hospital not found: ${idOrSlug}`);
  }

  const departments = await findDepartmentsByHospitalId(hospital.id);
  const doctors = await findDoctorsByHospitalId(hospital.id);

  // Enrich doctors with live queue status
  const enrichedDoctors = await Promise.all(
    doctors.map(async (doc) => {
      const queue = await findDoctorQueueByDoctorId(doc.id);
      const tokens = queue ? await findHospitalTokensByQueueId(queue.id) : [];

      const waitingTokens = tokens.filter((t) => t.status === 'WAITING');
      const servingToken = tokens.find((t) => t.status === 'SERVING');
      const servedToday = tokens.filter((t) => t.status === 'SERVED');

      const estimatedWait = waitingTokens.length * (doc.consultation_duration_minutes || 15);

      return {
        id: doc.id,
        departmentId: doc.department_id,
        departmentName: doc.department_name,
        departmentCode: doc.department_code,
        name: doc.name,
        qualification: doc.qualification,
        specialization: doc.specialization,
        roomNumber: doc.room_number,
        consultationDurationMinutes: doc.consultation_duration_minutes,
        consultationFee: doc.consultation_fee,
        availability: doc.availability,
        isActive: doc.is_active,
        queue: {
          id: queue?.id || null,
          isOpen: queue ? queue.is_open : true,
          tokenPrefix: queue?.token_prefix || 'H',
          waitingCount: waitingTokens.length,
          servingTokenNumber: servingToken?.token_number || null,
          servedTodayCount: servedToday.length,
          estimatedWaitMinutes: estimatedWait,
        },
      };
    })
  );

  return {
    hospital: {
      id: hospital.id,
      name: hospital.name,
      slug: hospital.slug,
      registrationNumber: hospital.registration_number,
      hospitalType: hospital.hospital_type,
      phone: hospital.phone,
      email: hospital.email,
      address: hospital.address,
      city: hospital.city,
      state: hospital.state,
      pincode: hospital.pincode,
      latitude: hospital.latitude ? parseFloat(hospital.latitude) : null,
      longitude: hospital.longitude ? parseFloat(hospital.longitude) : null,
      facilities: hospital.facilities || [],
      openingHours: hospital.opening_hours,
      isActive: hospital.is_active,
    },
    departments,
    doctors: enrichedDoctors,
  };
}

/**
 * 5. Department Management
 */
export async function processCreateDepartment({ hospitalId, name, code = '', description = '', floorRoom = '' }) {
  if (!hospitalId) throw new ValidationError('Hospital ID is required.');
  if (!name || name.trim().length < 2) {
    throw new ValidationError('Department name is required.');
  }

  const dept = await createDepartment({ hospitalId, name, code, description, floorRoom });
  return dept;
}

export async function processUpdateDepartment({ id, hospitalId, name, code, description, floorRoom, isActive }) {
  if (!id || !hospitalId) throw new ValidationError('Department ID and Hospital ID are required.');
  const updated = await updateDepartment(id, hospitalId, { name, code, description, floorRoom, isActive });
  if (!updated) throw new NotFoundError('Department not found or could not be updated.');
  return updated;
}

/**
 * 6. Doctor Management
 */
export async function processCreateDoctor({
  hospitalId,
  departmentId,
  name,
  qualification,
  specialization = '',
  roomNumber,
  consultationDuration = 15,
  consultationFee = 0,
  availability = 'Mon - Sat (09:00 AM - 01:00 PM)',
  tokenPrefix = null,
}) {
  if (!hospitalId) throw new ValidationError('Hospital ID is required.');
  if (!departmentId) throw new ValidationError('Department ID is required.');
  if (!name || name.trim().length < 2) throw new ValidationError('Doctor name is required.');
  if (!qualification || qualification.trim().length < 2) {
    throw new ValidationError('Medical qualification (e.g. MBBS, MD) is required.');
  }
  if (!roomNumber || roomNumber.trim().length < 1) {
    throw new ValidationError('OPD room/cabin number is required.');
  }

  const duration = Number(consultationDuration) || 15;
  const fee = Number(consultationFee) || 0;

  const result = await createDoctorWithQueue({
    hospitalId,
    departmentId,
    name,
    qualification,
    specialization,
    roomNumber,
    consultationDuration: duration,
    consultationFee: fee,
    availability,
    tokenPrefix,
  });

  return result;
}

/**
 * 7. Request OPD Token (Patient workflow)
 */
export async function processRequestOpdToken({
  hospitalId,
  doctorId,
  patientName,
  patientPhone,
  patientAge = null,
  patientGender = null,
  userId = null,
}) {
  if (!hospitalId) throw new ValidationError('Hospital ID is required.');
  if (!doctorId) throw new ValidationError('Doctor ID is required.');

  // Validate patient details
  const nameCheck = validateName(patientName);
  if (!nameCheck.valid) throw new ValidationError(nameCheck.message);

  const cleanPhone = String(patientPhone).trim();
  const phoneCheck = validatePhone(cleanPhone);
  if (!phoneCheck.valid) throw new ValidationError(phoneCheck.message);

  // Validate Doctor & Queue
  const doctor = await findDoctorById(doctorId);
  if (!doctor) throw new NotFoundError(`Doctor not found with ID: ${doctorId}`);
  if (!doctor.is_active) throw new ValidationError('Selected doctor is currently not accepting OPD consultations.');

  const queue = await findDoctorQueueByDoctorId(doctorId);
  if (!queue) throw new NotFoundError(`OPD Queue not configured for Dr. ${doctor.name}`);
  if (!queue.is_open) {
    throw new ConflictError(`OPD Queue for Dr. ${doctor.name} is currently paused or closed.`);
  }

  // Check capacity
  const existingTokens = await findHospitalTokensByQueueId(queue.id);
  const waitingTokens = existingTokens.filter((t) => t.status === 'WAITING');
  if (waitingTokens.length >= (queue.max_daily_capacity || 100)) {
    throw new ConflictError(`Dr. ${doctor.name} has reached maximum daily patient capacity (${queue.max_daily_capacity}).`);
  }

  // Prevent duplicate active token for same patient and same doctor today
  const activeDuplicate = existingTokens.find(
    (t) =>
      (t.status === 'WAITING' || t.status === 'SERVING') &&
      t.patient_phone === cleanPhone
  );
  if (activeDuplicate) {
    throw new ConflictError(
      `You already have an active token (${activeDuplicate.token_number}) in Dr. ${doctor.name}'s OPD queue.`
    );
  }

  // Register or resolve patient record
  let patient = await findPatientByPhone(cleanPhone);
  if (!patient) {
    patient = await createPatient({
      name: nameCheck.normalized,
      phone: cleanPhone,
      age: patientAge ? Number(patientAge) : null,
      gender: patientGender || 'Not Specified',
      userId,
    });
  }

  // Baseline transparent waiting time estimation
  // Formula: peopleAhead * doctor.consultation_duration_minutes
  const peopleAhead = waitingTokens.length;
  const estimatedWaitMinutes = peopleAhead * (doctor.consultation_duration_minutes || 15);

  const token = await createHospitalToken({
    queueId: queue.id,
    hospitalId: doctor.hospital_id,
    doctorId: doctor.id,
    departmentId: doctor.department_id,
    patientId: patient.id,
    patientCode: patient.patient_id,
    patientName: nameCheck.normalized,
    patientPhone: cleanPhone,
    patientAge: patientAge ? Number(patientAge) : null,
    patientGender: patientGender || 'Not Specified',
    estimatedWaitMinutes,
  });

  // Realtime Broadcast
  realtimeService.broadcastQueueEvent({
    businessId: doctor.hospital_id,
    queueId: queue.id,
    type: 'HOSPITAL_PATIENT_JOINED',
    data: {
      tokenId: token.id,
      tokenNumber: token.token_number,
      doctorName: doctor.name,
      patientName: token.patient_name,
      position: token.position,
      estimatedWaitMinutes,
    },
  });

  return {
    token,
    doctor: {
      id: doctor.id,
      name: doctor.name,
      qualification: doctor.qualification,
      specialization: doctor.specialization,
      roomNumber: doctor.room_number,
    },
    patient: {
      id: patient.id,
      patientId: patient.patient_id,
      name: patient.name,
      phone: patient.phone,
    },
    waitingCount: waitingTokens.length + 1,
    estimatedWaitMinutes,
  };
}

/**
 * 8. Call Next Patient for Doctor
 */
export async function processCallNextPatient({ hospitalId, doctorId }) {
  if (!hospitalId || !doctorId) {
    throw new ValidationError('Hospital ID and Doctor ID are required.');
  }

  const doctor = await findDoctorById(doctorId);
  if (!doctor) throw new NotFoundError('Doctor not found.');

  const queue = await findDoctorQueueByDoctorId(doctorId);
  if (!queue) throw new NotFoundError(`OPD Queue not found for Dr. ${doctor.name}`);

  const calledToken = await callNextDoctorToken(queue.id, hospitalId, doctorId);
  if (!calledToken) {
    throw new NotFoundError(`No waiting patients in Dr. ${doctor.name}'s OPD queue.`);
  }

  // Realtime Broadcast
  realtimeService.broadcastQueueEvent({
    businessId: hospitalId,
    queueId: queue.id,
    type: 'HOSPITAL_PATIENT_CALLED',
    data: {
      tokenId: calledToken.id,
      tokenNumber: calledToken.token_number,
      doctorName: doctor.name,
      patientName: calledToken.patient_name,
      roomNumber: doctor.room_number,
    },
  });

  return {
    token: calledToken,
    doctor: {
      id: doctor.id,
      name: doctor.name,
      roomNumber: doctor.room_number,
    },
  };
}

/**
 * 9. Complete Doctor Consultation
 */
export async function processCompleteConsultation({ hospitalId, doctorId }) {
  if (!hospitalId || !doctorId) {
    throw new ValidationError('Hospital ID and Doctor ID are required.');
  }

  const queue = await findDoctorQueueByDoctorId(doctorId);
  if (!queue) throw new NotFoundError('Doctor OPD Queue not found.');

  const completed = await completeDoctorServingToken(queue.id, hospitalId, doctorId);
  if (!completed) {
    throw new NotFoundError('No active consultation in progress to complete.');
  }

  realtimeService.broadcastQueueEvent({
    businessId: hospitalId,
    queueId: queue.id,
    type: 'HOSPITAL_CONSULTATION_COMPLETED',
    data: {
      tokenId: completed.id,
      tokenNumber: completed.token_number,
    },
  });

  return completed;
}

/**
 * 10. Skip Patient Token
 */
export async function processSkipPatientToken({ hospitalId, doctorId, tokenId }) {
  if (!hospitalId || !doctorId || !tokenId) {
    throw new ValidationError('Hospital ID, Doctor ID, and Token ID are required.');
  }

  const queue = await findDoctorQueueByDoctorId(doctorId);
  if (!queue) throw new NotFoundError('Doctor OPD Queue not found.');

  const skipped = await skipDoctorToken(tokenId, queue.id, hospitalId);
  if (!skipped) {
    throw new NotFoundError('Token not found or could not be skipped.');
  }

  return skipped;
}

/**
 * 11. Toggle Doctor Queue Open/Closed
 */
export async function processToggleDoctorQueue({ hospitalId, doctorId, isOpen }) {
  if (!hospitalId || !doctorId) {
    throw new ValidationError('Hospital ID and Doctor ID are required.');
  }

  const queue = await findDoctorQueueByDoctorId(doctorId);
  if (!queue) throw new NotFoundError('Doctor OPD Queue not found.');

  const updated = await toggleDoctorQueueStatus(queue.id, hospitalId, Boolean(isOpen));
  return updated;
}

/**
 * 12. Hospital Admin Dashboard
 */
export async function processGetHospitalDashboard(hospitalId) {
  if (!hospitalId) throw new ValidationError('Hospital ID is required.');

  const hospital = (await findHospitalById(hospitalId)) || (await findHospitalBySlug(hospitalId));
  if (!hospital) throw new NotFoundError(`Hospital not found: ${hospitalId}`);

  const departments = await findDepartmentsByHospitalId(hospital.id, true);
  const doctors = await findDoctorsByHospitalId(hospital.id, null, true);

  let totalWaiting = 0;
  let totalServedToday = 0;
  let totalServing = 0;

  const doctorStations = await Promise.all(
    doctors.map(async (doc) => {
      const queue = await findDoctorQueueByDoctorId(doc.id);
      const tokens = queue ? await findHospitalTokensByQueueId(queue.id) : [];

      const waitingTokens = tokens.filter((t) => t.status === 'WAITING');
      const servingToken = tokens.find((t) => t.status === 'SERVING');
      const servedTokens = tokens.filter((t) => t.status === 'SERVED');
      const skippedTokens = tokens.filter((t) => t.status === 'SKIPPED');

      totalWaiting += waitingTokens.length;
      totalServedToday += servedTokens.length;
      if (servingToken) totalServing += 1;

      return {
        doctorId: doc.id,
        doctorName: doc.name,
        qualification: doc.qualification,
        specialization: doc.specialization,
        roomNumber: doc.room_number,
        consultationDurationMinutes: doc.consultation_duration_minutes,
        departmentId: doc.department_id,
        departmentName: doc.department_name,
        departmentCode: doc.department_code,
        queueId: queue?.id || null,
        isQueueOpen: queue ? queue.is_open : true,
        waitingTokens,
        servingToken: servingToken || null,
        servedCount: servedTokens.length,
        skippedCount: skippedTokens.length,
        estimatedWaitMinutes: waitingTokens.length * (doc.consultation_duration_minutes || 15),
      };
    })
  );

  return {
    hospital: {
      id: hospital.id,
      name: hospital.name,
      slug: hospital.slug,
      registrationNumber: hospital.registration_number,
      hospitalType: hospital.hospital_type,
      phone: hospital.phone,
      email: hospital.email,
      address: hospital.address,
      city: hospital.city,
      state: hospital.state,
      pincode: hospital.pincode,
      facilities: hospital.facilities || [],
      openingHours: hospital.opening_hours,
    },
    summary: {
      totalWaiting,
      totalServedToday,
      totalServing,
      activeDoctorsCount: doctors.filter((d) => d.is_active).length,
      openQueuesCount: doctorStations.filter((s) => s.isQueueOpen).length,
      departmentsCount: departments.filter((d) => d.is_active).length,
    },
    departments,
    doctorStations,
  };
}

export default {
  processRegisterHospital,
  processRegisterPatient,
  processSearchHospitals,
  processGetHospitalDetails,
  processCreateDepartment,
  processUpdateDepartment,
  processCreateDoctor,
  processRequestOpdToken,
  processCallNextPatient,
  processCompleteConsultation,
  processSkipPatientToken,
  processToggleDoctorQueue,
  processGetHospitalDashboard,
};
