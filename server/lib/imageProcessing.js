const sharp = require('sharp');
const { rgbToHsv } = require('./colorConversion.js');

const SHADOW_CUTOFF_PERCENTILE = .33;
const HIGHLIGHT_CUTOFF_PERCENTILE = .67;


// Downsamples and denoises an image buffer, then extracts raw RGB pixel data.
// Downsampling keeps k-means fast regardless of the original photo's resolution
// (a phone photo can easily be 20M+ pixels; far more than needed for a stable
// color palette). Blurring removes fine texture/grain noise (e.g. canvas weave,
// paper texture) before clustering, so noise doesn't fragment real color clusters.
const getPixelData = async (buffer) => {
  const { data, info } = await sharp(buffer)
    .resize(200, 200, { fit: 'inside' })
    .blur(1.5)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = [];
  for (let i = 0; i < data.length; i += info.channels) {
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }

  return { pixels, width: info.width, height: info.height };
};

// Sorts pixels into shadow/midtone/highlight buckets based on their HSV value,
// using percentile-based (adaptive) thresholds rather than fixed cutoffs; so a
// dark, moody painting's "highlights" are relative to that image's own brightness
// range, not judged against an absolute global scale.
const bucketPixelsByTone = (pixels) => {
  // Compute HSV once per pixel, reused for both the percentile calculation and bucketing.
  const withValues = pixels.map((pixel) => ({
    pixel,
    v: rgbToHsv(pixel[0], pixel[1], pixel[2]).v,
  }));

  const sortedValues = withValues.map((item) => item.v).sort((a, b) => a - b);
  const shadowCutoff = sortedValues[Math.floor(sortedValues.length * 0.33)];
  const highlightCutoff = sortedValues[Math.floor(sortedValues.length * 0.67)];

  const shadows = [];
  const midtones = [];
  const highlights = [];

  for (const { pixel, v } of withValues) {
    if (v <= shadowCutoff) {
      shadows.push(pixel);
    } else if (v <= highlightCutoff) {
      midtones.push(pixel);
    } else {
      highlights.push(pixel);
    }
  }

  return { shadows, midtones, highlights };
};

module.exports = { getPixelData, bucketPixelsByTone };