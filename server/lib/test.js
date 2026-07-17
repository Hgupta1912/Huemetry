// const { rgbToHsv, rgbToHex, getWarmthScore } = require('./colorConversion.js');

// console.log(rgbToHsv(255, 0, 0));   // pure red → { h: 0, s: 100, v: 100 }
// console.log(rgbToHsv(0, 0, 255));   // pure blue → { h: 240, s: 100, v: 100 }
// console.log(rgbToHex(255, 0, 0));   // "#ff0000"
// console.log(getWarmthScore(0));     // close to warm center → high positive score
// console.log(getWarmthScore(210));   // opposite of warm center → close to -1




// const { runKMeans } = require('./kmeans.js');

// // ---------- Test 1: two well-separated color groups ----------
// // Expect: 2 clusters, one centered near red, one near blue, weights ~0.5 each.
// console.log('--- Test 1: two separated clusters (k=2) ---');
// const twoGroups = [
//   [255, 0, 0], [250, 5, 5], [245, 0, 10], [252, 3, 2],
//   [0, 0, 255], [5, 0, 250], [0, 5, 245], [3, 2, 252],
// ];
// console.log(runKMeans(twoGroups, 2));

// // ---------- Test 2: three well-separated color groups ----------
// // Expect: 3 clusters — red-ish, green-ish, blue-ish — weights ~0.33 each.
// console.log('\n--- Test 2: three separated clusters (k=3) ---');
// const threeGroups = [
//   [255, 0, 0], [250, 5, 5], [245, 10, 0],
//   [0, 255, 0], [5, 250, 5], [10, 245, 0],
//   [0, 0, 255], [5, 0, 250], [0, 10, 245],
// ];
// console.log(runKMeans(threeGroups, 3));

// // ---------- Test 3: unbalanced weights ----------
// // Expect: 2 clusters, but weights should reflect the imbalance (~0.8 / ~0.2),
// // not come back as an even 0.5/0.5 split.
// console.log('\n--- Test 3: unbalanced cluster sizes (k=2) ---');
// const unbalanced = [
//   [200, 50, 50], [205, 45, 55], [195, 55, 45], [202, 48, 52],
//   [201, 52, 49], [198, 47, 53], [203, 50, 51], [199, 49, 50],
//   [0, 200, 0], [5, 195, 5],
// ];
// console.log(runKMeans(unbalanced, 2));

// // ---------- Test 4: single solid color ----------
// // Expect: k clusters returned (structurally), but all centers should be
// // identical (or extremely close) since there's only one real color present.
// console.log('\n--- Test 4: single solid color (k=3) ---');
// const solidColor = Array.from({ length: 50 }, () => [128, 64, 200]);
// console.log(runKMeans(solidColor, 3));

// // ---------- Test 5: weights sum to 1 ----------
// console.log('\n--- Test 5: weight sum check ---');
// const result5 = runKMeans(threeGroups, 3);
// const weightSum = result5.reduce((sum, c) => sum + c.weight, 0);
// console.log('Total weight (should be ~1):', weightSum);

// // ---------- Test 6: consistency across multiple calls ----------
// // Since restarts pick the lowest-inertia result, repeated calls on the same
// // well-separated data should converge to very similar answers each time,
// // despite the random initialization.
// console.log('\n--- Test 6: consistency across repeated runs ---');
// for (let i = 0; i < 3; i++) {
//   console.log(`Run ${i + 1}:`, runKMeans(twoGroups, 2).map((c) => c.rgb));
// }


// const fs = require('fs');
// const path = require('path');
// const { getPixelData, bucketPixelsByTone } = require('./imageProcessing.js');

// // ---------- Test 1: bucketPixelsByTone with made-up pixels ----------
// // A mix of dark, mid, and light pixels — expect roughly a 3-way split,
// // with dark pixels in shadows, mid-brightness in midtones, bright in highlights.
// console.log('--- Test 1: bucketPixelsByTone ---');
// const testPixels = [
//   [10, 10, 10], [20, 15, 5], [5, 5, 20],     // dark
//   [120, 130, 110], [100, 90, 140], [140, 120, 100], // mid
//   [240, 250, 245], [255, 240, 230], [230, 255, 240], // bright
// ];
// const buckets = bucketPixelsByTone(testPixels);
// console.log('shadows:', buckets.shadows.length);
// console.log('midtones:', buckets.midtones.length);
// console.log('highlights:', buckets.highlights.length);
// console.log('(should roughly be 3/3/3 given the input)');

