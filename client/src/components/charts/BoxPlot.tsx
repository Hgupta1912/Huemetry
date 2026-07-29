import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  type BarShapeProps,
  type TooltipContentProps,
} from 'recharts';

// The shape of one category's worth of box-plot statistics. This matches
// exactly what the backend's summarizeDistribution() function computes.
// One BoxPlotDatum = one box-and-whisker glyph on the chart.
export interface BoxPlotDatum {
  label: string; // the X-axis category label, e.g. "Session 1" or "Reference"
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  lowerFence: number;
  upperFence: number;
  whiskerLow: number;
  whiskerHigh: number;
  outliers: { count: number; mostExtremeLow: number | null; mostExtremeHigh: number | null };
  theoreticalMin: number; // the metric's real possible floor (e.g. 0 for saturation)
  theoreticalMax: number; // the metric's real possible ceiling (e.g. 100 for saturation)
}

// --- Custom shape components ---
// Recharts normally draws every <Bar> as a plain rectangle from 0 up to a
// single value. We don't want that. We want a real box-and-whisker glyph.
// The `shape` prop on <Bar> lets us completely override how each bar is
// drawn: Recharts still does all the data-to-pixel math (figuring out where
// on screen a given value should land), but instead of drawing its own
// rectangle, it calls OUR function and renders whatever SVG we return.
//
// Recharts calls these functions once per data entry, passing:
//   - x, y               → the pixel position of the bar's top-left corner
//   - width, height      → the bar's pixel size
// Note: in SVG, y=0 is the TOP of the drawing area and y increases
// DOWNWARD, so a larger data value produces a SMALLER pixel y. Recharts
// has already done this conversion for us by the time these props arrive.

// Draws the actual box (spanning Q1 to Q3), plus the median line inside it.
const BoxShape = (props: BarShapeProps) => {
  // Recharts also spreads the ENTIRE original data object onto these props
  // at runtime (not just x/y/width/height). So entry.median, entry.q1 etc.
  // are really here, even though the official TypeScript types don't know
  // that. @ts-expect-error silences the resulting (harmless) type error.
  // @ts-expect-error — Recharts spreads the datum onto shape props at runtime
  const entry: BoxPlotDatum = props;

  // The box's pixel height represents the full Q1-to-Q3 range. The median
  // usually isn't exactly in the middle of that range (real data is often
  // skewed), so we calculate what FRACTION of the box's height the median
  // should sit at, then convert that fraction into an actual pixel offset.
  const quartileRange = entry.q3 - entry.q1;
  const medianOffset =
    quartileRange === 0
      ? props.height / 2 // degenerate case: q1 === q3, just center the line
      : ((entry.q3 - entry.median) / quartileRange) * props.height;
  // props.y is the pixel position of the TOP of the box, which corresponds
  // to q3 (the higher value). Adding medianOffset moves down from there.
  const medianY = props.y + medianOffset;

  return (
    <g>
      {/* the box itself: a plain rectangle at the exact pixel rect Recharts computed */}
      <rect x={props.x} y={props.y} width={props.width} height={props.height} fill="#00ffff" fillOpacity={0.5} />
      {/* the median line, spanning the box's full width at its calculated vertical position */}
      <line x1={props.x} x2={props.x + props.width} y1={medianY} y2={medianY} stroke="#0A0A0A" strokeWidth={2} />
    </g>
  );
};

// Draws one whisker: a thin vertical "I-beam" line with small caps at
// each end, rather than a full-width rectangle like the box.
const WhiskerShape = (props: BarShapeProps) => {
  const centerX = props.x + props.width / 2; // horizontal midpoint of this bar's slot
  const capWidth = props.width * 0.4; // caps are narrower than the full bar width
  const capX = centerX - capWidth / 2;

  return (
    <g stroke="#0A0A0A" strokeWidth={1.5}>
      {/* the vertical stem, running the whisker's full pixel height */}
      <line x1={centerX} x2={centerX} y1={props.y} y2={props.y + props.height} />
      {/* top cap */}
      <line x1={capX} x2={capX + capWidth} y1={props.y} y2={props.y} />
      {/* bottom cap */}
      <line x1={capX} x2={capX + capWidth} y1={props.y + props.height} y2={props.y + props.height} />
    </g>
  );
};

// Draws small dots for the two most extreme outlier values, if present.
// Reuses the same shape-override technique, but for a single-point marker
// instead of a range, so we only really care about props.y (vertical
// position) and centerX for horizontal placement; width/height of the
// "bar" itself aren't meaningful here since there's no range to fill.
const makeOutlierShape = (which: 'high' | 'low') => (props: BarShapeProps) => {
  // @ts-expect-error — Recharts spreads the datum onto shape props at runtime
  const entry: BoxPlotDatum = props;
  const value = which === 'high' ? entry.outliers.mostExtremeHigh : entry.outliers.mostExtremeLow;
  if (value == null) return null; // no real outlier on this side — render nothing

  const centerX = props.x + props.width / 2;
  return <circle cx={centerX} cy={props.y} r={3} fill="#FE7EBE" stroke="none" />;
};

