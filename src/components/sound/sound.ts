// Effets sonores synthétisés en Web Audio (aucun fichier externe, aucune
// requête réseau). Palette « terminal » : sobre, jamais criard. Tout est
// coupable via le toggle 🔊. Rien ne joue tant que l'utilisateur n'a pas
// interagi (politique autoplay des navigateurs).

type SoundName = "boot" | "tick" | "beep" | "cash" | "error" | "tab";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setSoundEnabled(value: boolean): void {
  enabled = value;
}

export function isSoundEnabled(): boolean {
  return enabled;
}

function tone(
  c: AudioContext,
  opts: {
    type?: OscillatorType;
    from: number;
    to?: number;
    start: number;
    duration: number;
    gain?: number;
    attack?: number;
  }
): void {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.from, opts.start);
  if (opts.to !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.to), opts.start + opts.duration);
  }
  const peak = opts.gain ?? 0.2;
  const attack = opts.attack ?? 0.005;
  gain.gain.setValueAtTime(0.0001, opts.start);
  gain.gain.exponentialRampToValueAtTime(peak, opts.start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, opts.start + opts.duration);
  osc.connect(gain);
  gain.connect(master ?? c.destination);
  osc.start(opts.start);
  osc.stop(opts.start + opts.duration + 0.02);
}

export function playSound(name: SoundName): void {
  if (!enabled) return;
  const c = ensureContext();
  if (!c || !master) return;
  const t = c.currentTime;

  switch (name) {
    case "boot":
      // sweep ascendant + confirmation
      tone(c, { type: "sawtooth", from: 90, to: 640, start: t, duration: 0.35, gain: 0.12 });
      tone(c, { type: "sine", from: 520, to: 880, start: t + 0.18, duration: 0.22, gain: 0.14 });
      tone(c, { type: "square", from: 1320, start: t + 0.42, duration: 0.08, gain: 0.06 });
      break;
    case "tick":
      tone(c, { type: "square", from: 2100, start: t, duration: 0.03, gain: 0.05 });
      break;
    case "tab":
      tone(c, { type: "triangle", from: 660, to: 990, start: t, duration: 0.07, gain: 0.08 });
      break;
    case "beep":
      tone(c, { type: "sine", from: 880, start: t, duration: 0.09, gain: 0.12 });
      break;
    case "cash":
      // petite arpège montante « caisse »
      tone(c, { type: "triangle", from: 784, start: t, duration: 0.09, gain: 0.12 });
      tone(c, { type: "triangle", from: 988, start: t + 0.08, duration: 0.09, gain: 0.12 });
      tone(c, { type: "triangle", from: 1319, start: t + 0.16, duration: 0.14, gain: 0.12 });
      break;
    case "error":
      tone(c, { type: "sawtooth", from: 220, to: 110, start: t, duration: 0.22, gain: 0.14 });
      break;
  }
}

/** À appeler sur le premier geste utilisateur pour débloquer l'audio. */
export function unlockAudio(): void {
  ensureContext();
}
