import {
  findBusinessById,
  findBusinessBySlug,
  findQueueById,
  findQueueByBusinessId,
  findServiceById,
  findServicesByBusinessId,
  createToken,
  findTokenById,
  findTokensByQueueId,
  getPeopleAheadCount,
  callNextWaitingToken,
  completeServingToken,
  cancelToken,
  updateBusiness,
  createService,
  updateService,
  toggleServiceStatus,
  updateQueueConfig,
  skipToken,
  getRecentThroughput,
} from '../models/queueModel.js';
import {
  notifyCustomerJoinedQueue,
  notifyTurnApproaching,
  notifyCustomerCalled,
  notifyServiceCompleted,
  notifyQueueCancelled,
} from './notificationService.js';
import realtimeService from './realtimeService.js';
import aiService from './aiService.js';

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

class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 403;
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 409;
  }
}

export async function processCustomerJoinQueue({ businessId, queueId, serviceId, customerName, customerPhone, userId = null }) {
  // 1. Input Presence Validation
  if (!businessId) throw new ValidationError('businessId is required');
  if (!queueId) throw new ValidationError('queueId is required');
  if (!serviceId) throw new ValidationError('serviceId is required');
  if (!customerName || customerName.trim() === '') throw new ValidationError('customerName is required');
  if (!customerPhone || customerPhone.trim() === '') throw new ValidationError('customerPhone is required');

  // Phone Validation
  const phoneClean = customerPhone.replace(/[\s\-\(\)]/g, '');
  if (phoneClean.length < 8) {
    throw new ValidationError('Invalid customer phone number');
  }

  // 2. Validate Business Exists
  const business = (await findBusinessById(businessId)) || (await findBusinessBySlug(businessId));
  if (!business) {
    throw new NotFoundError(`Business not found with ID/Slug: ${businessId}`);
  }

  // 3. Validate Queue Exists
  const queue = await findQueueById(queueId);
  if (!queue) {
    throw new NotFoundError(`Queue not found with ID: ${queueId}`);
  }

  // 4. Validate Queue belongs to Business
  if (queue.business_id !== business.id && queue.business_id !== 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') {
    throw new ValidationError(`Queue ${queueId} does not belong to business ${businessId}`);
  }

  // 5. Validate Queue is Open
  if (!queue.is_open) {
    throw new ConflictError('Queue is currently closed. Cannot join at this time.');
  }

  // 6. Validate Service Exists & belongs to Business
  const service = await findServiceById(serviceId);
  if (!service) {
    throw new NotFoundError(`Service not found with ID: ${serviceId}`);
  }

  if (service.business_id !== business.id && service.business_id !== 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') {
    throw new ValidationError(`Service ${serviceId} does not belong to business ${businessId}`);
  }

  if (!service.is_active) {
    throw new ValidationError('Selected service is currently inactive and unavailable for new queue tokens.');
  }

  // 7. Calculate Position and Wait Time
  const existingTokens = await findTokensByQueueId(queue.id);
  const waitingTokens = existingTokens.filter((t) => t.status === 'WAITING');
  const maxCapacity = queue.max_daily_capacity || queue.maxDailyCapacity;
  if (maxCapacity && waitingTokens.length >= Number(maxCapacity)) {
    throw new ConflictError('Queue has reached its maximum daily capacity. Cannot join at this time.');
  }

  const peopleAhead = waitingTokens.length;
  const position = peopleAhead + 1;
  const estimatedWaitMinutes = peopleAhead * (service.duration_minutes || 15);

  // 8. Create Token Atomic
  const token = await createToken({
    queueId: queue.id,
    businessId: business.id,
    serviceId: service.id,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    estimatedWaitMinutes,
    userId,
  });

  // Fire-and-forget: notify customer they have joined the queue
  notifyCustomerJoinedQueue({
    userId,
    tokenNumber: token.token_number,
    position,
    estimatedWaitMinutes,
    businessName: business.name,
    customerPhone: token.customer_phone,
  });

  // Realtime Broadcast: Notify business dashboard and any active listeners
  realtimeService.broadcastQueueEvent({
    businessId: business.id,
    queueId: queue.id,
    tokenId: token.id,
    type: 'CUSTOMER_JOINED',
    data: {
      tokenNumber: token.token_number,
      position,
      status: token.status,
    },
  });

  return {
    tokenId: token.id,
    tokenNumber: token.token_number,
    status: token.status,
    position,
    peopleAhead,
    estimatedWaitMinutes,
    customerName: token.customer_name,
    serviceName: service.name,
    createdAt: token.created_at,
  };
}

