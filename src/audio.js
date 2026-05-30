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
  osc.type = 'sine'
  osc.frequency.setValueAtTime(300, c.currentTime)
  osc.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.3)
  osc.frequency.exponentialRampToValueAtTime(400, c.currentTime + 0.5)
  gain.gain.setValueAtTime(0.2, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.5)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + 0.5)
}

let frightOsc = null
let frightGain = null

function startFrightSound() {
  if (frightOsc) return
  const c = getCtx()
  frightOsc = c.createOscillator()
  frightGain = c.createGain()
  frightOsc.type = 'sawtooth'
  frightOsc.frequency.setValueAtTime(150, c.currentTime)
  frightOsc.frequency.linearRampToValueAtTime(300, c.currentTime + 0.5)
  frightOsc.frequency.linearRampToValueAtTime(150, c.currentTime + 1)
  frightGain.gain.setValueAtTime(0.08, c.currentTime)
  frightOsc.connect(frightGain)
  frightGain.connect(c.destination)
  frightOsc.start()
}

function stopFrightSound() {
  if (!frightOsc) return
  const c = getCtx()
  frightGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1)
  frightOsc.stop(c.currentTime + 0.1)
  frightOsc = null
  frightGain = null
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
