import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  findUserByEmail,
  findUserById,
  createUser,
  createBusinessWithOwner,
  findBusinessById,
} from '../models/queueModel.js';

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

export async function processRegisterCustomer({ name, email, phone, password }) {
  if (!name || name.trim() === '') throw new ValidationError('Name is required');
  if (!email || email.trim() === '') throw new ValidationError('Email is required');
  if (!password || password.length < 6) throw new ValidationError('Password must be at least 6 characters');

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ConflictError('A user with this email address already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await createUser({
    name: name.trim(),
    email: email.trim(),
    phone: phone ? phone.trim() : null,
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
  businessName,
  category = 'salon',
  address = '',
  city = '',
}) {
  if (!name || name.trim() === '') throw new ValidationError('Owner name is required');
  if (!email || email.trim() === '') throw new ValidationError('Email is required');
  if (!password || password.length < 6) throw new ValidationError('Password must be at least 6 characters');
  if (!businessName || businessName.trim() === '') throw new ValidationError('Business name is required');

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ConflictError('A user with this email address already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const { user, business, queue } = await createBusinessWithOwner({
    ownerName: name.trim(),
    email: email.trim(),
    phone: phone ? phone.trim() : '',
    passwordHash,
    businessName: businessName.trim(),
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
    throw new UnauthorizedError('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
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
    business: business ? { id: business.id, name: business.name, slug: business.slug } : null,
  };
}

export default {
  processRegisterCustomer,
  processRegisterBusiness,
  processLogin,
  processGetMe,
};