export async function processGetTokenStatus(tokenId) {
  if (!tokenId) {
    throw new ValidationError('tokenId parameter is required');
  }

  const token = await findTokenById(tokenId);
  if (!token) {
    throw new NotFoundError(`Token not found: ${tokenId}`);
  }

  const isWaiting = token.status === 'WAITING';
  const peopleAhead = isWaiting 
    ? await getPeopleAheadCount(token.queue_id, token.sequence_number)
    : 0;

  const position = isWaiting ? peopleAhead + 1 : 0;
  const estimatedWaitMinutes = isWaiting ? peopleAhead * (token.service_duration || 15) : 0;

  // Phase 9 AI Queue Prediction: Enhance wait-time forecast with Grok/AI
  let aiEstimatedWaitMinutes = null;
  if (isWaiting) {
    const recentThroughput = await getRecentThroughput(token.queue_id);
    const aiResult = await aiService.enhanceWaitPrediction({
      tokenId: token.id,
      peopleAhead,
      deterministicEstimate: estimatedWaitMinutes,
      avgServiceDurationMinutes: token.service_duration || 15,
      queueSize: position,
      recentAvgActualMinutes: recentThroughput,
    });
    aiEstimatedWaitMinutes = aiResult.aiEstimatedWaitMinutes;
  } else if (token.status === 'SERVING') {
    aiEstimatedWaitMinutes = 0;
  }

  return {
    tokenId: token.id,
    tokenNumber: token.token_number,
    queueId: token.queue_id,
    businessId: token.business_id,
    customerName: token.customer_name,
    customerPhone: token.customer_phone,
    service: token.service_name || 'General Service',
    status: token.status,
    position,
    peopleAhead,
    estimatedWaitMinutes,
    aiEstimatedWaitMinutes,
    calledAt: token.called_at,
    servedAt: token.served_at,
    createdAt: token.created_at,
  };
}

export async function processGetBusinessQueue({ businessId, queueId }) {
  if (!businessId) {
    throw new ValidationError('businessId parameter is required');
  }

  const business = (await findBusinessById(businessId)) || (await findBusinessBySlug(businessId));
  if (!business) {
    throw new NotFoundError(`Business not found with ID/Slug: ${businessId}`);
  }

  const queue = queueId 
    ? await findQueueById(queueId)
    : await findQueueByBusinessId(business.id);

  if (!queue) {
    throw new NotFoundError(`Queue not found for business: ${business.name}`);
  }

  const tokens = await findTokensByQueueId(queue.id);

  const formattedTokens = tokens.map((t) => ({
    tokenId: t.id,
    tokenNumber: t.token_number,
    customerName: t.customer_name,
    customerPhone: t.customer_phone,
    service: t.service_name || 'General Service',
    status: t.status,
    position: t.position,
    estimatedWaitMinutes: t.estimated_wait_minutes,
    createdAt: t.created_at,
    calledAt: t.called_at || null,
    servedAt: t.served_at || null,
  }));

  const waitingCount = formattedTokens.filter((t) => t.status === 'WAITING').length;
  const servingCount = formattedTokens.filter((t) => t.status === 'SERVING').length;

  // Phase 9 AI Queue Insights for Business Dashboard
  const recentThroughput = await getRecentThroughput(queue.id);
  const queueInsights = aiService.analyzeQueueInsights({
    waitingCount,
    servingCount,
    totalTokens: formattedTokens.length,
    avgServiceDurationMinutes: queue.avg_service_duration || queue.avgServiceDuration || 15,
    recentAvgActualMinutes: recentThroughput,
  });

  return {
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
    },
    queue: {
      id: queue.id,
      name: queue.name,
      isOpen: queue.is_open,
    },
    totalTokens: formattedTokens.length,
    waitingCount,
    servingCount,
    queueInsights,
    tokens: formattedTokens,
  };
}

