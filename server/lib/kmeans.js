const { labToRgb } = require('./colorConversion.js');

// --- Core distance function ---

// Squared Euclidean distance between two 3D color points (LAB triples).
// Squared, not true distance, since we only ever compare distances to each
// other and never need the actual magnitude (skipping the sqrt is cheaper).
const squaredDistance = (a, b) => {
  const d0 = a[0] - b[0];
  const d1 = a[1] - b[1];
  const d2 = a[2] - b[2];
  return d0 * d0 + d1 * d1 + d2 * d2;
};

// --- Initialization ---

// k-means++ initialization: picks k starting centers, weighted so that
// points far from already-chosen centers are more likely to be picked next.
// This avoids the classic random-init failure mode where two centers land
// close together and waste a cluster. Initialization is purely geometric
// (not saliency-weighted)
const initializeCenters = (pixels, k) => {
  const centers = [pixels[Math.floor(Math.random() * pixels.length)]];

  while (centers.length < k) {
    const distances = pixels.map((pixel) => {
      let minDist = Infinity;
      for (const center of centers) {
        const dist = squaredDistance(pixel, center);
        if (dist < minDist) minDist = dist;
      }
      return minDist;
    });

    const totalDist = distances.reduce((sum, d) => sum + d, 0);

    // Weighted random pick: walk the distance list, subtracting as we go.
    // Larger distances are more likely to be the one that tips the running
    // total below zero, so farther (underserved) points get picked more often.
    let rand = Math.random() * totalDist;
    let chosenIndex = 0;
    for (let i = 0; i < distances.length; i++) {
      rand -= distances[i];
      if (rand <= 0) {
        chosenIndex = i;
        break;
      }
    }
    centers.push(pixels[chosenIndex]);
  }

  return centers;
};

// --- Assignment step ---

// Assigns every pixel to the index of its nearest center. Purely geometric
// and unweighted; a pixel belongs to whichever center it's actually
// closest to, regardless of its saliency weight.
const assignClusters = (pixels, centers) => {
  return pixels.map((pixel) => {
    let minDist = Infinity;
    let clusterIndex = 0;
    for (let i = 0; i < centers.length; i++) {
      const dist = squaredDistance(pixel, centers[i]);
      if (dist < minDist) {
        minDist = dist;
        clusterIndex = i;
      }
    }
    return clusterIndex;
  });
};

// --- Update step ---

// Recomputes each center as the saliency-WEIGHTED average of the pixels
// assigned to it. Higher-weight pixels (more saturated/contrasting, per
// computeSaliencyWeights) pull the center toward themselves more strongly
// than low-weight pixels. This is what lets a small but visually striking
// region earn its own cluster instead of being absorbed into a larger,
// duller neighboring color. A cluster with zero assigned pixels returns
// null, signaling the caller to keep that center's previous position.
const recomputeCenters = (pixels, assignments, k, weights) => {
  const sums = Array.from({ length: k }, () => [0, 0, 0]);
  const weightSums = new Array(k).fill(0);

  pixels.forEach((pixel, i) => {
    const cluster = assignments[i];
    const w = weights[i];
    sums[cluster][0] += pixel[0] * w;
    sums[cluster][1] += pixel[1] * w;
    sums[cluster][2] += pixel[2] * w;
    weightSums[cluster] += w;
  });

  return sums.map((sum, i) => {
    if (weightSums[i] === 0) return null;
    return [sum[0] / weightSums[i], sum[1] / weightSums[i], sum[2] / weightSums[i]];
  });
};

// --- Single run ---

