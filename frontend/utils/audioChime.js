/**
 * In-App Counter Audio Chime (Web Audio API)
 *
 * Uses browser native AudioContext to synthesize a clean, pleasant counter bell chime.
 * Zero external audio files (no MP3/WAV requests that could 404).
 *
 * Autoplay Resilience:
 * - Detects suspended AudioContext (browser policy).
 * - Provides unlockAudio() to resume on user interaction.
 * - Plays a double-tone bell: 587.33 Hz (D5) -> 880 Hz (A5).
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Attempt to resume AudioContext if suspended by browser autoplay policy
 */
export async function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    try {
      await ctx.resume();
      return true;
    } catch (e) {
      return false;
    }
  }
  return ctx ? ctx.state === 'running' : false;
}

/**
 * Synthesize and play a pleasant counter chime
 * @returns {Promise<boolean>} true if played, false if blocked by browser policy
 */
export async function playCounterChime() {
  const ctx = getAudioContext();
  if (!ctx) return false;

  if (ctx.state === 'suspended') {
    const unlocked = await unlockAudio();
    if (!unlocked) return false;
  }

  try {
    const now = ctx.currentTime;

    // Tone 1: D5 (587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Tone 2: A5 (880.00 Hz) - staggered slightly
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.18);
    gain2.gain.setValueAtTime(0, now + 0.18);
    gain2.gain.linearRampToValueAtTime(0.35, now + 0.22);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.9);

    return true;
  } catch (err) {
    console.warn('[AudioChime] Unable to play audio chime:', err.message);
    return false;
  }
}

export default {
  playCounterChime,
  unlockAudio,
};
