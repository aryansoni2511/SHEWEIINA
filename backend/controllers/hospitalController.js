import {
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
} from '../services/hospitalService.js';
import { findHospitalTokenById } from '../models/hospitalModel.js';
import { successResponse, errorResponse } from '../utils/response.js';

export async function handleRegisterHospital(req, res, next) {
  try {
    const result = await processRegisterHospital(req.body);
    return successResponse(res, 'Hospital registered successfully', result, 201);
  } catch (err) {
    next(err);
  }
}

export async function handleRegisterPatient(req, res, next) {
  try {
    const result = await processRegisterPatient({
      ...req.body,
      userId: req.user?.userId || null,
    });
    return successResponse(res, result.isNew ? 'Patient registered successfully' : 'Patient record retrieved', result, 200);
  } catch (err) {
    next(err);
  }
}

export async function handleSearchHospitals(req, res, next) {
  try {
    const { search, city, pincode, facility, type, userLat, userLng } = req.query;
    const result = await processSearchHospitals({
      search: search || '',
      city: city || '',
      pincode: pincode || '',
      facility: facility || '',
      hospitalType: type || '',
      userLat: userLat || null,
      userLng: userLng || null,
    });
    return successResponse(res, 'Hospitals fetched successfully', { hospitals: result, count: result.length });
  } catch (err) {
    next(err);
  }
}

export async function handleGetHospitalDetails(req, res, next) {
  try {
    const { hospitalId } = req.params;
    const result = await processGetHospitalDetails(hospitalId);
    return successResponse(res, 'Hospital details fetched successfully', result);
  } catch (err) {
    next(err);
  }
}

export async function handleCreateDepartment(req, res, next) {
  try {
    const hospitalId = req.user?.hospitalId || req.user?.businessId || req.body.hospitalId;
    const result = await processCreateDepartment({
      ...req.body,
      hospitalId,
    });
    return successResponse(res, 'Department created successfully', { department: result }, 201);
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateDepartment(req, res, next) {
  try {
    const { departmentId } = req.params;
    const hospitalId = req.user?.hospitalId || req.user?.businessId || req.body.hospitalId;
    const result = await processUpdateDepartment({
      id: departmentId,
      hospitalId,
      ...req.body,
    });
    return successResponse(res, 'Department updated successfully', { department: result });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateDoctor(req, res, next) {
  try {
    const hospitalId = req.user?.hospitalId || req.user?.businessId || req.body.hospitalId;
    const result = await processCreateDoctor({
      ...req.body,
      hospitalId,
    });
    return successResponse(res, 'Doctor and OPD queue registered successfully', result, 201);
  } catch (err) {
    next(err);
  }
}

export async function handleRequestOpdToken(req, res, next) {
  try {
    const result = await processRequestOpdToken({
      ...req.body,
      userId: req.user?.userId || null,
    });
    return successResponse(res, 'OPD token confirmed. Please proceed to the waiting area.', result, 201);
  } catch (err) {
    next(err);
  }
}

export async function handleCallNextPatient(req, res, next) {
  try {
    const hospitalId = req.user?.hospitalId || req.user?.businessId || req.body.hospitalId;
    const { doctorId } = req.body;
    const result = await processCallNextPatient({ hospitalId, doctorId });
    return successResponse(res, 'Next patient called successfully', result);
  } catch (err) {
    next(err);
  }
}

export async function handleCompleteConsultation(req, res, next) {
  try {
    const hospitalId = req.user?.hospitalId || req.user?.businessId || req.body.hospitalId;
    const { doctorId } = req.body;
    const result = await processCompleteConsultation({ hospitalId, doctorId });
    return successResponse(res, 'Consultation marked as completed', { token: result });
  } catch (err) {
    next(err);
  }
}

export async function handleSkipPatientToken(req, res, next) {
  try {
    const hospitalId = req.user?.hospitalId || req.user?.businessId || req.body.hospitalId;
    const { doctorId, tokenId } = req.body;
    const result = await processSkipPatientToken({ hospitalId, doctorId, tokenId });
    return successResponse(res, 'Patient token skipped', { token: result });
  } catch (err) {
    next(err);
  }
}

export async function handleToggleDoctorQueue(req, res, next) {
  try {
    const hospitalId = req.user?.hospitalId || req.user?.businessId || req.body.hospitalId;
    const { doctorId, isOpen } = req.body;
    const result = await processToggleDoctorQueue({ hospitalId, doctorId, isOpen });
    return successResponse(res, `Doctor OPD queue is now ${isOpen ? 'OPEN' : 'PAUSED'}`, { queue: result });
  } catch (err) {
    next(err);
  }
}

export async function handleGetHospitalDashboard(req, res, next) {
  try {
    const hospitalId = req.user?.hospitalId || req.user?.businessId || req.query.hospitalId;
    const result = await processGetHospitalDashboard(hospitalId);
    return successResponse(res, 'Hospital dashboard fetched successfully', result);
  } catch (err) {
    next(err);
  }
}

export async function handleGetHospitalToken(req, res, next) {
  try {
    const { tokenId } = req.params;
    const token = await findHospitalTokenById(tokenId);
    if (!token) {
      return errorResponse(res, 'Hospital token not found', 404);
    }
    return successResponse(res, 'Token retrieved successfully', { token });
  } catch (err) {
    next(err);
  }
}
