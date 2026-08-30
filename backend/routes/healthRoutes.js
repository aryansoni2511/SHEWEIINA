import { Router } from 'express';
import { handleHealthCheck } from '../controllers/healthController.js';

const router = Router();

router.get('/health', handleHealthCheck);

export default router;
