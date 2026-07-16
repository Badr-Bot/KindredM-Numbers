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
    // Volume global adouci (0.28 au lieu de 0.5) — demande de Badr : « pas des
    // sons qui font mal à la tête ». Un filtre passe-bas coupe les aigus
    // stridents qui fatiguent l'oreille sur les petits haut-parleurs.
    master.gain.value = 0.28;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 2600;
    master.connect(lowpass);
    lowpass.connect(ctx.destination);
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
  // Attaque plus douce par défaut (12 ms) : un attack très court claque et
  // fatigue. Release exponentiel long pour un fondu naturel, jamais sec.
  const attack = opts.attack ?? 0.012;
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

  // Palette adoucie : sine/triangle uniquement (rondes, sans harmoniques
  // agressives), fréquences ramenées dans le medium chaleureux, aigus
  // stridents supprimés. Accords consonants façon UI d'anime moderne.
  switch (name) {
    case "boot":
      // montée douce en quinte, comme un vaisseau qui s'allume
      tone(c, { type: "sine", from: 220, to: 440, start: t, duration: 0.4, gain: 0.1 });
      tone(c, { type: "triangle", from: 440, to: 660, start: t + 0.22, duration: 0.28, gain: 0.09 });
      break;
    case "tick":
      tone(c, { type: "sine", from: 660, start: t, duration: 0.045, gain: 0.045 });
      break;
    case "tab":
      // petit blip rond et bref, montée de tierce
      tone(c, { type: "triangle", from: 523, to: 659, start: t, duration: 0.08, gain: 0.06 });
      break;
    case "beep":
      tone(c, { type: "sine", from: 587, start: t, duration: 0.1, gain: 0.09 });
      break;
    case "cash":
      // arpège majeur consonant (do-mi-sol), doux et satisfaisant
      tone(c, { type: "triangle", from: 523, start: t, duration: 0.12, gain: 0.09 });
      tone(c, { type: "triangle", from: 659, start: t + 0.1, duration: 0.12, gain: 0.09 });
      tone(c, { type: "sine", from: 784, start: t + 0.2, duration: 0.22, gain: 0.1 });
      break;
    case "error":
      // deux notes descendantes douces, jamais un buzz strident
      tone(c, { type: "sine", from: 392, start: t, duration: 0.14, gain: 0.1 });
      tone(c, { type: "sine", from: 294, start: t + 0.12, duration: 0.2, gain: 0.1 });
      break;
  }
}

/** À appeler sur le premier geste utilisateur pour débloquer l'audio. */
export function unlockAudio(): void {
  ensureContext();
}