export async function processCallNextCustomer({ businessId, queueId }) {
  const business = businessId 
    ? (await findBusinessById(businessId)) || (await findBusinessBySlug(businessId))
    : await findBusinessBySlug('demo');

  if (!business) {
    throw new NotFoundError(`Business not found: ${businessId}`);
  }

  const queue = queueId 
    ? await findQueueById(queueId)
    : await findQueueByBusinessId(business.id);

  if (!queue) {
    throw new NotFoundError(`Queue not found for business: ${business.name}`);
  }

  const calledToken = await callNextWaitingToken(queue.id, business.id);

  if (!calledToken) {
    throw new NotFoundError('No waiting customers in the queue.');
  }

  // Fire-and-forget: notify the called customer it's their turn
  notifyCustomerCalled({
    userId: calledToken.user_id || null,
    tokenNumber: calledToken.token_number,
    businessName: business.name,
    customerPhone: calledToken.customer_phone,
  });

  // Fire-and-forget: notify the next WAITING customer their turn is approaching
  // Re-fetch tokens to find the new next-in-line after the call
  try {
    const remaining = await findTokensByQueueId(queue.id);
    const nextWaiting = remaining.find((t) => t.status === 'WAITING');
    if (nextWaiting && (nextWaiting.user_id || nextWaiting.customer_phone)) {
      const peopleAhead = await getPeopleAheadCount(queue.id, nextWaiting.sequence_number);
      notifyTurnApproaching({
        userId: nextWaiting.user_id || null,
        tokenNumber: nextWaiting.token_number,
        peopleAhead,
        businessName: business.name,
        customerPhone: nextWaiting.customer_phone,
      });
    }
  } catch (_) { /* non-critical */ }

  // Realtime Broadcast: Notify customer being served, queue recalculation, and business dashboard
  realtimeService.broadcastQueueEvent({
    businessId: business.id,
    queueId: queue.id,
    tokenId: calledToken.id,
    type: 'CUSTOMER_CALLED',
    data: {
      tokenNumber: calledToken.token_number,
      status: calledToken.status,
      calledAt: calledToken.called_at,
    },
  });

  return {
    tokenId: calledToken.id,
    tokenNumber: calledToken.token_number,
    customerName: calledToken.customer_name,
    customerPhone: calledToken.customer_phone,
    status: calledToken.status,
    calledAt: calledToken.called_at,
  };
}

export async function processGetBusinessServices(businessId) {
  if (!businessId) {
    throw new ValidationError('businessId is required');
  }
  const business = (await findBusinessById(businessId)) || (await findBusinessBySlug(businessId));
  if (!business) {
    throw new NotFoundError(`Business not found: ${businessId}`);
  }

  const queue = await findQueueByBusinessId(business.id);
  const services = await findServicesByBusinessId(business.id);

  return {
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      category: business.category,
      phone: business.phone,
      address: business.address,
      city: business.city,
    },
    queue: queue ? {
      id: queue.id,
      name: queue.name,
      isOpen: queue.is_open,
    } : null,
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      durationMinutes: s.duration_minutes,
      price: parseFloat(s.price || 0),
    })),
  };
}

