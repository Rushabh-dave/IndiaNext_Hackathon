export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function lerpColor(c1, c2, t) {
  return {
    r: Math.round(lerp(c1.r, c2.r, t)),
    g: Math.round(lerp(c1.g, c2.g, t)),
    b: Math.round(lerp(c1.b, c2.b, t))
  };
}

// 7-Step Green to Red Spectrum
export const C_1 = { r: 34,  g: 197, b: 94 };  // Green
export const C_2 = { r: 101, g: 163, b: 13 };  // Green-Yellow
export const C_3 = { r: 163, g: 230, b: 53 };  // Yellow-Green
export const C_4 = { r: 234, g: 179, b: 8 };   // Yellow
export const C_5 = { r: 249, g: 115, b: 22 };  // Orange
export const C_6 = { r: 239, g: 68,  b: 68 };  // Red
export const C_7 = { r: 185, g: 28,  b: 28 };  // Dark REd

export const spectrum = [C_1, C_2, C_3, C_4, C_5, C_6, C_7];

export function getThreatColor(tNorm) {
  // tNorm is 0 to 1. We have 7 colors, meaning 6 intervals.
  const interval = 1 / 6;
  for (let i = 0; i < 6; i++) {
    if (tNorm <= (i + 1) * interval) {
      const localT = (tNorm - i * interval) / interval;
      return lerpColor(spectrum[i], spectrum[i + 1], localT);
    }
  }
  return C_7;
}

export function rgba(c, alpha) {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}
