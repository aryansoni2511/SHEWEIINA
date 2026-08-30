import { successResponse } from '../utils/response.js';
import {
  processGetCustomerProfile,
  processGetActiveToken,
  processGetCustomerTokenHistory,
} from '../services/customerService.js';

export async function handleGetCustomerProfile(req, res, next) {
  try {
    const userId = req.user.userId;
    const profile = await processGetCustomerProfile(userId);
    return successResponse(res, 'Customer profile retrieved', profile, 200);
  } catch (error) {
    next(error);
  }
}

export async function handleGetActiveToken(req, res, next) {
  try {
    const userId = req.user.userId;
    const activeToken = await processGetActiveToken(userId);
    return successResponse(res, 'Customer active token retrieved', activeToken, 200);
  } catch (error) {
    next(error);
  }
}

export async function handleGetCustomerTokens(req, res, next) {
  try {
    const userId = req.user.userId;
    const history = await processGetCustomerTokenHistory(userId);
    return successResponse(res, 'Customer token history retrieved', history, 200);
  } catch (error) {
    next(error);
  }
}

export default {
  handleGetCustomerProfile,
  handleGetActiveToken,
  handleGetCustomerTokens,
};
