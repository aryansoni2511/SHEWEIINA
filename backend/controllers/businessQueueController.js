import { successResponse } from '../utils/response.js';
import {
  processGetBusinessQueue,
  processCallNextCustomer,
  processGetBusinessServices,
  processCompleteService,
  processGetBusinessProfile,
  processUpdateBusinessProfile,
  processCreateBusinessService,
  processUpdateBusinessService,
  processToggleServiceStatus,
  processGetQueueSettings,
  processUpdateQueueSettings,
  processSkipToken,
  processTestMessagingAlert,
} from '../services/queueService.js';

export async function handleGetBusinessQueue(req, res, next) {
  try {
    const businessId = req.query.businessId || req.body?.businessId || req.user?.businessId;
    const queueId = req.query.queueId || req.body?.queueId;
    const queueData = await processGetBusinessQueue({ businessId, queueId });
    return successResponse(res, 'Business queue retrieved successfully', queueData, 200);
  } catch (error) {
    next(error);
  }
}

export async function handleCallNextCustomer(req, res, next) {
  try {
    const businessId = req.body?.businessId || req.user?.businessId;
    const queueId = req.body?.queueId;
    const calledData = await processCallNextCustomer({ businessId, queueId });
    return successResponse(res, 'Next customer called', calledData, 200);
  } catch (error) {
    next(error);
  }
}

export async function handleGetBusinessServices(req, res, next) {
  try {
    // businessId is required — no silent 'demo' fallback
    const businessId = req.query.businessId || req.user?.businessId || null;
    // includeInactive is only meaningful for authenticated BUSINESS owners
    const includeInactive = req.user?.role === 'BUSINESS' && req.query.includeInactive === 'true';
    const servicesData = await processGetBusinessServices(businessId, includeInactive);
    return successResponse(res, 'Business services retrieved successfully', servicesData, 200);
  } catch (error) {
    next(error);
  }
}

export async function handleCompleteService(req, res, next) {
  try {
    const businessId = req.body?.businessId || req.user?.businessId;
    const queueId = req.body?.queueId;
    const completedData = await processCompleteService({ businessId, queueId });
    return successResponse(res, 'Service completed successfully', completedData, 200);
  } catch (error) {
    next(error);
  }
}

export async function handleGetBusinessProfile(req, res, next) {
  try {
    const businessId = req.user.businessId;
    const profile = await processGetBusinessProfile(businessId);
    return successResponse(res, 'Business profile retrieved successfully', profile, 200);
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateBusinessProfile(req, res, next) {
  try {
    const businessId = req.user.businessId;
    const { name, category, phone, address, city, description } = req.body;
    const updatedProfile = await processUpdateBusinessProfile(businessId, {
      name,
      category,
      phone,
      address,
      city,
      description,
    });
    return successResponse(res, 'Business profile updated successfully', updatedProfile, 200);
  } catch (error) {
    next(error);
  }
}

export async function handleCreateBusinessService(req, res, next) {
  try {
    const businessId = req.user.businessId;
    const { name, durationMinutes, price, description } = req.body;
    const serviceData = await processCreateBusinessService({
      businessId,
      name,
      durationMinutes,
      price,
      description,
    });
    return successResponse(res, 'Business service created successfully', serviceData, 201);
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateBusinessService(req, res, next) {
  try {
    const serviceId = req.params.serviceId;
    const businessId = req.user.businessId;
    const { name, durationMinutes, price, description, isActive } = req.body;
    const serviceData = await processUpdateBusinessService({
      serviceId,
      businessId,
      name,
      durationMinutes,
      price,
      description,
      isActive,
    });
    return successResponse(res, 'Business service updated successfully', serviceData, 200);
  } catch (error) {
    next(error);
  }
}

export async function handleToggleServiceStatus(req, res, next) {
  try {
    const serviceId = req.params.serviceId;
    const businessId = req.user.businessId;
    const { isActive } = req.body;
    const serviceData = await processToggleServiceStatus({
      serviceId,
      businessId,
      isActive,
    });
    return successResponse(res, 'Business service status updated', serviceData, 200);
  } catch (error) {
    next(error);
  }
}

export async function handleGetQueueSettings(req, res, next) {
  try {
    const businessId = req.user.businessId;
    const queueId = req.query.queueId;
    const queueSettings = await processGetQueueSettings({ businessId, queueId });
    return successResponse(res, 'Queue settings retrieved successfully', queueSettings, 200);
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateQueueSettings(req, res, next) {
  try {
    const businessId = req.user.businessId;
    const {
      queueId,
      name,
      isOpen,
      tokenPrefix,
      maxDailyCapacity,
      avgServiceDuration,
      smsNotificationsEnabled,
      whatsappNotificationsEnabled,
      turnAlertThreshold,
    } = req.body;
    const updatedQueue = await processUpdateQueueSettings({
      businessId,
      queueId,
      name,
      isOpen,
      tokenPrefix,
      maxDailyCapacity,
      avgServiceDuration,
      smsNotificationsEnabled,
      whatsappNotificationsEnabled,
      turnAlertThreshold,
    });
    return successResponse(res, 'Queue configuration updated successfully', updatedQueue, 200);
  } catch (error) {
    next(error);
  }
}
export async function handleSkipToken(req, res, next) {
  try {
    const businessId = req.user.businessId;
    const { queueId, tokenId } = req.body;
    const skippedData = await processSkipToken({ businessId, queueId, tokenId });
    return successResponse(res, 'Token skipped successfully', skippedData, 200);
  } catch (error) {
    next(error);
  }
}

export async function handleTestAlert(req, res, next) {
  try {
    const businessId = req.user.businessId;
    const { channel, testPhone } = req.body;
    const result = await processTestMessagingAlert({ businessId, channel, testPhone });
    return successResponse(res, 'Test alert processed successfully', result, 200);
  } catch (error) {
    next(error);
  }
}
