const AudioCtx = window.AudioContext || window.webkitAudioContext
let ctx = null

function getCtx() {
  if (!ctx) ctx = new AudioCtx()
  return ctx
}

function playChomp() {
  const c = getCtx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(200, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(400, c.currentTime + 0.05)
  osc.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.1)
  gain.gain.setValueAtTime(0.15, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + 0.1)
}

function playPowerUp() {
  const c = getCtx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'square'

  osc.frequency.setValueAtTime(600, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.15)
  osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.25)

  gain.gain.setValueAtTime(0.18, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25)

  osc.connect(gain)
  gain.connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + 0.25)
}

let frightOsc = null
let frightGain = null

function startFrightSound() {
  if (frightOsc) return
  const c = getCtx()
  frightOsc = c.createOscillator()
  frightGain = c.createGain()
  frightOsc.type = 'sawtooth'

  const now = c.currentTime
  for (let i = 0; i < 30; i++) {
    const t = now + i * 0.22
    const freq = i % 2 === 0 ? 140 : 170
    frightOsc.frequency.setValueAtTime(freq, t)
  }

  frightGain.gain.setValueAtTime(0.07, c.currentTime)
  frightOsc.connect(frightGain)
  frightGain.connect(c.destination)
  frightOsc.start()
}

function stopFrightSound() {
  if (!frightOsc) return
  try { frightOsc.stop() } catch (_) { /* already stopped */ }
  frightOsc = null
  frightGain = null
}

function playEatGhost() {
  const c = getCtx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'

  osc.frequency.setValueAtTime(300, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(380, c.currentTime + 0.1)
  osc.frequency.setValueAtTime(480, c.currentTime + 0.12)
  osc.frequency.exponentialRampToValueAtTime(560, c.currentTime + 0.22)
  osc.frequency.setValueAtTime(680, c.currentTime + 0.24)
  osc.frequency.exponentialRampToValueAtTime(960, c.currentTime + 0.4)

  gain.gain.setValueAtTime(0.2, c.currentTime)
  gain.gain.setValueAtTime(0.2, c.currentTime + 0.37)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5)

  osc.connect(gain)
  gain.connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + 0.5)
}

function playDeath() {
  const c = getCtx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(600, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.6)
  gain.gain.setValueAtTime(0.15, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + 0.6)
}
