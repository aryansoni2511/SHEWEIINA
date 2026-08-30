import { Router } from 'express';
import {
  handleRegister,
  handleRegisterBusiness,
  handleLogin,
  handleGetMe,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', handleRegister);
router.post('/register-business', handleRegisterBusiness);
router.post('/login', handleLogin);
router.get('/me', authenticateToken, handleGetMe);

export default router;
