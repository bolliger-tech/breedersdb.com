// used vy frontend/quasar.conf.js and frontend/scripts/primary-color.js
export function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return (
    (Math.round(255 * f(0)) << 16) +
    (Math.round(255 * f(8)) << 8) +
    Math.round(255 * f(4))
  )
    .toString(16)
    .padStart(6, '0');
}