// // ---------- Test 2: bucketPixelsByTone with all-identical pixels ----------
// // Edge case — every pixel has the same value, so percentile cutoffs collapse.
// // Just confirming this doesn't crash and every pixel lands somewhere.
// console.log('\n--- Test 2: all-identical pixels (edge case) ---');
// const flatPixels = Array.from({ length: 20 }, () => [128, 128, 128]);
// const flatBuckets = bucketPixelsByTone(flatPixels);
// const totalBucketed = flatBuckets.shadows.length + flatBuckets.midtones.length + flatBuckets.highlights.length;
// console.log('total pixels in:', flatPixels.length, '| total bucketed:', totalBucketed, '(should match)');

// // ---------- Test 3: getPixelData with a real image file ----------
// // Point this at any real image on your machine to sanity-check resizing + pixel extraction.
// console.log('\n--- Test 3: getPixelData with a real image ---');
// const imagePath = process.argv[2]; // pass a file path as a command-line arg

// if (!imagePath) {
//   console.log('No image path provided. Run again like:');
//   console.log('  node imageProcessing.test.js /path/to/some/image.jpg');
// } else {
//   (async () => {
//     const buffer = fs.readFileSync(path.resolve(imagePath));
//     const { pixels, width, height } = await getPixelData(buffer);

//     console.log('Resized dimensions:', width, 'x', height, '(should fit within 200x200, aspect ratio preserved)');
//     console.log('Pixel count:', pixels.length, '(should equal width * height)');
//     console.log('Expected pixel count:', width * height);
//     console.log('First pixel:', pixels[0]);
//     console.log('Last pixel:', pixels[pixels.length - 1]);
//     console.log('Sample pixel (middle):', pixels[Math.floor(pixels.length / 2)]);
//   })();
// }



// const { computeImageStatistics, summarizeDistribution, getPercentile } = require('./imageStatistics.js');

// // ---------- Test 1: getPercentile basics ----------
// console.log('--- Test 1: getPercentile ---');
// const sorted = [10, 20, 30, 40, 50];
// console.log('median (0.5):', getPercentile(sorted, 0.5), '(should be 30)');
// console.log('q1 (0.25):', getPercentile(sorted, 0.25), '(should be 20)');
// console.log('q3 (0.75):', getPercentile(sorted, 0.75), '(should be 40)');
// console.log('min (0):', getPercentile(sorted, 0), '(should be 10)');
// console.log('max (1):', getPercentile(sorted, 1), '(should be 50)');

// // ---------- Test 2: summarizeDistribution with a clean, no-outlier dataset ----------
// console.log('\n--- Test 2: summarizeDistribution, no outliers ---');
// const cleanData = [20, 25, 30, 35, 40, 45, 50, 55, 60];
// const cleanSummary = summarizeDistribution(cleanData);
// console.log(cleanSummary);
// console.log('outliers.count should be 0:', cleanSummary.outliers.count === 0);

// // ---------- Test 3: summarizeDistribution with real outliers ----------
// console.log('\n--- Test 3: summarizeDistribution, with outliers ---');
// const dataWithOutliers = [20, 21, 22, 23, 24, 25, 26, 27, 28, 95, 2];
// const outlierSummary = summarizeDistribution(dataWithOutliers);
// console.log(outlierSummary);
// console.log('outliers.count should be >= 1:', outlierSummary.outliers.count >= 1);
// console.log('mostExtremeHigh should be near 95:', outlierSummary.outliers.mostExtremeHigh);
// console.log('mostExtremeLow should be near 2:', outlierSummary.outliers.mostExtremeLow);

// // ---------- Test 4: computeImageStatistics with a warm-toned image ----------
// // All reddish/orange pixels — expect a high positive temperature score, low stddev
// // (since every pixel is similarly warm, spread should be small).
// console.log('\n--- Test 4: computeImageStatistics, uniformly warm pixels ---');
// const warmPixels = [
//   [230, 100, 50], [220, 90, 40], [240, 110, 60], [235, 95, 45],
//   [225, 105, 55], [245, 100, 50], [215, 90, 60], [230, 95, 40],
// ];
// const warmStats = computeImageStatistics(warmPixels);
// console.log('temperature:', warmStats.temperature, '(score should be positive, stddev should be low)');

