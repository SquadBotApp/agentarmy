export function lowFreqOsc(timeMs: number, speed = 0.00012, scale = 0.5) {
  return 1 + Math.sin(timeMs * speed) * scale;
}
