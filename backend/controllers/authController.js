import { successResponse } from '../utils/response.js';
import {
  processRegisterCustomer,
  processRegisterBusiness,
  processLogin,
  processGetMe,
} from '../services/authService.js';

export async function handleRegister(req, res, next) {
  try {
    const { name, email, phone, password } = req.body;
    const authData = await processRegisterCustomer({ name, email, phone, password });
    return successResponse(res, 'User registered successfully', authData, 201);
  } catch (error) {
    next(error);
  }
}

export async function handleRegisterBusiness(req, res, next) {
  try {
    const { name, email, phone, password, businessName, category, address, city } = req.body;
    const authData = await processRegisterBusiness({
      name,
      email,
      phone,
      password,
      businessName,
      category,
      address,
      city,
    });
    return successResponse(res, 'Business account registered successfully', authData, 201);
  } catch (error) {
    next(error);
  }
}

export async function handleLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    const authData = await processLogin({ email, password });
    return successResponse(res, 'Logged in successfully', authData, 200);
  } catch (error) {
    next(error);
  }
}

export async function handleGetMe(req, res, next) {
  try {
    const userId = req.user.userId;
    const meData = await processGetMe(userId);
    return successResponse(res, 'Current user profile retrieved', meData, 200);
  } catch (error) {
    next(error);
  }
}

export default {
  handleRegister,
  handleRegisterBusiness,
  handleLogin,
  handleGetMe,
};