// Runs k-means clustering once, to convergence (or maxIterations).
// `pixels` and the returned `centers` are LAB triples throughout; this
// function never touches RGB. `clusters[].rgb`, however, IS converted to
// RGB here, since that field is the display/output-facing summary, while
// `centers` stays in LAB because callers (calculateInertia, snapToRealPixels)
// need it in the same space as `pixels` for their distance math to be valid.
const runKMeansOnce = (pixels, k, weights, maxIterations = 20) => {
  if (pixels.length === 0) return { clusters: [], assignments: [], centers: [] };

  if (pixels.length <= k) {
    // Not enough pixels to form k distinct clusters, so treat each pixel as
    // its own singleton cluster.
    return {
      clusters: pixels.map((p) => {
        const { r, g, b } = labToRgb(p[0], p[1], p[2]);
        return { rgb: [r, g, b], weight: 1 / pixels.length };
      }),
      assignments: pixels.map((_, i) => i),
      centers: pixels, // stays LAB — used internally, converted only at final output
    };
  }

  let centers = initializeCenters(pixels, k);
  let assignments = [];

  for (let iter = 0; iter < maxIterations; iter++) {
    const newAssignments = assignClusters(pixels, centers);

    // Converged: no pixel changed clusters since the last iteration.
    if (
      assignments.length > 0 &&
      newAssignments.every((cluster, i) => cluster === assignments[i])
    ) {
      assignments = newAssignments;
      break;
    }

    assignments = newAssignments;
    const newCenters = recomputeCenters(pixels, assignments, k, weights);
    centers = newCenters.map((c, i) => c ?? centers[i]); // keep old center if a cluster went empty
  }

  // Reported cluster `weight` is the TRUE, unweighted area proportion
  // (raw pixel count / total pixels). Saliency only ever influences WHERE
  // a center lands, never how prominent the color is reported to be. This
  // keeps the palette's coverage percentages honest and interpretable.
  const counts = new Array(k).fill(0);
  assignments.forEach((cluster) => counts[cluster]++);

  const clusters = centers.map((rgb, i) => ({
    rgb, // NOTE: still LAB at this point (converted by the caller (runKMeans))
    weight: counts[i] / pixels.length,
  }));

  return { clusters, assignments, centers };
};

// --- Scoring ---

// Weighted sum of squared distances from each pixel to its assigned
// center (lower is better). Weighted consistently with recomputeCenters,
// so restart comparison doesn't fight against how centers were actually
// computed.
const calculateInertia = (pixels, assignments, centers, weights) => {
  return pixels.reduce((sum, pixel, i) => {
    return sum + weights[i] * squaredDistance(pixel, centers[assignments[i]]);
  }, 0);
};

// --- Post-processing ---

// Replaces each synthetic (averaged) center with the nearest REAL pixel
// from that cluster. This guarantees every reported color actually exists
// in the image, fixing the case where averaging several differently-hued
// saturated pixels together produces a muddy, desaturated blend that was
// never actually present anywhere in the artwork.
const snapToRealPixels = (pixels, assignments, centers) => {
  return centers.map((center, clusterIndex) => {
    let closestPixel = null;
    let closestDist = Infinity;

    pixels.forEach((pixel, i) => {
      if (assignments[i] !== clusterIndex) return;
      const dist = squaredDistance(pixel, center);
      if (dist < closestDist) {
        closestDist = dist;
        closestPixel = pixel;
      }
    });

    return closestPixel ?? center; // fallback to the synthetic center if a cluster was empty
  });
};

// --- Public entry point ---

// Runs k-means multiple times (different random inits via k-means++) and
// keeps the lowest-inertia result, protecting against a single unlucky
// initialization landing in a bad local optimum. `weights` defaults to
// uniform (all 1s) if omitted. `pixels` must be LAB triples; the final
// returned colors are converted to RGB exactly once, here, at the very end.
// This is the only place in the whole file where LAB becomes RGB.
const runKMeans = (pixels, k, weights, restarts = 5) => {
  if (pixels.length === 0) return [];

  if (pixels.length <= k) {
    return pixels.map((p) => {
      const { r, g, b } = labToRgb(p[0], p[1], p[2]);
      return { rgb: [r, g, b], weight: 1 / pixels.length };
    });
  }

  const actualWeights = weights ?? new Array(pixels.length).fill(1);

  let bestClusters = null;
  let bestAssignments = null;
  let bestCenters = null;
  let bestInertia = Infinity;

  for (let i = 0; i < restarts; i++) {
    const { clusters, assignments, centers } = runKMeansOnce(pixels, k, actualWeights);
    const inertia = calculateInertia(pixels, assignments, centers, actualWeights);

    if (inertia < bestInertia) {
      bestInertia = inertia;
      bestClusters = clusters;
      bestAssignments = assignments;
      bestCenters = centers;
    }
  }

  const realLabCenters = snapToRealPixels(pixels, bestAssignments, bestCenters);

  return bestClusters.map((cluster, i) => {
    const [l, a, b] = realLabCenters[i];
    const { r, g, b: bRgb } = labToRgb(l, a, b);
    return { rgb: [r, g, bRgb], weight: cluster.weight };
  });
};

module.exports = { runKMeans };