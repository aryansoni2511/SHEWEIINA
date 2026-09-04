import { successResponse, errorResponse } from '../utils/response.js';
import { getHealthStatus } from '../services/healthService.js';

export async function handleHealthCheck(req, res, next) {
  try {
    const health = await getHealthStatus();
    if (process.env.NODE_ENV === 'production' && !health.database.connected) {
      return res.status(503).json({
        success: false,
        message: 'Shewwina API is degraded: Database unavailable',
        data: health,
      });
    }
    return successResponse(res, 'Shewwina API is running', health, 200);
  } catch (error) {
    next(error);
  }
}
