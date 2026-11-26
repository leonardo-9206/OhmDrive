import { useGameStore } from '../store/useGameStore'

let audioCtx = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!audioCtx) {
    audioCtx = new Ctx()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

function isSoundEnabled() {
  try {
    return useGameStore.getState().soundEnabled !== false
  } catch {
    return true
  }
}

function playTone(ctx, { freq, endFreq, type = 'sine', startTime = 0, duration = 0.1, gain = 0.08 }) {
  const now = ctx.currentTime + startTime
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, now)
  if (endFreq && endFreq !== freq) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration)
  }

  amp.gain.setValueAtTime(0.0001, now)
  amp.gain.linearRampToValueAtTime(gain, now + 0.01)
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  osc.connect(amp)
  amp.connect(ctx.destination)

  osc.start(now)
  osc.stop(now + duration + 0.01)
}

/**
 * Crisp Cyber-PCB tactile click for buttons and pills.
 */
export function playClick() {
  if (!isSoundEnabled()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    playTone(ctx, { freq: 760, endFreq: 380, type: 'triangle', duration: 0.04, gain: 0.05 })
  } catch {
    // Ignore audio errors in restricted environments
  }
}

/**
 * Positive energy charge arpeggio when an exercise is answered correctly.
 */
export function playSuccess() {
  if (!isSoundEnabled()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    playTone(ctx, { freq: 523.25, type: 'triangle', startTime: 0, duration: 0.09, gain: 0.08 }) // C5
    playTone(ctx, { freq: 659.25, type: 'triangle', startTime: 0.07, duration: 0.09, gain: 0.08 }) // E5
    playTone(ctx, { freq: 783.99, type: 'sine', startTime: 0.14, duration: 0.14, gain: 0.09 }) // G5
  } catch {
    // Ignore audio errors
  }
}

/**
 * Subtle amber alert tone when showing a hint for a second attempt.
 */
export function playHint() {
  if (!isSoundEnabled()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    playTone(ctx, { freq: 440, type: 'sine', startTime: 0, duration: 0.08, gain: 0.07 })
    playTone(ctx, { freq: 370, type: 'sine', startTime: 0.09, duration: 0.11, gain: 0.07 })
  } catch {
    // Ignore audio errors
  }
}

/**
 * Electric short-circuit buzz when a fuse blows or an answer is wrong.
 */
export function playShock() {
  if (!isSoundEnabled()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    playTone(ctx, { freq: 240, endFreq: 75, type: 'sawtooth', startTime: 0, duration: 0.18, gain: 0.07 })
    playTone(ctx, { freq: 180, endFreq: 60, type: 'square', startTime: 0.06, duration: 0.14, gain: 0.04 })
  } catch {
    // Ignore audio errors
  }
}

/**
 * Triumphant 4-note fanfare when completing a level.
 */
export function playVictory() {
  if (!isSoundEnabled()) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    playTone(ctx, { freq: 523.25, type: 'triangle', startTime: 0, duration: 0.1, gain: 0.08 }) // C5
    playTone(ctx, { freq: 659.25, type: 'triangle', startTime: 0.09, duration: 0.1, gain: 0.08 }) // E5
    playTone(ctx, { freq: 783.99, type: 'triangle', startTime: 0.18, duration: 0.1, gain: 0.08 }) // G5
    playTone(ctx, { freq: 1046.5, type: 'sine', startTime: 0.27, duration: 0.24, gain: 0.1 }) // C6
  } catch {
    // Ignore audio errors
  }
}