// // ---------- Test 5: computeImageStatistics with a mixed warm/cool image ----------
// // Half warm, half cool — expect temperature score near 0, but HIGH stddev
// // (this is the exact case that motivated tracking spread, not just average).
// console.log('\n--- Test 5: computeImageStatistics, mixed warm/cool pixels ---');
// const mixedPixels = [
//   [230, 100, 50], [235, 95, 45], [225, 105, 55], [240, 110, 60], // warm
//   [50, 100, 230], [45, 95, 235], [55, 105, 225], [60, 110, 240], // cool
// ];
// const mixedStats = computeImageStatistics(mixedPixels);
// console.log('temperature:', mixedStats.temperature, '(score should be near 0, stddev should be HIGH)');

// // ---------- Test 6: sanity check saturation/value ranges ----------
// console.log('\n--- Test 6: saturation/value bounds check ---');
// const randomPixels = Array.from({ length: 100 }, () => [
//   Math.floor(Math.random() * 256),
//   Math.floor(Math.random() * 256),
//   Math.floor(Math.random() * 256),
// ]);
// const randomStats = computeImageStatistics(randomPixels);
// console.log('saturation min/max within 0-100:', randomStats.saturation.min >= 0 && randomStats.saturation.max <= 100);
// console.log('value min/max within 0-100:', randomStats.value.min >= 0 && randomStats.value.max <= 100);




const fs = require('fs');
const path = require('path');
const { extractPalette } = require('./extractPalette.js');

const imagePath = process.argv[2];

if (!imagePath) {
  console.log('No image path provided. Run like:');
  console.log('  node extractPalette.test.js /path/to/some/image.jpg');
  process.exit(0);
}

(async () => {
  const buffer = fs.readFileSync(path.resolve(imagePath));

  console.time('extractPalette');
  const palettes = await extractPalette(buffer);
  console.timeEnd('extractPalette');

  for (const tonalRange of ['overall', 'shadow', 'midtone', 'highlight']) {
    console.log(`\n--- ${tonalRange} ---`);
    const colors = palettes[tonalRange];
    console.log('cluster count:', colors.length);

    const weightSum = colors.reduce((sum, c) => sum + c.weight, 0);
    console.log('weight sum (should be ~1, or 0 if bucket was empty):', weightSum.toFixed(3));

    colors.forEach((color, i) => {
      console.log(
        `  [${i}] ${color.hex}  weight=${color.weight.toFixed(3)}  h=${color.hue.toFixed(1)}  s=${color.saturation.toFixed(1)}  v=${color.value.toFixed(1)}`
      );
    });
  }

  // --- Sanity checks ---
  console.log('\n--- Sanity checks ---');

  console.log('overall has clusters:', palettes.overall.length > 0);

  // Consolidation should always leave AT MOST the target count, never more.
  console.log('overall cluster count <= 5:', palettes.overall.length <= 5);
  console.log('shadow cluster count <= 3:', palettes.shadow.length <= 3);
  console.log('midtone cluster count <= 3:', palettes.midtone.length <= 3);
  console.log('highlight cluster count <= 3:', palettes.highlight.length <= 3);

  // No two colors in the same palette should be exact duplicates — if
  // merging worked, nothing this close should have survived consolidation.
  const checkNoDuplicates = (colors, label) => {
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        if (colors[i].hex === colors[j].hex) {
          console.log(`  WARNING: ${label} has an exact duplicate hex (${colors[i].hex})`);
        }
      }
    }
  };
  checkNoDuplicates(palettes.overall, 'overall');

  // Every hex should be a valid 7-character hex string.
  const validHex = /^#[0-9a-f]{6}$/i;
  const allValidHex = Object.values(palettes)
    .flat()
    .every((c) => validHex.test(c.hex));
  console.log('all hex codes well-formed:', allValidHex);

  // HSV values should be within their expected ranges.
  const allInRange = Object.values(palettes)
    .flat()
    .every((c) => c.hue >= 0 && c.hue <= 360 && c.saturation >= 0 && c.saturation <= 100 && c.value >= 0 && c.value <= 100);
  console.log('all HSV values within expected ranges:', allInRange);
})();