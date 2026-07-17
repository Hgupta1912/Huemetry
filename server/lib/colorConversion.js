const { rgb, converter } = require('culori');

const toLab = converter('lab');


// Converts RGB (0-255 each) to HSV. h: 0-360, s: 0-100, v: 0-100.
const rgbToHsv = (r, g, b) => {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  // Hue is derived from which channel dominates, and how the other two compare.
  let h = 0;
  if (delta !== 0) {
    if (max === rNorm) {
      h = 60 * (((gNorm - bNorm) / delta) % 6);
    } else if (max === gNorm) {
      h = 60 * ((bNorm - rNorm) / delta + 2);
    } else {
      h = 60 * ((rNorm - gNorm) / delta + 4);
    }
  }
  if (h < 0) h += 360; // wrap negative hues back into 0-360

  const s = max === 0 ? 0 : (delta / max) * 100;
  const v = max * 100;

  return { h, s, v };
};

// Converts RGB (0-255 each) to a hex string, e.g. "#a4785f"
const rgbToHex = (r, g, b) => {
  const toHex = (n) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Scores a hue's warmth from -1 (coolest, ~210°) to 1 (warmest, ~30°/orange).
const getWarmthScore = (hue) => {
  const distanceFromWarmCenter = Math.min(
    Math.abs(hue - 30),
    Math.abs(hue - 30 + 360),
    Math.abs(hue - 30 - 360)
  );
  return 1 - (distanceFromWarmCenter / 90);
};

// Converts RGB (0-255 each) to CIELAB using culori (a well-maintained,
// CSS-Color-4-compliant conversion library) rather than hand-rolled matrix
// math — this is a solved color-science formula, not part of the app's own
// algorithm design, so it's the right place to lean on a library.
const rgbToLab = (r, g, b) => {
  const lab = toLab({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255 });
  return { l: lab.l, a: lab.a, b: lab.b };
};

// Converts CIELAB back to RGB (0-255 each, rounded and clamped).
const labToRgb = (l, a, b) => {
  const result = rgb({ mode: 'lab', l, a, b });
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  return { r: clamp(result.r), g: clamp(result.g), b: clamp(result.b) };
};

module.exports = { rgbToHsv, rgbToHex, getWarmthScore, rgbToLab, labToRgb };