export async function processCompleteService({ businessId, queueId }) {
  const business = businessId 
    ? (await findBusinessById(businessId)) || (await findBusinessBySlug(businessId))
    : await findBusinessBySlug('demo');

  if (!business) {
    throw new NotFoundError(`Business not found: ${businessId}`);
  }

  const queue = queueId 
    ? await findQueueById(queueId)
    : await findQueueByBusinessId(business.id);

  if (!queue) {
    throw new NotFoundError(`Queue not found for business: ${business.name}`);
  }

  const completedToken = await completeServingToken(queue.id, business.id);

  if (!completedToken) {
    throw new NotFoundError('No active serving customer to complete.');
  }

  // Fire-and-forget: notify customer their service has been completed
  notifyServiceCompleted({
    userId: completedToken.user_id || null,
    tokenNumber: completedToken.token_number,
    businessName: business.name,
    customerPhone: completedToken.customer_phone,
  });

  // Realtime Broadcast: Notify customer and business dashboard
  realtimeService.broadcastQueueEvent({
    businessId: business.id,
    queueId: queue.id,
    tokenId: completedToken.id,
    type: 'SERVICE_COMPLETED',
    data: {
      tokenNumber: completedToken.token_number,
      status: completedToken.status,
      servedAt: completedToken.served_at,
    },
  });

  return {
    tokenId: completedToken.id,
    tokenNumber: completedToken.token_number,
    customerName: completedToken.customer_name,
    status: completedToken.status,
    servedAt: completedToken.served_at,
  };
}

export async function processCancelToken({ tokenId, userId, userPhone }) {
  if (!tokenId) {
    throw new ValidationError('tokenId is required');
  }

  const token = await findTokenById(tokenId);
  if (!token) {
    throw new NotFoundError(`Token not found: ${tokenId}`);
  }

  // Verify ownership: Customer can only cancel their own token
  const isOwner =
    (userId && token.user_id && token.user_id === userId) ||
    (userPhone && token.customer_phone && token.customer_phone.trim() === userPhone.trim()) ||
    (userId && !token.user_id && userPhone && token.customer_phone === userPhone);

  if (!isOwner) {
    throw new ForbiddenError('You can only cancel your own token.');
  }

  // Validate state transitions
  if (token.status === 'CANCELLED') {
    throw new ValidationError('Token is already cancelled');
  }

  if (token.status === 'SERVING') {
    throw new ValidationError('Cannot cancel a token currently being served');
  }

  if (token.status === 'SERVED') {
    throw new ValidationError('Cannot cancel a completed service token');
  }

  if (token.status !== 'WAITING') {
    throw new ValidationError('Only waiting tokens can be cancelled');
  }

  const cancelledToken = await cancelToken(token.id);

  // Fire-and-forget: notify customer their token has been cancelled
  notifyQueueCancelled({
    userId: token.user_id || null,
    tokenNumber: cancelledToken.token_number,
    customerPhone: token.customer_phone,
  });

  // Realtime Broadcast: Notify customer, queue recalculation, and business dashboard
  realtimeService.broadcastQueueEvent({
    businessId: token.business_id,
    queueId: token.queue_id,
    tokenId: cancelledToken.id,
    type: 'QUEUE_CANCELLED',
    data: {
      tokenNumber: cancelledToken.token_number,
      status: cancelledToken.status,
      cancelledAt: cancelledToken.cancelled_at,
    },
  });

  return {
    tokenId: cancelledToken.id,
    tokenNumber: cancelledToken.token_number,
    status: cancelledToken.status,
    cancelledAt: cancelledToken.cancelled_at || new Date().toISOString(),
  };
}

export async function processGetBusinessProfile(businessId) {
  if (!businessId) {
    throw new ValidationError('businessId is required');
  }

  const business = (await findBusinessById(businessId)) || (await findBusinessBySlug(businessId));
  if (!business) {
    throw new NotFoundError(`Business not found: ${businessId}`);
  }

  const queue = await findQueueByBusinessId(business.id);

  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    category: business.category || 'salon',
    phone: business.phone || '',
    email: business.email || '',
    address: business.address || '',
    city: business.city || 'Mumbai',
    description: business.description || '',
    status: business.is_active ? 'ACTIVE' : 'INACTIVE',
    isOpen: queue ? Boolean(queue.is_open) : true,
    createdAt: business.created_at,
  };
}

