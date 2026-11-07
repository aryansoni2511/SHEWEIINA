import { Router } from 'express';
import {
  handleRegisterHospital,
  handleRegisterPatient,
  handleSearchHospitals,
  handleGetHospitalDetails,
  handleCreateDepartment,
  handleUpdateDepartment,
  handleCreateDoctor,
  handleRequestOpdToken,
  handleCallNextPatient,
  handleCompleteConsultation,
  handleSkipPatientToken,
  handleToggleDoctorQueue,
  handleGetHospitalDashboard,
  handleGetHospitalToken,
} from '../controllers/hospitalController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// ─── Public Hospital & OPD Discovery Endpoints ──────────────────────────────
router.get('/search', handleSearchHospitals);
router.get('/details/:hospitalId', handleGetHospitalDetails);
router.get('/token/:tokenId', handleGetHospitalToken);
router.post('/register-hospital', handleRegisterHospital);
router.post('/register-patient', handleRegisterPatient);
router.post('/token/join', handleRequestOpdToken);

// ─── Protected Hospital Administration Endpoints ───────────────────────────
// Requires valid JWT and BUSINESS / Hospital Admin role
router.get('/dashboard', authenticateToken, requireRole('BUSINESS'), handleGetHospitalDashboard);
router.post('/departments', authenticateToken, requireRole('BUSINESS'), handleCreateDepartment);
router.put('/departments/:departmentId', authenticateToken, requireRole('BUSINESS'), handleUpdateDepartment);
router.post('/doctors', authenticateToken, requireRole('BUSINESS'), handleCreateDoctor);

// ─── Doctor & Queue Operations ─────────────────────────────────────────────
router.post('/queue/next', authenticateToken, requireRole('BUSINESS'), handleCallNextPatient);
router.post('/queue/complete', authenticateToken, requireRole('BUSINESS'), handleCompleteConsultation);
router.post('/queue/skip', authenticateToken, requireRole('BUSINESS'), handleSkipPatientToken);
router.post('/queue/toggle', authenticateToken, requireRole('BUSINESS'), handleToggleDoctorQueue);

export default router;

