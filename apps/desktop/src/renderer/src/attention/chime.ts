// A soft two-note chime for "an agent needs you", made with Web Audio (no sound file)
let context: AudioContext | undefined

const NOTES: [frequency: number, delay: number][] = [
  [659.25, 0], // E5
  [987.77, 0.14] // B5
]

export function playChime(): void {
  try {
    context ??= new AudioContext()
    void context.resume()
    const start = context.currentTime
    const master = context.createGain()
    master.gain.value = 0.14
    master.connect(context.destination)
    for (const [frequency, delay] of NOTES) {
      // A quiet octave on top gives it a bell-like ring
      for (const [multiple, level] of [
        [1, 1],
        [2, 0.18]
      ]) {
        const tone = context.createOscillator()
        const envelope = context.createGain()
        tone.type = 'sine'
        tone.frequency.value = frequency * multiple
        envelope.gain.setValueAtTime(0, start + delay)
        envelope.gain.linearRampToValueAtTime(level, start + delay + 0.012)
        envelope.gain.exponentialRampToValueAtTime(0.0001, start + delay + 1.1)
        tone.connect(envelope).connect(master)
        tone.start(start + delay)
        tone.stop(start + delay + 1.2)
      }
    }
  } catch {
    // No audio device: the popup still shows
  }
}
