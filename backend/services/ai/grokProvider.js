/**
 * Grok AI Provider Adapter — Shewwina Backend
 *
 * Interacts with xAI / Grok API (https://api.x.ai/v1)
 *
 * Security & Reliability:
 * - Reads API credentials exclusively from backend environment variables (XAI_API_KEY / GROK_API_KEY)
 * - Zero PII sent: only anonymized numerical queue state and contextual time
 * - Strict timeout enforcement via AbortController (default 5000ms)
 * - Never throws unhandled exceptions; errors bubble up to aiService for graceful fallback
 */

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MODEL = 'grok-3-mini';
const DEFAULT_BASE_URL = 'https://api.x.ai/v1';

/**
 * Call Grok Chat Completions API with queue snapshot context
 *
 * @param {Object} context
 * @param {number} context.peopleAhead
 * @param {number} context.deterministicEstimate
 * @param {number} context.avgServiceDurationMinutes
 * @param {number} context.queueSize
 * @param {string} [context.timeOfDay]
 * @param {string} [context.dayOfWeek]
 * @param {number|null} [context.recentAvgActualMinutes]
 * @param {number} [timeoutMs]
 * @returns {Promise<{ estimatedWaitMinutes: number, reasoning?: string }>}
 */
export async function predictWithGrok(context, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  if (!apiKey) {
    throw new Error('Grok API key is not configured');
  }

  const model = process.env.XAI_MODEL || process.env.GROK_MODEL || DEFAULT_MODEL;
  const baseUrl = (process.env.XAI_BASE_URL || process.env.GROK_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const url = `${baseUrl}/chat/completions`;

  const {
    peopleAhead = 0,
    deterministicEstimate = 0,
    avgServiceDurationMinutes = 15,
    queueSize = 1,
    timeOfDay = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    recentAvgActualMinutes = null,
  } = context;

  const prompt = `You are an AI queue wait-time estimation assistant for the Shewwina queue management system.
Your task is to predict a conservative, realistic waiting time in minutes for a customer in line.

Queue Snapshot (Anonymized):
- People ahead in queue: ${peopleAhead}
- Baseline standard wait estimate: ${deterministicEstimate} minutes
- Standard configured service duration: ${avgServiceDurationMinutes} minutes per customer
- Total active queue size: ${queueSize}
- Current time: ${timeOfDay} (${dayOfWeek})
- Recent actual service throughput: ${recentAvgActualMinutes != null ? `${recentAvgActualMinutes} minutes per served customer` : 'No recent completed service data available'}

Guidelines:
1. Provide a realistic, conservative prediction in minutes.
2. If recent throughput is faster or slower than standard duration, adjust reasonably.
3. If 0 people are ahead, wait time is 0.
4. Output MUST be valid JSON only, without markdown backticks or commentary.
Format:
{"estimatedWaitMinutes": <number>, "reasoning": "<concise rationale under 20 words>"}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a queue optimization AI engine. Respond ONLY with valid JSON containing estimatedWaitMinutes and reasoning.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Grok API HTTP error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    const rawContent = json?.choices?.[0]?.message?.content?.trim();

    if (!rawContent) {
      throw new Error('Grok API returned empty response content');
    }

    // Clean JSON in case model wrapped in ```json ... ```
    const cleaned = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    const wait = Number(parsed?.estimatedWaitMinutes);
    if (!Number.isFinite(wait)) {
      throw new Error('Grok response did not contain a valid finite numeric estimatedWaitMinutes');
    }

    return {
      estimatedWaitMinutes: Math.round(wait),
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning.trim() : 'AI adjusted based on queue dynamics',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export default {
  predictWithGrok,
};
