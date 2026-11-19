import type { Settings } from '#shared/schemas/settings'

let context: AudioContext | null = null

const packs: Record<Settings['sound']['pack'], { frequency: number; type: OscillatorType; duration: number }> = {
  mechanical: { frequency: 220, type: 'square', duration: 0.03 },
  typewriter: { frequency: 140, type: 'sawtooth', duration: 0.04 },
  soft: { frequency: 320, type: 'sine', duration: 0.025 },
}

function playTone(frequency: number, type: OscillatorType, duration: number, volume: number) {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    context ??= new AudioCtx()
    if (context.state === 'suspended') {
      context.resume().catch(() => {})
    }
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.frequency.value = frequency
    oscillator.type = type
    gain.gain.setValueAtTime(Math.max(0, volume) * 0.15, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + duration)
  } catch {
    // AudioContext blocked or not supported
  }
}

export function useSound() {
  function preview(pack: Settings['sound']['pack'], volume = 0.4) {
    const target = packs[pack] ?? packs.soft
    playTone(target.frequency, target.type, target.duration, volume)
  }

  function play(correct: boolean, sound?: Settings['sound']) {
    if (!sound?.enabled) return
    if (!correct && !sound.errorSound) return
    if (!correct) {
      playTone(110, 'triangle', 0.08, sound.volume ?? 0.4)
      return
    }
    const pack = packs[sound.pack] ?? packs.soft
    playTone(pack.frequency, pack.type, pack.duration, sound.volume ?? 0.4)
  }

  return { play, preview }
}
