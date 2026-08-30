import { successResponse } from '../utils/response.js';
import {
  processCustomerJoinQueue,
  processGetTokenStatus,
  processCancelToken,
} from '../services/queueService.js';

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function handleJoinQueue(req, res, next) {
  try {
    const { businessId, queueId, serviceId, customerName, customerPhone } = req.body;
    let userId = req.user?.userId || null;

    if (!userId) {
      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          userId = decoded.userId || null;
        } catch (e) {}
      }
    }

    const tokenData = await processCustomerJoinQueue({
      businessId,
      queueId,
      serviceId,
      customerName,
      customerPhone,
      userId,
    });
    return successResponse(res, 'Successfully joined queue', tokenData, 201);
  } catch (error) {
    next(error);
  }
}

export async function handleGetTokenStatus(req, res, next) {
  try {
    const { tokenId } = req.params;
    const statusData = await processGetTokenStatus(tokenId);
    return successResponse(res, 'Token status retrieved successfully', statusData, 200);
  } catch (error) {
    next(error);
  }
}

export async function handleCancelToken(req, res, next) {
  try {
    const tokenId = req.body?.tokenId || req.params?.tokenId;
    const userId = req.user?.userId;
    const userPhone = req.user?.phone;

    const cancelData = await processCancelToken({ tokenId, userId, userPhone });
    return successResponse(res, 'Token cancelled successfully', cancelData, 200);
  } catch (error) {
    next(error);
  }
}
