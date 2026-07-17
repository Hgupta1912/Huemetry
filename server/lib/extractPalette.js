const { bucketPixelsByTone } = require('./imageProcessing.js');
const { runKMeans } = require('./kmeans.js');
const { rgbToHsv, rgbToHex, rgbToLab } = require('./colorConversion.js');
const { consolidateClusters } = require('./consolidateClusters.js');

const CLUSTERS_PER_PALETTE = 5;
const CLUSTERS_PER_TONAL_BUCKET = 3;
const OVER_CLUSTER_MULTIPLIER = 2;

const SATURATION_BOOST = 3;

const computeSaliencyWeights = (pixels) => {
  if (pixels.length === 0) return [];
  return pixels.map(([r, g, b]) => {
    const { s } = rgbToHsv(r, g, b);
    return 1 + SATURATION_BOOST * (s / 100);
  });
};

// Runs saliency-weighted k-means, over-clustered by OVER_CLUSTER_MULTIPLIER,
// then consolidates down to the true target count, merging near-duplicate
// neutrals and pruning weak clusters rather than letting k-means alone
// decide the final count. This gives small, vivid, distinct color regions
// (like a lone terracotta accent against a field of near-identical grays) a
// real chance to survive, instead of losing their palette slot to three
// slightly-different versions of the same dominant neutral.
const clustersToColors = (pixels, targetCount) => {
  if (pixels.length === 0) return [];

  const weights = computeSaliencyWeights(pixels);

  const labPixels = pixels.map(([r, g, b]) => {
    const { l, a, b: bLab } = rgbToLab(r, g, b);
    return [l, a, bLab];
  });

  const overClusterCount = targetCount * OVER_CLUSTER_MULTIPLIER;
  const rawClusters = runKMeans(labPixels, overClusterCount, weights);
  const finalClusters = consolidateClusters(rawClusters, targetCount);

  return finalClusters.map(({ rgb, weight }) => {
    const [r, g, b] = rgb;
    const { h, s, v } = rgbToHsv(r, g, b);
    return {
      hex: rgbToHex(r, g, b),
      weight,
      hue: h,
      saturation: s,
      value: v,
    };
  });
};

const extractPalette =  (pixels) => {
  const { shadows, midtones, highlights } = bucketPixelsByTone(pixels);

  return {
    overall: clustersToColors(pixels, CLUSTERS_PER_PALETTE),
    shadow: clustersToColors(shadows, CLUSTERS_PER_TONAL_BUCKET),
    midtone: clustersToColors(midtones, CLUSTERS_PER_TONAL_BUCKET),
    highlight: clustersToColors(highlights, CLUSTERS_PER_TONAL_BUCKET),
  };
};

// Flattens the 4-tonal-range palette object into one array of Color-row-shaped
// objects, each tagged with which tonal range it came from; this is the shape
// Prisma needs for a nested `colors: { create: [...] }` write.
const flattenPalettesToColorRows = (palettes) => {
  const rows = [];
  for (const tonalRange of ['overall', 'shadow', 'midtone', 'highlight']) {
    for (const color of palettes[tonalRange]) {
      rows.push({ ...color, tonalRange });
    }
  }
  return rows;
};

// Inverse of the above. Regroups a flat array of colors (from the database,
// or from flattenPalettesToColorRows) back into the 4-tonal-range shape that
// compareToReference expects.
const groupColorsByTonalRange = (colors) => {
  const grouped = { overall: [], shadow: [], midtone: [], highlight: [] };
  for (const c of colors) {
    if (grouped[c.tonalRange]) {
      grouped[c.tonalRange].push({ hex: c.hex, weight: c.weight });
    }
  }
  return grouped;
};

module.exports = { extractPalette, flattenPalettesToColorRows, groupColorsByTonalRange }