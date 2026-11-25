import {
  processSearchCentres,
  processGetCentreDetails,
  processGetServices,
  processGetServiceDetails,
  processRegisterCentre,
  processRequestToken,
  processGetDashboard,
  processCreateCounter,
  processToggleCounter,
  processCallNext,
  processCompleteToken,
  processSkipToken,
} from '../services/governmentService.js';
import { findGovernmentTokenById } from '../models/governmentModel.js';
import { successResponse } from '../utils/response.js';

export async function handleSearchCentres(req, res, next) {
  try {
    const { search, city, pincode, category, userLat, userLng } = req.query;
    const centres = await processSearchCentres({
      search: search || '',
      city: city || '',
      pincode: pincode || '',
      category: category || '',
      userLat: userLat || null,
      userLng: userLng || null,
    });
    return successResponse(res, 'Government centres retrieved successfully', { centres, count: centres.length });
  } catch (err) {
    next(err);
  }
}

export async function handleGetCentreDetails(req, res, next) {
  try {
    const { centreId } = req.params;
    const result = await processGetCentreDetails(centreId);
    return successResponse(res, 'Centre details retrieved successfully', result);
  } catch (err) {
    next(err);
  }
}

export async function handleGetServices(req, res, next) {
  try {
    const { category } = req.query;
    const services = await processGetServices(category);
    return successResponse(res, 'Government services retrieved successfully', { services, count: services.length });
  } catch (err) {
    next(err);
  }
}

export async function handleGetServiceDetails(req, res, next) {
  try {
    const { slug } = req.params;
    const result = await processGetServiceDetails(slug);
    return successResponse(res, 'Service details retrieved successfully', result);
  } catch (err) {
    next(err);
  }
}

export async function handleRegisterCentre(req, res, next) {
  try {
    const result = await processRegisterCentre(req.body);
    return successResponse(res, 'Government Centre registered successfully', result, 201);
  } catch (err) {
    next(err);
  }
}

export async function handleRequestToken(req, res, next) {
  try {
    const token = await processRequestToken(req.body);
    return successResponse(res, 'Queue token pass issued successfully', { token }, 201);
  } catch (err) {
    next(err);
  }
}

export async function handleGetTokenStatus(req, res, next) {
  try {
    const { tokenId } = req.params;
    const token = await findGovernmentTokenById(tokenId);
    if (!token) {
      return res.status(404).json({ success: false, error: 'Token not found or expired.' });
    }
    return successResponse(res, 'Token retrieved successfully', { token });
  } catch (err) {
    next(err);
  }
}

export async function handleGetDashboard(req, res, next) {
  try {
    const requestedCentreId = req.query.centreId || null;
    const result = await processGetDashboard(req.user, requestedCentreId);
    return successResponse(res, 'Dashboard data retrieved successfully', result);
  } catch (err) {
    next(err);
  }
}

export async function handleCreateCounter(req, res, next) {
  try {
    const counter = await processCreateCounter(req.user, req.body);
    return successResponse(res, 'Counter created successfully', { counter }, 201);
  } catch (err) {
    next(err);
  }
}

export async function handleToggleCounter(req, res, next) {
  try {
    const { counterId, isOpen } = req.body;
    const counter = await processToggleCounter(req.user, counterId, isOpen);
    return successResponse(res, `Counter ${counter.counter_number} status updated`, { counter });
  } catch (err) {
    next(err);
  }
}

export async function handleCallNext(req, res, next) {
  try {
    const { counterId } = req.body;
    const token = await processCallNext(req.user, counterId);
    return successResponse(res, `Called token #${token.token_number}`, { token });
  } catch (err) {
    next(err);
  }
}

export async function handleCompleteToken(req, res, next) {
  try {
    const { tokenId } = req.body;
    const token = await processCompleteToken(req.user, tokenId);
    return successResponse(res, 'Citizen service marked completed', { token });
  } catch (err) {
    next(err);
  }
}

export async function handleSkipToken(req, res, next) {
  try {
    const { tokenId } = req.body;
    const token = await processSkipToken(req.user, tokenId);
    return successResponse(res, 'Citizen token marked skipped', { token });
  } catch (err) {
    next(err);
  }
}
