type Sfx = "card" | "chip" | "correct" | "wrong" | "deal" | "win" | "lose";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = enabled ? 0.38 : 0;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function unlockAudio(): void {
  const c = ensure();
  if (c && c.state === "suspended") void c.resume();
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  if (master && ctx) {
    master.gain.setTargetAtTime(on ? 0.38 : 0, ctx.currentTime, 0.03);
  }
}

function beep(freq: number, dur: number, type: OscillatorType, gain: number, at = 0, slide?: number) {
  if (!ctx || !master || !enabled) return;
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(dur: number, gain: number, at = 0) {
  if (!ctx || !master || !enabled) return;
  const n = 2 * ctx.sampleRate * dur;
  const buffer = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < n; i += 1) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const g = ctx.createGain();
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 1800;
  const t = ctx.currentTime + at;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(t);
  src.stop(t + dur + 0.02);
}

export function sfx(kind: Sfx): void {
  if (!ensure() || !enabled) return;
  const jitter = 0.94 + Math.random() * 0.12;
  switch (kind) {
    case "card":
      noise(0.06, 0.18);
      beep(220 * jitter, 0.07, "triangle", 0.08);
      break;
    case "deal":
      noise(0.05, 0.14, 0);
      noise(0.05, 0.12, 0.07);
      noise(0.05, 0.1, 0.14);
      beep(180, 0.08, "sine", 0.05, 0.02);
      break;
    case "chip":
      beep(880 * jitter, 0.05, "square", 0.04);
      beep(1320 * jitter, 0.07, "sine", 0.05, 0.02);
      break;
    case "correct":
      beep(523, 0.09, "sine", 0.07);
      beep(659, 0.12, "sine", 0.07, 0.07);
      beep(784, 0.16, "sine", 0.06, 0.14);
      break;
    case "wrong":
      beep(220, 0.16, "sawtooth", 0.05, 0, 140);
      beep(160, 0.18, "triangle", 0.05, 0.04);
      break;
    case "win":
      beep(392, 0.1, "sine", 0.06);
      beep(523, 0.12, "sine", 0.06, 0.08);
      beep(659, 0.18, "sine", 0.07, 0.16);
      break;
    case "lose":
      beep(247, 0.14, "sine", 0.05, 0, 180);
      beep(196, 0.2, "triangle", 0.05, 0.08);
      break;
  }
}

export function attachUnlock(): () => void {
  const on = () => unlockAudio();
  const vis = () => {
    if (document.visibilityState === "visible") unlockAudio();
  };
  window.addEventListener("pointerdown", on);
  window.addEventListener("keydown", on);
  document.addEventListener("visibilitychange", vis);
  return () => {
    window.removeEventListener("pointerdown", on);
    window.removeEventListener("keydown", on);
    document.removeEventListener("visibilitychange", vis);
  };
}
