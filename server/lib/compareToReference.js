const { rgbToLab } = require('./colorConversion.js');

const labDistance = (labA, labB) => {
  const dl = labA[0] - labB[0];
  const da = labA[1] - labB[1];
  const db = labA[2] - labB[2];
  return Math.sqrt(dl * dl + da * da + db * db);
};

const hexToRgb = (hex) => {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
};

// For each reference color, finds its nearest match in the WIP's palette
// (LAB space, consistent with clustering/consolidation elsewhere) and
// reports the distance. A high average distance means the WIP's colors
// don't have good matches anywhere in the reference's palette; either
// missing colors the reference has, or introducing colors it doesn't.
const matchPalettes = (referenceColors, wipColors) => {
  if (referenceColors.length === 0 || wipColors.length === 0) {
    return { matches: [], averageDistance: null, unmatchedWipColors: [] };
  }

  const wipLab = wipColors.map((c) => rgbToLab(...hexToRgb(c.hex)));
  const matchedWipIndices = new Set();

  const matches = referenceColors.map((refColor) => {
    const refLab = rgbToLab(...hexToRgb(refColor.hex));

    let closestIndex = 0;
    let closestDist = Infinity;
    wipLab.forEach((wLab, j) => {
      const dist = labDistance([refLab.l, refLab.a, refLab.b], [wLab.l, wLab.a, wLab.b]);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = j;
      }
    });

    matchedWipIndices.add(closestIndex);

    return {
      referenceHex: refColor.hex,
      referenceWeight: refColor.weight,
      closestWipHex: wipColors[closestIndex].hex,
      distance: closestDist,
    };
  });

  // Weight the average by how prominent each reference color is. A poor
  // match on a color that covers 40% of the reference matters more than a
  // poor match on one covering 2%.
  const totalWeight = matches.reduce((sum, m) => sum + m.referenceWeight, 0);
  const averageDistance =
    totalWeight > 0
      ? matches.reduce((sum, m) => sum + m.distance * m.referenceWeight, 0) / totalWeight
      : matches.reduce((sum, m) => sum + m.distance, 0) / matches.length;

  // WIP colors that no reference color picked as its nearest neighbor;
  // these are colors present in the WIP that don't correspond to anything
  // in the reference's palette (e.g. a hue the artist introduced that
  // wasn't part of the original reference at all).
  const unmatchedWipColors = wipColors
    .filter((_, i) => !matchedWipIndices.has(i))
    .map((c) => ({ hex: c.hex, weight: c.weight }));

  return { matches, averageDistance, unmatchedWipColors };
};

// Signed delta between a WIP's scalar stat and the reference's, plus a
// human-readable direction label. Positive delta = WIP is higher than reference.
const compareScalar = (wipValue, referenceValue) => {
  if (wipValue == null || referenceValue == null) return null;
  const delta = wipValue - referenceValue;
  return {
    reference: referenceValue,
    wip: wipValue,
    delta,
    direction: delta > 0 ? 'higher' : delta < 0 ? 'lower' : 'equal',
  };
};

// Full comparison between a reference photo and a WIP/final session.
// `reference` and `wip` are each { palettes, statistics } — palettes being
// the four-tonal-range output of extractPalette, statistics being the
// output of computeImageStatistics. Tonal-range (shadow/midtone/highlight)
// comparison is palette-matching only; scalar (saturation/value/temperature)
// deltas are computed overall only, since computeImageStatistics doesn't
// break box-plot stats down per tonal range.
const compareToReference = (reference, wip) => {
  const saturation =
    reference.statistics?.saturation && wip.statistics?.saturation
      ? compareScalar(wip.statistics.saturation.median, reference.statistics.saturation.median)
      : null;

  const value =
    reference.statistics?.value && wip.statistics?.value
      ? compareScalar(wip.statistics.value.median, reference.statistics.value.median)
      : null;

  const temperature =
    reference.statistics?.temperature && wip.statistics?.temperature
      ? compareScalar(wip.statistics.temperature.score, reference.statistics.temperature.score)
      : null;

  return {
    //possibly remove shadow/midtone/highlight from returned comparative stats
    palette: {
      overall: matchPalettes(reference.palettes.overall, wip.palettes.overall),
      shadow: matchPalettes(reference.palettes.shadow, wip.palettes.shadow),
      midtone: matchPalettes(reference.palettes.midtone, wip.palettes.midtone),
      highlight: matchPalettes(reference.palettes.highlight, wip.palettes.highlight),
    },
    saturation,
    value,
    temperature,
  };
};

module.exports = { compareToReference };