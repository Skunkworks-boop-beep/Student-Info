/**
 * Lightweight UI sounds via Web Audio API — no asset files; cohesive soft tactical palette
 * (short tones, low gain; matches the olive / navy-green UI mood).
 */

export type SoundId =
  | 'tap'
  | 'nav'
  | 'success'
  | 'theme'
  | 'notify'
  | 'panel'
  | 'send'
  | 'error'
  | 'logout'
  | 'role';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

async function ensureRunning(): Promise<AudioContext | null> {
  const c = getCtx();
  if (!c) return null;
  if (c.state === 'suspended') await c.resume();
  return c;
}

const V = 0.1;

function tone(
  c: AudioContext,
  t0: number,
  freq: number,
  dur: number,
  peak: number,
  type: OscillatorType = 'sine'
) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(Math.max(peak * V, 0.0001), t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.025);
}

function noiseClick(c: AudioContext, t0: number, peak: number) {
  const bufferSize = c.sampleRate * 0.03;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1800, t0);
  filter.Q.setValueAtTime(0.7, t0);
  const g = c.createGain();
  g.gain.setValueAtTime(peak * V, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.028);
  src.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  src.start(t0);
  src.stop(t0 + 0.032);
}

export async function playSound(id: SoundId): Promise<void> {
  const c = await ensureRunning();
  if (!c) return;

  const t0 = c.currentTime;

  switch (id) {
    case 'tap':
      noiseClick(c, t0, 1.15);
      break;
    case 'nav':
      tone(c, t0, 380, 0.055, 0.65);
      tone(c, t0 + 0.018, 520, 0.04, 0.45);
      break;
    case 'success':
      tone(c, t0, 523.25, 0.08, 0.75);
      tone(c, t0 + 0.07, 659.25, 0.1, 0.55);
      tone(c, t0 + 0.16, 783.99, 0.12, 0.45);
      break;
    case 'theme':
      tone(c, t0, 220, 0.06, 0.5);
      tone(c, t0 + 0.045, 330, 0.07, 0.45);
      break;
    case 'notify':
      tone(c, t0, 880, 0.06, 0.6);
      tone(c, t0 + 0.05, 1174, 0.055, 0.4);
      break;
    case 'panel':
      tone(c, t0, 290, 0.07, 0.6);
      tone(c, t0 + 0.04, 410, 0.08, 0.45);
      break;
    case 'send':
      noiseClick(c, t0, 0.9);
      tone(c, t0 + 0.02, 600, 0.04, 0.55);
      break;
    case 'error':
      tone(c, t0, 150, 0.12, 0.65, 'triangle');
      tone(c, t0 + 0.08, 130, 0.1, 0.5, 'triangle');
      break;
    case 'logout':
      tone(c, t0, 300, 0.09, 0.5);
      tone(c, t0 + 0.06, 200, 0.1, 0.4);
      break;
    case 'role':
      tone(c, t0, 440, 0.05, 0.6);
      tone(c, t0 + 0.055, 550, 0.06, 0.5);
      tone(c, t0 + 0.12, 660, 0.055, 0.4);
      break;
    default:
      break;
  }
}
