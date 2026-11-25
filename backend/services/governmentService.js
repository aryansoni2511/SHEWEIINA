import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validateName, validatePhone, validateBusinessName } from '../utils/validation.js';
import {
  findGovernmentCentreById,
  findGovernmentCentreBySlug,
  findGovernmentCentreByAdminUserId,
  searchGovernmentCentres,
  createGovernmentCentre,
  getAllGovernmentServices,
  findGovernmentServiceBySlug,
  findGovernmentServiceById,
  findGovernmentCountersByCentreId,
  findGovernmentCounterById,
  createGovernmentCounter,
  toggleGovernmentCounterStatus,
  createGovernmentToken,
  findGovernmentTokenById,
  findActiveTokenByPhoneAndService,
  callNextGovernmentCitizen,
  completeGovernmentToken,
  skipGovernmentToken,
  cancelGovernmentToken,
  getGovernmentDashboardData,
} from '../models/governmentModel.js';
import { createUser, findUserByEmail } from '../models/queueModel.js';
import realtimeService from './realtimeService.js';

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

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
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

// ─────────────────────────────────────────────────────────────────────────────
// 1. Centre Discovery & Details
// ─────────────────────────────────────────────────────────────────────────────

export async function processSearchCentres({
  search = '',
  city = '',
  pincode = '',
  category = '',
  userLat = null,
  userLng = null,
} = {}) {
  const centres = await searchGovernmentCentres({ search, city, pincode, category });

  return centres.map((centre) => {
    let distanceKm = null;
    if (userLat && userLng && centre.latitude && centre.longitude) {
      distanceKm = calculateDistanceKm(
        Number(userLat),
        Number(userLng),
        Number(centre.latitude),
        Number(centre.longitude)
      );
    }
    return {
      ...centre,
      distanceKm,
    };
  });
}