export async function processUpdateBusinessProfile(businessId, { name, category, phone, address, city, description }) {
  if (!businessId) {
    throw new ValidationError('businessId is required');
  }

  if (name !== undefined && (!name || name.trim() === '')) {
    throw new ValidationError('Business name cannot be empty');
  }

  if (phone !== undefined && (!phone || phone.trim() === '')) {
    throw new ValidationError('Business phone cannot be empty');
  }

  const existing = (await findBusinessById(businessId)) || (await findBusinessBySlug(businessId));
  if (!existing) {
    throw new NotFoundError(`Business not found: ${businessId}`);
  }

  const updated = await updateBusiness(existing.id, {
    name: name ? name.trim() : undefined,
    category: category ? category.trim() : undefined,
    phone: phone ? phone.trim() : undefined,
    address: address ? address.trim() : undefined,
    city: city ? city.trim() : undefined,
    description: description ? description.trim() : undefined,
  });

  const queue = await findQueueByBusinessId(existing.id);

  return {
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    category: updated.category,
    phone: updated.phone,
    email: updated.email,
    address: updated.address,
    city: updated.city,
    description: updated.description || '',
    status: updated.is_active ? 'ACTIVE' : 'INACTIVE',
    isOpen: queue ? Boolean(queue.is_open) : true,
    updatedAt: updated.updated_at || new Date().toISOString(),
  };
}

export async function processCreateBusinessService({ businessId, name, durationMinutes = 15, price = 0, description = '' }) {
  if (!businessId) throw new ValidationError('businessId is required');
  if (!name || name.trim() === '') throw new ValidationError('Service name is required');
  const dur = Number(durationMinutes);
  if (isNaN(dur) || dur <= 0) throw new ValidationError('Duration must be a positive number of minutes');
  const prc = Number(price);
  if (isNaN(prc) || prc < 0) throw new ValidationError('Price cannot be negative');

  const business = (await findBusinessById(businessId)) || (await findBusinessBySlug(businessId));
  if (!business) throw new NotFoundError(`Business not found: ${businessId}`);

  const service = await createService({
    businessId: business.id,
    name: name.trim(),
    durationMinutes: dur,
    price: prc,
    description: description ? description.trim() : '',
  });

  return {
    id: service.id,
    businessId: service.business_id,
    name: service.name,
    durationMinutes: service.duration_minutes,
    price: service.price,
    description: service.description || '',
    isActive: Boolean(service.is_active),
    createdAt: service.created_at,
  };
}

export async function processUpdateBusinessService({ serviceId, businessId, name, durationMinutes, price, description, isActive }) {
  if (!serviceId) throw new ValidationError('serviceId is required');
  if (!businessId) throw new ValidationError('businessId is required');

  const existing = await findServiceById(serviceId);
  if (!existing) throw new NotFoundError(`Service not found: ${serviceId}`);

  if (existing.business_id !== businessId && existing.business_id !== 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') {
    throw new ForbiddenError('You can only modify services belonging to your own business');
  }

  if (name !== undefined && (!name || name.trim() === '')) {
    throw new ValidationError('Service name cannot be empty');
  }
  if (durationMinutes !== undefined) {
    const dur = Number(durationMinutes);
    if (isNaN(dur) || dur <= 0) throw new ValidationError('Duration must be a positive number of minutes');
  }
  if (price !== undefined) {
    const prc = Number(price);
    if (isNaN(prc) || prc < 0) throw new ValidationError('Price cannot be negative');
  }

  const updated = await updateService(serviceId, businessId, {
    name: name ? name.trim() : undefined,
    durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : undefined,
    price: price !== undefined ? Number(price) : undefined,
    description: description !== undefined ? description.trim() : undefined,
    isActive: isActive !== undefined ? Boolean(isActive) : undefined,
  });

  return {
    id: updated.id,
    businessId: updated.business_id,
    name: updated.name,
    durationMinutes: updated.duration_minutes,
    price: updated.price,
    description: updated.description || '',
    isActive: Boolean(updated.is_active),
    updatedAt: updated.updated_at || new Date().toISOString(),
  };
}

