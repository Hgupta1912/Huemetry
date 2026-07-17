const { rgbToLab, rgbToHsv } = require('./colorConversion.js');

const labDistance = (a, b) => {
  const dl = a[0] - b[0];
  const da = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dl * dl + da * da + db * db);
};

// A cluster's "importance" for consolidation purposes: how much of the
// image it covers, weighted by how visually vivid it is. Kept consistent
// with the saliency weighting decision.
const scoreCluster = (cluster) => {
  const [r, g, b] = cluster.rgb;
  const { s } = rgbToHsv(r, g, b);
  return cluster.weight * (s / 100);
};

// Consolidates an over-clustered set of colors down to a target count.
// First merges any pair of clusters that are perceptually near-identical
// (Delta E76 (plain Euclidean distance in LAB space) below mergeThreshold),
// keeping the more vivid/prominent of the pair's color and combining their
// weights. If merging alone isn't enough to reach the target, prunes the
// remaining lowest-scoring clusters, redistributing each one's weight to
// its nearest surviving neighbor so the final weights still honestly sum
// to ~1 rather than silently losing coverage.
const consolidateClusters = (clusters, targetCount, mergeThreshold = 15) => {
  if (clusters.length <= targetCount) return clusters;

  let working = clusters.map((c) => ({
    rgb: c.rgb,
    weight: c.weight,
    lab: rgbToLab(c.rgb[0], c.rgb[1], c.rgb[2]),
    score: scoreCluster(c),
  }));

  // --- Merge pass: repeatedly combine the closest pair, if close enough ---
  while (working.length > targetCount) {
    let closestI = -1;
    let closestJ = -1;
    let closestDist = Infinity;

    for (let i = 0; i < working.length; i++) {
      for (let j = i + 1; j < working.length; j++) {
        const dist = labDistance(
          [working[i].lab.l, working[i].lab.a, working[i].lab.b],
          [working[j].lab.l, working[j].lab.a, working[j].lab.b]
        );
        if (dist < closestDist) {
          closestDist = dist;
          closestI = i;
          closestJ = j;
        }
      }
    }

    if (closestDist >= mergeThreshold) break; // nothing left worth merging

    const [a, b] = [working[closestI], working[closestJ]];
    const survivor = a.score >= b.score ? a : b;
    const absorbed = a.score >= b.score ? b : a;

    const merged = {
      ...survivor,
      weight: survivor.weight + absorbed.weight,
    };
    merged.score = merged.weight * (rgbToHsv(merged.rgb[0], merged.rgb[1], merged.rgb[2]).s / 100);

    working = working.filter((_, idx) => idx !== closestI && idx !== closestJ);
    working.push(merged);
  }

  // --- Prune pass: if merging alone wasn't enough, drop lowest-scoring
  // clusters one at a time, redistributing weight to the nearest survivor ---
  while (working.length > targetCount) {
    working.sort((x, y) => x.score - y.score);
    const weakest = working.shift();

    let nearest = null;
    let nearestDist = Infinity;
    for (const candidate of working) {
      const dist = labDistance(
        [weakest.lab.l, weakest.lab.a, weakest.lab.b],
        [candidate.lab.l, candidate.lab.a, candidate.lab.b]
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = candidate;
      }
    }
    if (nearest) nearest.weight += weakest.weight;
  }

  return working.map(({ rgb, weight }) => ({ rgb, weight }));
};

module.exports = { consolidateClusters };