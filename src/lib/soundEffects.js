// Web Audio API Sound Utility for Inkluvia
// Lightweight, zero-dependency, kid-friendly pleasant sounds

let audioCtx = null
let soundEnabled = true

function getAudioContext() {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export function isSoundEnabled() {
  return soundEnabled
}

export function toggleSound() {
  soundEnabled = !soundEnabled
  return soundEnabled
}

export function setSoundEnabled(val) {
  soundEnabled = !!val
}

/**
 * Play a gentle, cheerful chime when clicking Si Es Batu mascot
 */
export function playMascotChime() {
  if (!soundEnabled) return
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  // Pleasant pentatonic sparkle: C5 -> E5 -> G5 -> C6
  const notes = [523.25, 659.25, 783.99, 1046.50]

  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + index * 0.08)

    gain.gain.setValueAtTime(0.001, now + index * 0.08)
    gain.gain.exponentialRampToValueAtTime(0.12, now + index * 0.08 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.35)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now + index * 0.08)
    osc.stop(now + index * 0.08 + 0.36)
  })
}

/**
 * Play a soft pop sound for button clicks
 */
export function playButtonPop() {
  if (!soundEnabled) return
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(320, now)
  osc.frequency.exponentialRampToValueAtTime(540, now + 0.07)

  gain.gain.setValueAtTime(0.08, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(now)
  osc.stop(now + 0.09)
}

/**
 * Play a gentle accomplishment fanfare (used when finishing a step or selecting a mode)
 */
export function playFanfare() {
  if (!soundEnabled) return
  const ctx = getAudioContext()
  if (!ctx) return

  const now = ctx.currentTime
  const chord = [440, 554.37, 659.25, 880]

  chord.forEach((freq) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, now)

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.09, now + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.62)
  })
}