export async function processGetCentreDetails(idOrSlug) {
  if (!idOrSlug) {
    throw new ValidationError('Centre ID or slug is required.');
  }

  let centre = null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)) {
    centre = await findGovernmentCentreById(idOrSlug);
  }
  if (!centre) {
    centre = await findGovernmentCentreBySlug(idOrSlug);
  }

  if (!centre) {
    throw new NotFoundError('Government Centre or Facilitation Desk not found.');
  }

  const counters = await findGovernmentCountersByCentreId(centre.id);
  const services = await getAllGovernmentServices();

  return {
    centre,
    counters,
    availableServices: services,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Services Catalog
// ─────────────────────────────────────────────────────────────────────────────

export async function processGetServices(category = null) {
  return await getAllGovernmentServices(category);
}

export async function processGetServiceDetails(slug) {
  if (!slug) {
    throw new ValidationError('Service slug is required.');
  }
  const service = await findGovernmentServiceBySlug(slug);
  if (!service) {
    throw new NotFoundError('Government service not found.');
  }

  // Find centres that support this category
  const matchingCentres = await searchGovernmentCentres({ category: service.category });

  return {
    service,
    availableCentres: matchingCentres,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Centre Registration
// ─────────────────────────────────────────────────────────────────────────────

export async function processRegisterCentre({
  centreName,
  centreCode,
  centreType = 'Maha E-Seva Kendra / Citizen Service Desk',
  phone,
  email,
  address,
  city = 'Mumbai',
  district = 'Mumbai',
  state = 'Maharashtra',
  pincode,
  latitude = 19.0760,
  longitude = 72.8777,
  operatingHours = 'Mon - Sat (09:30 AM - 05:30 PM)',
  supportedCategories = ['Aadhaar', 'Passport', 'RTO', 'Municipal'],
  adminName,
  adminEmail,
  adminPassword,
  adminPhone,
}) {
  const nameCheck = validateBusinessName(centreName);
  if (!nameCheck.valid) throw new ValidationError(nameCheck.message);

  if (!centreCode || !centreCode.trim()) {
    throw new ValidationError('Centre Code / Registration ID is required.');
  }

  const phoneCheck = validatePhone(phone);
  if (!phoneCheck.valid) throw new ValidationError(phoneCheck.message);

  if (!email || !email.includes('@')) {
    throw new ValidationError('A valid official contact email is required.');
  }

  if (!address || address.trim().length < 5) {
    throw new ValidationError('Complete centre physical address is required (minimum 5 characters).');
  }

  if (!pincode || !/^\d{6}$/.test(pincode.trim())) {
    throw new ValidationError('Valid 6-digit Indian PIN code is required.');
  }

  const adminNameCheck = validateName(adminName);
  if (!adminNameCheck.valid) throw new ValidationError(adminNameCheck.message);

  if (!adminEmail || !adminEmail.includes('@')) {
    throw new ValidationError('A valid administrator email is required.');
  }

  if (!adminPassword || adminPassword.length < 8) {
    throw new ValidationError('Administrator password must be at least 8 characters.');
  }

  // Check if admin email already registered
  const existingUser = await findUserByEmail(adminEmail);
  if (existingUser) {
    throw new ConflictError('An account with this administrator email already exists.');
  }

  // Create Government Centre Admin User
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const user = await createUser({
    name: adminName.trim(),
    email: adminEmail.trim(),
    passwordHash,
    role: 'BUSINESS',
    phone: adminPhone || phone,
    businessId: null,
  });

  const baseSlug = centreName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

  // Create Government Centre
  const centre = await createGovernmentCentre({
    businessId: null,
    name: centreName.trim(),
    slug,
    centreCode: centreCode.trim(),
    centreType,
    phone: phone.trim(),
    email: email.trim(),
    address: address.trim(),
    city: city.trim(),
    district: district.trim(),
    state: state.trim(),
    pincode: pincode.trim(),
    latitude: Number(latitude) || 19.0760,
    longitude: Number(longitude) || 72.8777,
    operatingHours,
    supportedCategories,
    adminUserId: user.id,
    isVerified: false, // New centres start unverified
  });

  // Provision 2 default counters
  await createGovernmentCounter({
    centreId: centre.id,
    counterNumber: 'Counter 1',
    counterName: 'General Citizen Token Desk',
    operatorName: adminName.trim(),
    assignedCategory: 'All',
    tokenPrefix: 'G',
  });

  await createGovernmentCounter({
    centreId: centre.id,
    counterNumber: 'Counter 2',
    counterName: 'Verification & Document Desk',
    operatorName: 'Assigned Operator',
    assignedCategory: 'Aadhaar',
    tokenPrefix: 'DOC',
  });

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: 'BUSINESS',
      businessId: centre.id,
      centreId: centre.id,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    centre,
    admin: { id: user.id, name: user.name, email: user.email },
    token,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Token Pass & Queue Join
// ─────────────────────────────────────────────────────────────────────────────

export async function processRequestToken({
  centreId,
  serviceId,
  citizenName,
  citizenPhone,
  citizenEmail = null,
  appointmentType = 'WALK_IN',
  appointmentDate = null,
  appointmentSlot = 'Immediate Walk-in',
  checklistCompleted = false,
  verifiedDocumentsCount = 0,
}) {
  if (!centreId) throw new ValidationError('Centre ID is required.');
  if (!serviceId) throw new ValidationError('Service ID is required.');

  const nameCheck = validateName(citizenName);
  if (!nameCheck.valid) throw new ValidationError(nameCheck.message);

  const phoneCheck = validatePhone(citizenPhone);
  if (!phoneCheck.valid) throw new ValidationError(phoneCheck.message);

  const centre = await findGovernmentCentreById(centreId);
  if (!centre) throw new NotFoundError('Government Centre not found.');

  const service = await findGovernmentServiceById(serviceId);
  if (!service) throw new NotFoundError('Government service not found.');

  // Check duplicate active token today
  const existingToken = await findActiveTokenByPhoneAndService(citizenPhone, serviceId);
  if (existingToken) {
    const err = new ConflictError(
      `You already have an active queue token (#${existingToken.token_number}) for ${service.name} today at this centre.`
    );
    err.code = 'DUPLICATE_ACTIVE_TOKEN';
    err.details = {
      code: 'DUPLICATE_ACTIVE_TOKEN',
      tokenId: existingToken.id,
      tokenNumber: existingToken.token_number,
      status: existingToken.status,
      centreId,
      serviceId,
    };
    throw err;
  }

  const token = await createGovernmentToken({
    centreId,
    serviceId,
    citizenName: citizenName.trim(),
    citizenPhone: citizenPhone.trim(),
    citizenEmail: citizenEmail ? citizenEmail.trim() : null,
    appointmentType,
    appointmentDate,
    appointmentSlot,
    checklistCompleted: Boolean(checklistCompleted),
    verifiedDocumentsCount: Number(verifiedDocumentsCount) || 0,
  });

  // Realtime Broadcast (Zero PII, Scoped Module)
  realtimeService.broadcastQueueEvent({
    businessId: centreId,
    queueId: token.counter_id,
    tokenId: token.id,
    type: 'GOVERNMENT_CITIZEN_JOINED',
    module: 'government',
    data: {
      tokenNumber: token.token_number,
      position: token.position,
      estimatedWaitMinutes: token.estimated_wait_minutes,
    },
  });

  return token;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Dashboard & Counter Management
// ─────────────────────────────────────────────────────────────────────────────

export async function resolveAuthorizedCentreId(user) {
  if (!user || !user.userId) {
    throw new ForbiddenError('Authentication required.');
  }

  // 1. Check explicit centreId or businessId in user token
  const candidateId = user.centreId || user.businessId;
  if (candidateId) {
    const centre = await findGovernmentCentreById(candidateId);
    if (centre) {
      if (centre.admin_user_id && String(centre.admin_user_id) === String(user.userId)) {
        return centre.id;
      }
      throw new ForbiddenError('You do not have administrative access to this government centre.');
    }
  }

  // 2. Check if user owns a centre via admin_user_id
  const centre = await findGovernmentCentreByAdminUserId(user.userId);
  if (centre && centre.admin_user_id && String(centre.admin_user_id) === String(user.userId)) {
    return centre.id;
  }

  throw new ForbiddenError('You do not have administrative access to any government centre.');
}

export async function processGetDashboard(user, requestedCentreId = null) {
  const operatorCentreId = await resolveAuthorizedCentreId(user);

  if (requestedCentreId && requestedCentreId !== operatorCentreId) {
    throw new ForbiddenError('You are not authorized to access another centre’s dashboard.');
  }

  const dashboard = await getGovernmentDashboardData(operatorCentreId);
  if (!dashboard) {
    throw new NotFoundError('Dashboard data could not be retrieved.');
  }

  return dashboard;
}

export async function processCreateCounter(user, data) {
  const centreId = await resolveAuthorizedCentreId(user);
  if (!data.counterNumber || !data.counterNumber.trim()) {
    throw new ValidationError('Counter number or name is required.');
  }
  return await createGovernmentCounter({
    centreId,
    ...data,
  });
}

export async function processToggleCounter(user, counterId, isOpen) {
  if (!counterId) throw new ValidationError('Counter ID is required.');
  const operatorCentreId = await resolveAuthorizedCentreId(user);

  const counter = await findGovernmentCounterById(counterId);
  if (!counter) {
    throw new NotFoundError('Counter not found.');
  }

  if (counter.centre_id !== operatorCentreId) {
    throw new ForbiddenError('You are not authorized to toggle counters belonging to another centre.');
  }

  const updatedCounter = await toggleGovernmentCounterStatus(counterId, isOpen);

  // Realtime Broadcast: Notify subscribers of counter state change (Zero PII, Scoped Module)
  realtimeService.broadcastQueueEvent({
    businessId: operatorCentreId,
    queueId: counterId,
    type: 'GOVERNMENT_QUEUE_UPDATED',
    module: 'government',
    data: {
      counterId,
      counterNumber: counter.counter_number,
      isOpen: Boolean(isOpen),
    },
  });

  return updatedCounter;
}

export async function processCallNext(user, counterId) {
  if (!counterId) {
    throw new ValidationError('Counter ID is required.');
  }
  const operatorCentreId = await resolveAuthorizedCentreId(user);

  const counter = await findGovernmentCounterById(counterId);
  if (!counter) {
    throw new NotFoundError('Counter not found.');
  }

  if (counter.centre_id !== operatorCentreId) {
    throw new ForbiddenError('You are not authorized to operate counters belonging to another centre.');
  }

  const token = await callNextGovernmentCitizen(operatorCentreId, counterId);
  if (!token) {
    throw new NotFoundError('No waiting citizens in this queue.');
  }

  // Realtime Broadcast (Zero PII, Scoped Module)
  realtimeService.broadcastQueueEvent({
    businessId: operatorCentreId,
    queueId: counterId,
    tokenId: token.id,
    type: 'GOVERNMENT_CITIZEN_CALLED',
    module: 'government',
    data: {
      tokenNumber: token.token_number,
      counterNumber: counter.counter_number,
    },
  });

  return token;
}

export async function processCompleteToken(user, tokenId) {
  if (!tokenId) throw new ValidationError('Token ID is required.');
  const operatorCentreId = await resolveAuthorizedCentreId(user);

  const token = await findGovernmentTokenById(tokenId);
  if (!token) {
    throw new NotFoundError('Token not found.');
  }

  if (token.centre_id !== operatorCentreId) {
    throw new ForbiddenError('You are not authorized to complete tokens belonging to another centre.');
  }

  const completed = await completeGovernmentToken(tokenId);

  // Realtime Broadcast (Zero PII, Scoped Module)
  realtimeService.broadcastQueueEvent({
    businessId: operatorCentreId,
    queueId: token.counter_id,
    tokenId: token.id,
    type: 'GOVERNMENT_SERVICE_COMPLETED',
    module: 'government',
    data: {
      tokenNumber: token.token_number,
    },
  });

  return completed;
}

export async function processSkipToken(user, tokenId) {
  if (!tokenId) throw new ValidationError('Token ID is required.');
  const operatorCentreId = await resolveAuthorizedCentreId(user);

  const token = await findGovernmentTokenById(tokenId);
  if (!token) {
    throw new NotFoundError('Token not found.');
  }

  if (token.centre_id !== operatorCentreId) {
    throw new ForbiddenError('You are not authorized to skip tokens belonging to another centre.');
  }

  const skipped = await skipGovernmentToken(tokenId);

  // Realtime Broadcast (Zero PII, Scoped Module)
  realtimeService.broadcastQueueEvent({
    businessId: operatorCentreId,
    queueId: token.counter_id,
    tokenId: token.id,
    type: 'GOVERNMENT_CITIZEN_SKIPPED',
    module: 'government',
    data: {
      tokenNumber: token.token_number,
    },
  });

  return skipped;
}

export async function processCancelToken(user, tokenId) {
  if (!tokenId) throw new ValidationError('Token ID is required.');
  const token = await findGovernmentTokenById(tokenId);
  if (!token) {
    throw new NotFoundError('Token not found.');
  }

  if (token.status === 'CANCELLED') throw new ValidationError('Token is already cancelled');
  if (token.status === 'SERVING') throw new ValidationError('Cannot cancel a token currently being served');
  if (token.status === 'COMPLETED' || token.status === 'SERVED') throw new ValidationError('Cannot cancel a completed service token');
  if (token.status !== 'WAITING') throw new ValidationError('Only waiting tokens can be cancelled');

  if (user) {
    const userPhone = user.phone;
    const isOwner = (user.userId && token.user_id && String(token.user_id) === String(user.userId)) ||
                    (userPhone && token.citizen_phone && token.citizen_phone === userPhone);
    if (!isOwner) throw new ForbiddenError('You can only cancel your own token.');
  }

  const cancelled = await cancelGovernmentToken(tokenId);

  // Realtime Broadcast (Zero PII, Scoped Module)
  realtimeService.broadcastQueueEvent({
    businessId: token.centre_id,
    queueId: token.counter_id,
    tokenId: token.id,
    type: 'GOVERNMENT_TOKEN_CANCELLED',
    module: 'government',
    data: {
      tokenNumber: token.token_number,
      status: 'CANCELLED',
    },
  });

  return cancelled;
}
