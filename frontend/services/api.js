/**
 * Shewwina Frontend API Utility Service
 * Centralized API client wrapper with standardized error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const AUTH_TOKEN_KEY = 'shewwina_token';

export function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getStoredToken();

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = result?.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = result;
      throw error;
    }

    return result;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Unable to connect to Shewwina API backend. Ensure the backend server is running.');
    }
    throw error;
  }
}

/**
 * Auth API Endpoints
 */
export async function loginApi({ email, password }) {
  return request('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerCustomerApi({ name, email, phone, password }) {
  return request('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, phone, password }),
  });
}

export async function registerBusinessApi({ name, email, phone, password, businessName, category, address, city }) {
  return request('/api/v1/auth/register-business', {
    method: 'POST',
    body: JSON.stringify({ name, email, phone, password, businessName, category, address, city }),
  });
}

export async function getMeApi() {
  return request('/api/v1/auth/me', { method: 'GET' });
}

/**
 * Customer Dashboard API Endpoints
 */
export async function getCustomerProfileApi() {
  return request('/api/v1/customer/profile', { method: 'GET' });
}

export async function getCustomerActiveTokenApi() {
  return request('/api/v1/customer/active-token', { method: 'GET' });
}

export async function getCustomerTokensApi() {
  return request('/api/v1/customer/tokens', { method: 'GET' });
}

/**
 * Customer Notifications API Endpoints
 */
export async function getCustomerNotificationsApi() {
  return request('/api/v1/customer/notifications', { method: 'GET' });
}

export async function markNotificationReadApi(notificationId) {
  return request(`/api/v1/customer/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsReadApi() {
  return request('/api/v1/customer/notifications/read-all', {
    method: 'PATCH',
  });
}

/**
 * Health Check API
 */
export async function checkHealth() {
  return request('/api/health', { method: 'GET' });
}

/**
 * Fetch Business Services & Queue Information
 */
export async function getBusinessServices(businessId = 'demo', includeInactive = false) {
  const params = [`businessId=${encodeURIComponent(businessId)}`];
  if (includeInactive) params.push('includeInactive=true');
  return request(`/api/v1/business/services?${params.join('&')}`, { method: 'GET' });
}

/**
 * Customer Join Queue API
 */
export async function joinQueue({ businessId, queueId, serviceId, customerName, customerPhone }) {
  return request('/api/v1/queue/join', {
    method: 'POST',
    body: JSON.stringify({
      businessId,
      queueId,
      serviceId,
      customerName,
      customerPhone,
    }),
  });
}

/**
 * Customer Token Live Status API
 */
export async function getTokenStatus(tokenId) {
  return request(`/api/v1/queue/status/${encodeURIComponent(tokenId)}`, { method: 'GET' });
}

/**
 * Business View Active Queue API
 */
export async function getBusinessQueue(businessId = '', queueId = '') {
  let url = '/api/v1/business/queue';
  const params = [];
  if (businessId) params.push(`businessId=${encodeURIComponent(businessId)}`);
  if (queueId) params.push(`queueId=${encodeURIComponent(queueId)}`);
  if (params.length > 0) url += `?${params.join('&')}`;

  return request(url, { method: 'GET' });
}

/**
 * Business Call Next Customer API
 */
export async function callNextCustomer(businessId, queueId) {
  return request('/api/v1/business/queue/next', {
    method: 'POST',
    body: JSON.stringify({
      ...(businessId ? { businessId } : {}),
      ...(queueId ? { queueId } : {}),
    }),
  });
}

/**
 * Business Complete Current Service API
 */
export async function completeService(businessId, queueId) {
  return request('/api/v1/business/queue/complete', {
    method: 'POST',
    body: JSON.stringify({
      ...(businessId ? { businessId } : {}),
      ...(queueId ? { queueId } : {}),
    }),
  });
}

/**
 * Business Skip Token API
 */
export async function skipTokenApi({ businessId, queueId, tokenId }) {
  return request('/api/v1/business/queue/skip', {
    method: 'POST',
    body: JSON.stringify({
      ...(businessId ? { businessId } : {}),
      ...(queueId ? { queueId } : {}),
      ...(tokenId ? { tokenId } : {}),
    }),
  });
}

/**
 * Customer Cancel Queue Token API
 */
export async function cancelQueueTokenApi(tokenId) {
  return request('/api/v1/queue/cancel', {
    method: 'POST',
    body: JSON.stringify({ tokenId }),
  });
}

/**
 * Business Profile API Endpoints
 */
export async function getBusinessProfileApi() {
  return request('/api/v1/business/profile', { method: 'GET' });
}

export async function updateBusinessProfileApi({ name, category, phone, address, city, description }) {
  return request('/api/v1/business/profile', {
    method: 'PUT',
    body: JSON.stringify({ name, category, phone, address, city, description }),
  });
}

/**
 * Business Service Management API Endpoints
 */
export async function createBusinessServiceApi({ name, durationMinutes, price, description }) {
  return request('/api/v1/business/services', {
    method: 'POST',
    body: JSON.stringify({ name, durationMinutes, price, description }),
  });
}

export async function updateBusinessServiceApi(serviceId, { name, durationMinutes, price, description, isActive }) {
  return request(`/api/v1/business/services/${serviceId}`, {
    method: 'PUT',
    body: JSON.stringify({ name, durationMinutes, price, description, isActive }),
  });
}

export async function toggleServiceStatusApi(serviceId, isActive) {
  return request(`/api/v1/business/services/${serviceId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

/**
 * Queue Configuration API Endpoints
 */
export async function getQueueSettingsApi() {
  return request('/api/v1/business/queue/settings', { method: 'GET' });
}

export async function updateQueueSettingsApi({
  name,
  isOpen,
  tokenPrefix,
  maxDailyCapacity,
  avgServiceDuration,
  smsNotificationsEnabled,
  whatsappNotificationsEnabled,
  turnAlertThreshold,
}) {
  return request('/api/v1/business/queue/settings', {
    method: 'PUT',
    body: JSON.stringify({
      name,
      isOpen,
      tokenPrefix,
      maxDailyCapacity,
      avgServiceDuration,
      smsNotificationsEnabled,
      whatsappNotificationsEnabled,
      turnAlertThreshold,
    }),
  });
}

export async function testMessagingAlertApi({ channel = 'SMS', testPhone }) {
  return request('/api/v1/business/messaging/test', {
    method: 'POST',
    body: JSON.stringify({ channel, testPhone }),
  });
}

/**
 * Public Waiting Room Display API (Phase 12)
 * Read-only, unauthenticated endpoint with strict customer PII masking.
 */
export async function getPublicQueueDisplayApi(businessId) {
  return request(`/api/v1/queue/display/${encodeURIComponent(businessId)}`, {
    method: 'GET',
  });
}

export default {
  getStoredToken,
  setStoredToken,
  loginApi,
  registerCustomerApi,
  registerBusinessApi,
  getMeApi,
  getCustomerProfileApi,
  getCustomerActiveTokenApi,
  getCustomerTokensApi,
  getCustomerNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  getBusinessProfileApi,
  updateBusinessProfileApi,
  createBusinessServiceApi,
  updateBusinessServiceApi,
  toggleServiceStatusApi,
  getQueueSettingsApi,
  updateQueueSettingsApi,
  testMessagingAlertApi,
  getPublicQueueDisplayApi,
  checkHealth,
  getBusinessServices,
  joinQueue,
  getTokenStatus,
  cancelQueueTokenApi,
  getBusinessQueue,
  callNextCustomer,
  completeService,
  skipTokenApi,
};
