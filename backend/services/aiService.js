/**
 * AI Queue Prediction & Optimization Service — Shewwina Backend (Phase 9)
 *
 * Provider-agnostic service layer for AI-driven wait-time forecasting & queue analytics.
 * Follows the failure-isolated architecture established in messagingService.js.
 *
 * Key guarantees:
 * - AI is strictly non-blocking: errors, timeouts, or missing keys fall back to deterministic calculations.
 * - Cooldown mechanism: in-memory 30-second cache per tokenId prevents external API hammering during frontend 5s polling.
 * - Validation: all AI predictions are checked for type, non-negativity, and upper bounds (<= 480 min).
 * - Provider-agnostic: supports MOCK mode (test/dev default without keys) and GROK (xAI).
 */

import dotenv from 'dotenv';
import { predictWithGrok } from './ai/grokProvider.js';

dotenv.config();

export const AI_PROVIDERS = {
  MOCK: 'mock',
  GROK: 'grok',
};

// 30-second per-tokenId prediction cache
// Maps tokenId -> { aiEstimatedWaitMinutes, timestamp, source }
const tokenPredictionCache = new Map();

// Cooldown window in milliseconds
const COOLDOWN_WINDOW_MS = 30000;

// Maximum acceptable wait time in minutes (8 hours)
const MAX_PREDICTION_MINUTES = 480;

// Test hook: allow mocking AI output in automated tests
let customMockHandler = null;

export function setCustomMockHandler(handler) {
  customMockHandler = handler;
}

export function clearCooldownCache() {
  tokenPredictionCache.clear();
}

/**
 * Determine the active AI provider
 */
export function getActiveProvider() {
  const explicit = (process.env.AI_PROVIDER || '').toLowerCase().trim();
  if (explicit === AI_PROVIDERS.GROK) return AI_PROVIDERS.GROK;
  if (explicit === AI_PROVIDERS.MOCK) return AI_PROVIDERS.MOCK;

  // Auto-detect: if XAI_API_KEY or GROK_API_KEY is present, use GROK; otherwise MOCK
  if (process.env.XAI_API_KEY || process.env.GROK_API_KEY) {
    return AI_PROVIDERS.GROK;
  }
  return AI_PROVIDERS.MOCK;
}

/**
 * Check if AI feature is globally enabled
 */
export function isAiEnabled() {
  const flag = (process.env.AI_ENABLED || 'true').toLowerCase().trim();
  return flag !== 'false' && flag !== '0' && flag !== 'off';
}

/**
 * Validate and sanitize numeric wait-time prediction
 */
export function sanitizePrediction(val, deterministicEstimate = 0) {
  if (val === null || val === undefined) return null;
  const num = Number(val);
  if (!Number.isFinite(num)) return null;
  if (num < 0) return null;
  if (num > MAX_PREDICTION_MINUTES) return Math.min(deterministicEstimate, MAX_PREDICTION_MINUTES);
  return Math.round(num);
}

/**
 * Enhance wait-time prediction for a customer's token
 *
 * @param {Object} params
 * @param {string} params.tokenId
 * @param {number} params.peopleAhead
 * @param {number} params.deterministicEstimate
 * @param {number} [params.avgServiceDurationMinutes]
 * @param {number} [params.queueSize]
 * @param {number|null} [params.recentAvgActualMinutes]
 * @returns {Promise<{ aiEstimatedWaitMinutes: number|null, source: string, cached: boolean }>}
 */
