import { successResponse } from '../utils/response.js';
import { getHealthStatus } from '../services/healthService.js';

export async function handleHealthCheck(req, res, next) {
  try {
    const health = await getHealthStatus();
    return successResponse(res, 'Shewwina API is running', health, 200);
  } catch (error) {
    next(error);
  }
}
