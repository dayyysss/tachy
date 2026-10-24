import type { Settings } from '#shared/schemas/settings'

let context: AudioContext | null = null

const packs: Record<Settings['sound']['pack'], { frequency: number; type: OscillatorType; duration: number }> = {
  mechanical: { frequency: 220, type: 'square', duration: 0.03 },
  typewriter: { frequency: 140, type: 'sawtooth', duration: 0.04 },
  soft: { frequency: 320, type: 'sine', duration: 0.025 },
}

function playTone(frequency: number, type: OscillatorType, duration: number, volume: number) {
  if (typeof window === 'undefined') return
  context ??= new AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.frequency.value = frequency
  oscillator.type = type
  gain.gain.setValueAtTime(volume * 0.15, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration)
  oscillator.connect(gain).connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + duration)
}

export function useSound() {
  function play(correct: boolean, sound: Settings['sound']) {
    if (!sound.enabled) return
    if (!correct && !sound.errorSound) return
    if (!correct) {
      playTone(110, 'triangle', 0.08, sound.volume)
      return
    }
    const pack = packs[sound.pack] ?? packs.soft
    playTone(pack.frequency, pack.type, pack.duration, sound.volume)
  }

  return { play }
}