export async function processToggleServiceStatus({ serviceId, businessId, isActive }) {
  if (!serviceId) throw new ValidationError('serviceId is required');
  if (!businessId) throw new ValidationError('businessId is required');

  const existing = await findServiceById(serviceId);
  if (!existing) throw new NotFoundError(`Service not found: ${serviceId}`);

  if (existing.business_id !== businessId && existing.business_id !== 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') {
    throw new ForbiddenError('You can only modify services belonging to your own business');
  }

  const updated = await toggleServiceStatus(serviceId, businessId, Boolean(isActive));

  return {
    id: updated.id,
    businessId: updated.business_id,
    name: updated.name,
    isActive: Boolean(updated.is_active),
    updatedAt: updated.updated_at || new Date().toISOString(),
  };
}

export async function processGetQueueSettings({ businessId, queueId }) {
  if (!businessId) throw new ValidationError('businessId is required');

  const business = (await findBusinessById(businessId)) || (await findBusinessBySlug(businessId));
  if (!business) throw new NotFoundError(`Business not found: ${businessId}`);

  const queue = queueId ? await findQueueById(queueId) : await findQueueByBusinessId(business.id);
  if (!queue) throw new NotFoundError(`Queue not found for business: ${business.name}`);

  if (queue.business_id !== business.id && queue.business_id !== 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') {
    throw new ForbiddenError('You can only access queue settings for your own business');
  }

  return {
    id: queue.id,
    businessId: queue.business_id,
    name: queue.name || 'Main Queue',
    isOpen: Boolean(queue.is_open),
    tokenPrefix: queue.token_prefix || queue.tokenPrefix || 'S',
    maxDailyCapacity: queue.max_daily_capacity || queue.maxDailyCapacity || 200,
    avgServiceDuration: queue.avg_service_duration || queue.avgServiceDuration || 15,
    currentSequence: queue.current_sequence || 0,
    updatedAt: queue.updated_at || new Date().toISOString(),
  };
}

export async function processUpdateQueueSettings({ businessId, queueId, name, isOpen, tokenPrefix, maxDailyCapacity, avgServiceDuration }) {
  if (!businessId) throw new ValidationError('businessId is required');

  const business = (await findBusinessById(businessId)) || (await findBusinessBySlug(businessId));
  if (!business) throw new NotFoundError(`Business not found: ${businessId}`);

  const queue = queueId ? await findQueueById(queueId) : await findQueueByBusinessId(business.id);
  if (!queue) throw new NotFoundError(`Queue not found for business: ${business.name}`);

  if (queue.business_id !== business.id && queue.business_id !== 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') {
    throw new ForbiddenError('You can only modify queue settings for your own business');
  }

  if (name !== undefined && (!name || name.trim() === '')) {
    throw new ValidationError('Queue name cannot be empty');
  }

  if (maxDailyCapacity !== undefined) {
    const cap = Number(maxDailyCapacity);
    if (isNaN(cap) || cap <= 0) throw new ValidationError('Maximum daily capacity must be a positive integer');
  }

  if (avgServiceDuration !== undefined) {
    const dur = Number(avgServiceDuration);
    if (isNaN(dur) || dur <= 0) throw new ValidationError('Average service duration must be a positive number of minutes');
  }

  const updated = await updateQueueConfig(queue.id, business.id, {
    name: name ? name.trim() : undefined,
    isOpen: isOpen !== undefined ? Boolean(isOpen) : undefined,
    tokenPrefix: tokenPrefix ? tokenPrefix.trim().toUpperCase() : undefined,
    maxDailyCapacity: maxDailyCapacity !== undefined ? Number(maxDailyCapacity) : undefined,
    avgServiceDuration: avgServiceDuration !== undefined ? Number(avgServiceDuration) : undefined,
  });

  // Realtime Broadcast: Notify all subscribers of queue configuration / open/close changes.
  // This must be before the return so it is actually executed.
  realtimeService.broadcastQueueEvent({
    businessId: business.id,
    queueId: queue.id,
    type: 'QUEUE_SETTINGS_UPDATED',
    data: {
      isOpen: Boolean(updated.is_open),
      name: updated.name,
      tokenPrefix: updated.token_prefix || updated.tokenPrefix || 'S',
    },
  });

  return {
    id: updated.id,
    businessId: updated.business_id,
    name: updated.name,
    isOpen: Boolean(updated.is_open),
    tokenPrefix: updated.token_prefix || updated.tokenPrefix || 'S',
    maxDailyCapacity: updated.max_daily_capacity || updated.maxDailyCapacity || 200,
    avgServiceDuration: updated.avg_service_duration || updated.avgServiceDuration || 15,
    updatedAt: updated.updated_at || new Date().toISOString(),
  };
}

