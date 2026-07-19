const { bucketPixelsByTone } = require('./imageProcessing.js');
const { runKMeans } = require('./kmeans.js');
const { rgbToHsv, hsvToRgb, rgbToHex, rgbToLab } = require('./colorConversion.js');
const { consolidateClusters } = require('./consolidateClusters.js');
const { summarizeDistribution } = require('./imageStatistics.js');


const CLUSTERS_PER_PALETTE = 5;
const CLUSTERS_PER_TONAL_BUCKET = 3;
const OVER_CLUSTER_MULTIPLIER = 2;

const BASE_SATURATION_BOOST = 2;
const MAX_ADAPTIVE_BOOST = 7;

const CONTRAST_BOOST = 5;
const MAX_LAB_DISTANCE = 100;

const computeAdaptiveSaturationBoost = (pixels) => {
  const saturations = pixels.map(([r, g, b]) => rgbToHsv(r, g, b).s);
  const stats = summarizeDistribution(saturations);

  const medianFactor = stats.median / 100; // 0-1
  const spreadFactor = Math.min(1, (stats.q3 - stats.q1) / 50); // IQR of 50+ points = max spread signal

  const combinedSignal = medianFactor * spreadFactor; // both need to be present together

  return BASE_SATURATION_BOOST + combinedSignal * (MAX_ADAPTIVE_BOOST - BASE_SATURATION_BOOST);
};

// Given the final overall palette, decides whether the piece is generally
// vivid AND varied enough to warrant an artificial saturation punch-up on
// the displayed swatches; purely cosmetic, doesn't affect clustering.
const getSaturationPunch = (overallColors) => {
  const saturations = overallColors.map((c) => c.saturation);
  const stats = summarizeDistribution(saturations);

  const medianHigh = stats.median > 50;
  const spreadHigh = (stats.q3 - stats.q1) > 10;

  if (medianHigh && spreadHigh) return 1.19; // 15% saturation boost
  return 1; // 5% change
};

// Applies a saturation multiplier to one color, clamping at 100.
const boostColorSaturation = (color, multiplier) => {
  if (multiplier === 1) return color; 

  const newSaturation = Math.min(100, color.saturation * multiplier);
  const { r, g, b } = hsvToRgb(color.hue, newSaturation, color.value);

  return {
    ...color,
    hex: rgbToHex(r, g, b),
    saturation: newSaturation,
  };
};

const computeSaliencyWeights = (pixels, saturationBoost) => {
  if (pixels.length === 0) return [];

  const labPixels = pixels.map(([r, g, b]) => {
    const { l, a, b: bLab } = rgbToLab(r, g, b);
    return [l, a, bLab];
  });

  const meanLab = labPixels.reduce(
    (acc, [l, a, b]) => [acc[0] + l, acc[1] + a, acc[2] + b],
    [0, 0, 0]
  ).map((sum) => sum / labPixels.length);

  return pixels.map(([r, g, b], i) => {
    const { s } = rgbToHsv(r, g, b);
    const saturationFactor = s / 100;

    const [l, a, bLab] = labPixels[i];
    const distFromMean = Math.sqrt(
      (l - meanLab[0]) ** 2 + (a - meanLab[1]) ** 2 + (bLab - meanLab[2]) ** 2
    );
    const contrastFactor = Math.min(1, distFromMean / MAX_LAB_DISTANCE);

    return 1 + saturationBoost * saturationFactor + CONTRAST_BOOST * contrastFactor;
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

  const saturationBoost = computeAdaptiveSaturationBoost(pixels);
  const weights = computeSaliencyWeights(pixels, saturationBoost);

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

const extractPalette = (pixels) => {
  const { shadows, midtones, highlights } = bucketPixelsByTone(pixels);

  const overall = clustersToColors(pixels, CLUSTERS_PER_PALETTE);
  const punch = getSaturationPunch(overall);



  const result = {
    overall: overall.map((c) => boostColorSaturation(c, punch)),
    shadow: clustersToColors(shadows, CLUSTERS_PER_TONAL_BUCKET).map((c) => boostColorSaturation(c, punch)),
    midtone: clustersToColors(midtones, CLUSTERS_PER_TONAL_BUCKET).map((c) => boostColorSaturation(c, punch)),
    highlight: clustersToColors(highlights, CLUSTERS_PER_TONAL_BUCKET).map((c) => boostColorSaturation(c, punch)),
  };

  for (const [range, colors] of Object.entries(result)) {
    colors.forEach((c, i) => {
      if (!c || !c.hex) {
        console.log(`BAD ENTRY in ${range}[${i}]:`, c);
      }
    });
  }

  return result;
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