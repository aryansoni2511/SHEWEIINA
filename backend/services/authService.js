import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  findUserByEmail,
  findUserById,
  createUser,
  createBusinessWithOwner,
  findBusinessById,
} from '../models/queueModel.js';
import { validateName, validateBusinessName, validatePhone } from '../utils/validation.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

class ValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 401;
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 409;
  }
}

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.business_id || null,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export async function processRegisterCustomer({ name, email, phone, password, confirmPassword }) {
  // Name validation
  const nameCheck = validateName(name);
  if (!nameCheck.valid) throw new ValidationError(nameCheck.message);

  if (!email || email.trim() === '') throw new ValidationError('Email is required');

  // Password validation — minimum 8 characters
  if (!password || password.length < 8) throw new ValidationError('Password must be at least 8 characters');

  // Confirm password check (if provided by caller)
  if (confirmPassword !== undefined && password !== confirmPassword) {
    throw new ValidationError('Passwords do not match');
  }

  // Phone validation (required for customer registration)
  if (!phone || String(phone).trim() === '') throw new ValidationError('Phone number is required.');
  const phoneCheck = validatePhone(String(phone).trim());
  if (!phoneCheck.valid) throw new ValidationError(phoneCheck.message);

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ConflictError('A user with this email address already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await createUser({
    name: nameCheck.normalized,
    email: email.trim().toLowerCase(),
    phone: String(phone).trim(),
    passwordHash,
    role: 'CUSTOMER',
  });

  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      businessId: user.business_id,
    },
    token,
  };
}

export async function processRegisterBusiness({
  name,
  email,
  phone,
  password,
  confirmPassword,
  businessName,
  category = 'salon',
  address = '',
  city = '',
}) {
  // Owner name validation
  const ownerNameCheck = validateName(name);
  if (!ownerNameCheck.valid) throw new ValidationError(ownerNameCheck.message);

  // Business name validation
  const bizNameCheck = validateBusinessName(businessName);
  if (!bizNameCheck.valid) throw new ValidationError(bizNameCheck.message);

  if (!email || email.trim() === '') throw new ValidationError('Email is required');

  // Password validation — minimum 8 characters
  if (!password || password.length < 8) throw new ValidationError('Password must be at least 8 characters');

  // Confirm password check (if provided by caller)
  if (confirmPassword !== undefined && password !== confirmPassword) {
    throw new ValidationError('Passwords do not match');
  }

  // Phone validation (required for business registration)
  if (!phone || String(phone).trim() === '') throw new ValidationError('Phone number is required.');
  const ownerPhoneCheck = validatePhone(String(phone).trim());
  if (!ownerPhoneCheck.valid) throw new ValidationError(ownerPhoneCheck.message);

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ConflictError('A user with this email address already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const { user, business, queue } = await createBusinessWithOwner({
    ownerName: ownerNameCheck.normalized,
    email: email.trim().toLowerCase(),
    phone: String(phone).trim(),
    passwordHash,
    businessName: bizNameCheck.normalized,
    category,
    address,
    city,
  });

  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      businessId: user.business_id,
    },
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
    },
    queue: {
      id: queue.id,
      name: queue.name,
    },
    token,
  };
}

export async function processLogin({ email, password }) {
  if (!email || email.trim() === '') throw new ValidationError('Email is required');
  if (!password) throw new ValidationError('Password is required');

  const user = await findUserByEmail(email);
  if (!user) {
    // Generic error — do not reveal whether the email exists
    throw new UnauthorizedError('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    // Generic error — do not reveal that the email was found
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      businessId: user.business_id,
      // password_hash is intentionally omitted
    },
    token,
  };
}

export async function processGetMe(userId) {
  if (!userId) throw new ValidationError('User ID is required');

  const user = await findUserById(userId);
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  let business = null;
  if (user.business_id) {
    business = await findBusinessById(user.business_id);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    businessId: user.business_id,
    // password_hash intentionally omitted
    business: business ? { id: business.id, name: business.name, slug: business.slug } : null,
  };
}

export default {
  processRegisterCustomer,
  processRegisterBusiness,
  processLogin,
  processGetMe,
};