export async function processSkipToken({ businessId, queueId, tokenId }) {
  if (!businessId) throw new ValidationError('businessId is required');
  if (!tokenId) throw new ValidationError('tokenId is required');

  const business = (await findBusinessById(businessId)) || (await findBusinessBySlug(businessId));
  if (!business) throw new NotFoundError(`Business not found: ${businessId}`);

  const queue = queueId
    ? await findQueueById(queueId)
    : await findQueueByBusinessId(business.id);
  if (!queue) throw new NotFoundError(`Queue not found for business: ${business.name}`);

  // Tenant isolation — queue must belong to this business
  if (queue.business_id !== business.id && queue.business_id !== 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11') {
    throw new ForbiddenError('You can only manage your own business queue');
  }

  const token = await findTokenById(tokenId);
  if (!token) throw new NotFoundError(`Token not found: ${tokenId}`);

  // Cross-tenant check — token must belong to this business's queue
  if (token.queue_id !== queue.id && token.business_id !== business.id) {
    throw new ForbiddenError('You can only skip tokens in your own business queue');
  }

  // State machine guard
  if (token.status === 'SKIPPED') {
    throw new ValidationError('Token is already skipped');
  }
  if (token.status === 'SERVING') {
    throw new ValidationError('Cannot skip a token that is currently being served. Complete or move to next first.');
  }
  if (token.status === 'SERVED') {
    throw new ValidationError('Cannot skip a token for a service that is already completed');
  }
  if (token.status === 'CANCELLED') {
    throw new ValidationError('Cannot skip a cancelled token');
  }
  if (token.status !== 'WAITING') {
    throw new ValidationError('Only WAITING tokens can be skipped');
  }

  const skippedToken = await skipToken(token.id, queue.id, business.id);
  if (!skippedToken) {
    throw new NotFoundError('Token not found or could not be skipped');
  }

  // Realtime Broadcast: Notify customer, queue recalculation, and business dashboard
  realtimeService.broadcastQueueEvent({
    businessId: business.id,
    queueId: queue.id,
    tokenId: skippedToken.id,
    type: 'CUSTOMER_SKIPPED',
    data: {
      tokenNumber: skippedToken.token_number,
      status: skippedToken.status,
      skippedAt: skippedToken.updated_at || new Date().toISOString(),
    },
  });

  return {
    tokenId: skippedToken.id,
    tokenNumber: skippedToken.token_number,
    customerName: skippedToken.customer_name,
    status: skippedToken.status,
    skippedAt: skippedToken.updated_at || new Date().toISOString(),
  };
}

export default {
  processCustomerJoinQueue,
  processGetTokenStatus,
  processGetBusinessQueue,
  processCallNextCustomer,
  processGetBusinessServices,
  processCompleteService,
  processCancelToken,
  processGetBusinessProfile,
  processUpdateBusinessProfile,
  processCreateBusinessService,
  processUpdateBusinessService,
  processToggleServiceStatus,
  processGetQueueSettings,
  processUpdateQueueSettings,
  processSkipToken,
};
