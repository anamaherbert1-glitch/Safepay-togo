let audioContext: AudioContext | null = null;

function getContext() {
  if (typeof window === "undefined") return null;
  if (!audioContext) audioContext = new AudioContext();
  return audioContext;
}

export async function primeNotificationSound() {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") await ctx.resume();
}

export async function playNotificationSound() {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    try { await ctx.resume(); } catch { return; }
  }
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.setValueAtTime(1175, now + 0.08);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.07, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.24);
}
