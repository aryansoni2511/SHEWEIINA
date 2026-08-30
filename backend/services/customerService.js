import {
  findUserById,
  findTokensByUserId,
  findActiveTokenByUserId,
  getPeopleAheadCount,
} from '../models/queueModel.js';

class ValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 404;
  }
}

export async function processGetCustomerProfile(userId) {
  if (!userId) throw new ValidationError('User ID is required');

  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError(`User not found with ID: ${userId}`);
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.created_at,
  };
}

export async function processGetActiveToken(userId) {
  if (!userId) throw new ValidationError('User ID is required');

  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError(`User not found with ID: ${userId}`);
  }

  const activeToken = await findActiveTokenByUserId(user.id, user.phone);
  if (!activeToken) {
    return null;
  }

  const isWaiting = activeToken.status === 'WAITING';
  const peopleAhead = isWaiting
    ? await getPeopleAheadCount(activeToken.queue_id, activeToken.sequence_number)
    : 0;

  const position = isWaiting ? peopleAhead + 1 : 0;
  const estimatedWaitMinutes = isWaiting ? peopleAhead * (activeToken.service_duration || 15) : 0;

  return {
    tokenId: activeToken.id,
    tokenNumber: activeToken.token_number,
    businessId: activeToken.business_id,
    businessName: activeToken.business_name || 'Shewwina Business',
    serviceId: activeToken.service_id,
    serviceName: activeToken.service_name || 'General Service',
    customerName: activeToken.customer_name,
    customerPhone: activeToken.customer_phone,
    status: activeToken.status,
    position,
    peopleAhead,
    estimatedWaitMinutes,
    createdAt: activeToken.created_at,
    calledAt: activeToken.called_at || null,
  };
}

export async function processGetCustomerTokenHistory(userId) {
  if (!userId) throw new ValidationError('User ID is required');

  const user = await findUserById(userId);
  if (!user) {
    throw new NotFoundError(`User not found with ID: ${userId}`);
  }

  const tokens = await findTokensByUserId(user.id, user.phone);

  return tokens.map((t) => ({
    tokenId: t.id,
    tokenNumber: t.token_number,
    businessId: t.business_id,
    businessName: t.business_name || 'Shewwina Business',
    serviceId: t.service_id,
    serviceName: t.service_name || 'General Service',
    customerName: t.customer_name,
    customerPhone: t.customer_phone,
    status: t.status,
    createdAt: t.created_at,
    calledAt: t.called_at || null,
    servedAt: t.served_at || null,
    cancelledAt: t.cancelled_at || null,
  }));
}

export default {
  processGetCustomerProfile,
  processGetActiveToken,
  processGetCustomerTokenHistory,
};