export async function enhanceWaitPrediction({
  tokenId,
  peopleAhead = 0,
  deterministicEstimate = 0,
  avgServiceDurationMinutes = 15,
  queueSize = 1,
  recentAvgActualMinutes = null,
}) {
  // If 0 people are ahead, wait is immediately 0 min
  if (peopleAhead <= 0) {
    return {
      aiEstimatedWaitMinutes: 0,
      source: 'deterministic',
      cached: false,
    };
  }

  // If AI is disabled via config
  if (!isAiEnabled()) {
    return {
      aiEstimatedWaitMinutes: null,
      source: 'disabled',
      cached: false,
    };
  }

  const now = Date.now();

  // Check 30-second cooldown cache per tokenId
  if (tokenId) {
    const cached = tokenPredictionCache.get(tokenId);
    if (cached && (now - cached.timestamp) < COOLDOWN_WINDOW_MS) {
      return {
        aiEstimatedWaitMinutes: cached.aiEstimatedWaitMinutes,
        source: cached.source,
        cached: true,
      };
    }
  }

  const provider = getActiveProvider();

  try {
    let rawWaitMinutes = null;
    let source = provider;

    if (customMockHandler) {
      const mockResult = await customMockHandler({
        tokenId,
        peopleAhead,
        deterministicEstimate,
        avgServiceDurationMinutes,
        queueSize,
        recentAvgActualMinutes,
      });
      rawWaitMinutes = typeof mockResult === 'object' ? mockResult?.estimatedWaitMinutes : mockResult;
      source = 'mock';
    } else if (provider === AI_PROVIDERS.GROK) {
      const grokResult = await predictWithGrok({
        peopleAhead,
        deterministicEstimate,
        avgServiceDurationMinutes,
        queueSize,
        recentAvgActualMinutes,
      });
      rawWaitMinutes = grokResult.estimatedWaitMinutes;
      source = 'grok';
    } else {
      // Standard MOCK mode algorithm (realistic dynamic heuristic)
      // If recent throughput exists, blend 70% throughput + 30% standard duration
      const effectiveDuration = recentAvgActualMinutes && recentAvgActualMinutes > 0
        ? (0.7 * recentAvgActualMinutes + 0.3 * avgServiceDurationMinutes)
        : avgServiceDurationMinutes;
      
      // Conservative estimate: slight 5% buffer for transition delays
      rawWaitMinutes = Math.round(peopleAhead * effectiveDuration * 1.05);
      source = 'mock';
    }

    const sanitized = sanitizePrediction(rawWaitMinutes, deterministicEstimate);

    if (sanitized !== null && tokenId) {
      tokenPredictionCache.set(tokenId, {
        aiEstimatedWaitMinutes: sanitized,
        timestamp: now,
        source,
      });
    }

    return {
      aiEstimatedWaitMinutes: sanitized,
      source: sanitized !== null ? source : 'fallback_deterministic',
      cached: false,
    };
  } catch (err) {
    // Failure-isolated: log warning and silently return fallback
    console.warn(`[AI Service] Prediction failed for token ${tokenId} (${err.message}). Falling back to deterministic.`);
    return {
      aiEstimatedWaitMinutes: null,
      source: 'fallback_deterministic',
      cached: false,
    };
  }
}

/**
 * Compute AI Queue Insights for business dashboard
 *
 * @param {Object} params
 * @param {number} params.waitingCount
 * @param {number} params.servingCount
 * @param {number} params.totalTokens
 * @param {number} [params.avgServiceDurationMinutes]
 * @param {number|null} [params.recentAvgActualMinutes]
 * @returns {Object} Queue insights payload
 */
export function analyzeQueueInsights({
  waitingCount = 0,
  servingCount = 0,
  totalTokens = 0,
  avgServiceDurationMinutes = 15,
  recentAvgActualMinutes = null,
}) {
  const standardClearMinutes = waitingCount * avgServiceDurationMinutes;

  // If AI is disabled
  if (!isAiEnabled()) {
    return {
      estimatedClearTimeMinutes: standardClearMinutes,
      aiAdjustedClearTimeMinutes: standardClearMinutes,
      loadLevel: waitingCount > 5 ? 'HIGH' : waitingCount > 2 ? 'MODERATE' : 'LOW',
      peakWarning: waitingCount >= 8,
      source: 'deterministic',
    };
  }

  const effectiveDuration = recentAvgActualMinutes && recentAvgActualMinutes > 0
    ? (0.6 * recentAvgActualMinutes + 0.4 * avgServiceDurationMinutes)
    : avgServiceDurationMinutes;

  const aiAdjusted = Math.round(waitingCount * effectiveDuration);

  let loadLevel = 'LOW';
  if (waitingCount >= 8 || aiAdjusted >= 120) {
    loadLevel = 'HIGH';
  } else if (waitingCount >= 3 || aiAdjusted >= 45) {
    loadLevel = 'MODERATE';
  }

  const peakWarning = loadLevel === 'HIGH';

  return {
    estimatedClearTimeMinutes: standardClearMinutes,
    aiAdjustedClearTimeMinutes: aiAdjusted,
    loadLevel,
    peakWarning,
    source: getActiveProvider(),
  };
}

export default {
  AI_PROVIDERS,
  getActiveProvider,
  isAiEnabled,
  sanitizePrediction,
  enhanceWaitPrediction,
  analyzeQueueInsights,
  setCustomMockHandler,
  clearCooldownCache,
};
