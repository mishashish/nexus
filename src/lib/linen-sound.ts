let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.04) {
  const ac = audio();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ac.currentTime);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + dur + 0.02);
}

/** Dusty pentatonic blip — not a UI beep. */
export function playBuyChime(index: number) {
  const scale = [196, 220, 247, 262, 294];
  const f = scale[index % scale.length];
  tone(f, 0.28, "sine", 0.05);
  tone(f * 1.5, 0.4, "triangle", 0.018);
}

export function playTap() {
  tone(246, 0.08, "sine", 0.025);
}

export function playMiss() {
  tone(110, 0.12, "square", 0.02);
}

export function playLock() {
  tone(262, 0.18, "sine", 0.05);
  tone(392, 0.32, "triangle", 0.03);
  tone(523, 0.5, "sine", 0.02);
}