// The hover tooltip's content. Recharts calls this whenever the user is
// actively hovering/touching the chart, passing info about what's under
// the cursor via `active` (boolean) and `payload` (an array describing
// each data series at that position).
const TooltipContent = ({ active, payload }: TooltipContentProps<any, any>) => {
  if (!active || !payload?.length) return null; // nothing hovered; render nothing

  // payload[0].payload is Recharts' nested reference back to the ORIGINAL
  // data object for whatever's being hovered. We know it's really a
  // BoxPlotDatum since that's the only kind of data this chart ever gets.
  const entry = payload[0]?.payload as BoxPlotDatum;
  if (!entry) return null;

  return (
    <div className="bg-white border border-gray-200 px-3 py-2 text-xs">
      <p className="font-semibold">{entry.label}</p>
      <p>Median: {entry.median.toFixed(1)}</p>
      <p>Q1 / Q3: {entry.q1.toFixed(1)} / {entry.q3.toFixed(1)}</p>
      <p>Range: {entry.min.toFixed(1)} - {entry.max.toFixed(1)}</p>
    </div>
  );
};

interface BoxPlotProps {
  data: BoxPlotDatum[]; // one entry per box-and-whisker glyph shown
  yAxisLabel?: string;
}

export default function BoxPlot({ data, yAxisLabel }: BoxPlotProps) {
  // The Y-axis needs to span whatever range this metric can ACTUALLY take
  // (e.g. 0-100 for saturation), not just the range of values present in
  // this particular dataset; otherwise the axis would auto-scale
  // differently depending on what data happens to be shown, making it
  // hard to compare charts against each other at a glance.
  const domainMax = Math.max(...data.map((d) => d.theoreticalMax));
  const domainMin = Math.min(...data.map((d) => d.theoreticalMin));

  return (
    // `responsive` (Recharts 3+) makes the chart automatically resize to
    // fill its container, replacing the older <ResponsiveContainer> wrapper
    // pattern from earlier Recharts versions.
      <BarChart data={data} style={{ width: '100%', maxHeight: '60vh', aspectRatio: 1.618 }} responsive>
        {/* horizontal-only gridlines; vertical lines between categories would
            just add visual clutter for a chart like this */}
        <CartesianGrid horizontal vertical={false} strokeDasharray="3 3" />

        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis domain={[domainMin, domainMax]} tick={{ fontSize: 11 }} label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#1c1c1c' } } : undefined} />
        <Tooltip content={TooltipContent} />

        {/* Each <Bar> below draws ONE piece of the box-and-whisker glyph, all
            stacked at the same X position per category. The `dataKey` here
            isn't a field name; it's a FUNCTION returning a [low, high] pair,
            which tells Recharts "draw this bar as a floating range from low
            to high" instead of the normal "bar from zero up to one value."
            Because the three ranges are perfectly adjacent (lowerFence→q1,
            then q1→q3, then q3→upperFence), they visually read as one
            continuous box-and-whisker shape, even though Recharts is
            technically rendering three independent bar series. */}

        {/* bottom whisker: from the (clamped) lower fence up to Q1 */}
        <Bar
          dataKey={(entry: BoxPlotDatum) => [entry.whiskerLow, entry.q1]}
          shape={WhiskerShape} 
          stackId="box"
          maxBarSize={60}
        />

        {/* the box itself: Q1 to Q3, with the median line drawn inside it */}
        <Bar dataKey={(entry: BoxPlotDatum) => [entry.q1, entry.q3]} shape={BoxShape} stackId="box" maxBarSize={60}/>

        {/* top whisker: from Q3 up to the (clamped) upper fence */}
        <Bar
          dataKey={(entry: BoxPlotDatum) => [entry.q3, entry.whiskerHigh]}
          shape={WhiskerShape} 
          stackId="box"
          maxBarSize={60}
        />

        {/* outlier markers. only meaningful where they exist, so we give
            each a tiny [value, value] range (a zero-height "bar") purely to
            get Recharts to compute the right pixel y position for us */}
        <Bar
          dataKey={(entry: BoxPlotDatum) =>
            entry.outliers.mostExtremeHigh != null
              ? [entry.outliers.mostExtremeHigh, entry.outliers.mostExtremeHigh]
              : [entry.q3, entry.q3] // harmless, real, zero-height fallback — never actually drawn
          }
          shape={makeOutlierShape('high')}
          stackId="box"
        />
        <Bar
          dataKey={(entry: BoxPlotDatum) =>
            entry.outliers.mostExtremeLow != null
              ? [entry.outliers.mostExtremeLow, entry.outliers.mostExtremeLow]
              : [entry.q1, entry.q1] // harmless, real, zero-height fallback
          }
          shape={makeOutlierShape('low')}
          stackId="box"
        />
      </BarChart>
  );
}