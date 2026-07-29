const { rgbToHsv, getWarmthScore } = require('./colorConversion.js');

const HUE_BINS = 36;
const SV_BINS = 25;

// Linear-interpolation percentile (the standard method for quartiles/median);
// more accurate than simple index-rounding for box plot purposes.
const getPercentile = (sortedValues, percentile) => {
  const index = (sortedValues.length - 1) * percentile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
};

const summarizeOutliers = (outliers, lowerFence, upperFence) => {
  const low = outliers.filter((v) => v < lowerFence);
  const high = outliers.filter((v) => v > upperFence);
  return {
    count: outliers.length,
    lowCount: low.length,
    highCount: high.length,
    mostExtremeLow: low.length > 0 ? Math.min(...low) : null,
    mostExtremeHigh: high.length > 0 ? Math.max(...high) : null,
  };
};

// Full box-plot summary for one array of numeric values (0-100 scale,
// used for both saturation and value): quartiles, fences, outliers,
// plus both the actual data range and the theoretical 0-100 range.
const summarizeDistribution = (values) => {
  const sorted = [...values].sort((a, b) => a - b);

  const q1 = getPercentile(sorted, 0.25);
  const median = getPercentile(sorted, 0.5);
  const q3 = getPercentile(sorted, 0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;

  const nonOutliers = sorted.filter((v) => v >= lowerFence && v <= upperFence);
  const whiskerLow = nonOutliers.length > 0 ? nonOutliers[0] : q1;
  const whiskerHigh = nonOutliers.length > 0 ? nonOutliers[nonOutliers.length - 1] : q3;

  const outliers = sorted.filter((v) => v < lowerFence || v > upperFence);

  return {
    min: sorted[0],
    q1,
    median,
    q3,
    max: sorted[sorted.length - 1],
    lowerFence,
    upperFence,
    whiskerLow,  
    whiskerHigh, 
    outliers: summarizeOutliers(outliers, lowerFence, upperFence),
    theoreticalMin: 0,
    theoreticalMax: 100,
  };
};

// Bins a set of 0-max-range values into `binCount` equal-width buckets,
// returning an array of frequencies (one count per bin). Values exactly at
// the maximum are clamped into the last bin rather than overflowing it.
const buildHistogram = (values, max, binCount) => {
  const bins = new Array(binCount).fill(0);
  const binWidth = max / binCount;

  for (const value of values) {
    const binIndex = Math.min(binCount - 1, Math.floor(value / binWidth));
    bins[binIndex]++;
  }

  return bins;
};

// Single-pass extraction of everything the box plots, histograms, and
// temperature score need; avoids looping over all pixels multiple times
// for what are really related metrics off the same HSV data.
//
// `isMonochrome` skips hue/saturation and temperature analysis entirely
// (meaningless for grayscale/single-ink pieces; hue is arbitrary noise on
// a piece with no real color variation), keeping only value-based analysis,
// which remains genuinely meaningful for monochrome/value-based work.
const computeImageStatistics = (pixels, isMonochrome = false) => {
  const values = [];
  const saturations = [];
  const hues = [];
  const warmthScores = [];

  for (const [r, g, b] of pixels) {
    const { h, s, v } = rgbToHsv(r, g, b);
    values.push(v);
    if (!isMonochrome) {
      saturations.push(s);
      hues.push(h);
      warmthScores.push(getWarmthScore(h));
    }
  }

  const valueHistogram = buildHistogram(values, 100, SV_BINS);

  if (isMonochrome) {
    return {
      value: summarizeDistribution(values),
      histograms: {
        value: valueHistogram,
      },
    };
  }
  
  const warmthMean = warmthScores.reduce((sum, w) => sum + w, 0) / warmthScores.length;
  const warmthVariance =
    warmthScores.reduce((sum, w) => sum + (w - warmthMean) ** 2, 0) / warmthScores.length;
  const warmthStdDev = Math.sqrt(warmthVariance);

  return {
    saturation: summarizeDistribution(saturations),
    value: summarizeDistribution(values),
    temperature: {
      score: warmthMean,
      standardDeviation: warmthStdDev,
    },
    histograms: {
      hue: buildHistogram(hues, 360, HUE_BINS),
      saturation: buildHistogram(saturations, 100, SV_BINS),
      value: valueHistogram,
    },
  };
};

module.exports = { computeImageStatistics, summarizeDistribution, buildHistogram, getPercentile };