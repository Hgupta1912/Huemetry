import { BarChart, Bar, XAxis, YAxis } from 'recharts';

interface HistogramProps {
  bins: number[];
  compareBins?: number[];
  binWidth: number;
  label: string;
  compareLabel?: string;
  colorCodedTicks?: boolean; 
}

const CHART_MARGIN = { top: 10, right: 10, bottom: 20, left: 30 };

const ColoredTick = ({ x, y, payload }: any) => {
  const [start] = payload.value.split('-').map(Number);
  const color = `hsl(${start}, 70%, 45%)`;
  return (
    <text x={x} y={y + 10} textAnchor="middle" fontSize={9} fill={color}>
      {payload.value}
    </text>
  );
};

export default function Histogram({ bins, compareBins, binWidth, label, compareLabel, colorCodedTicks }: HistogramProps) {
  const data = bins.map((count, i) => ({
    range: `${Math.round(i * binWidth)}-${Math.round((i + 1) * binWidth)}`,
    value: count,
  }));

  const compareData = compareBins?.map((count, i) => ({
    range: `${Math.round(i * binWidth)}-${Math.round((i + 1) * binWidth)}`,
    value: count,
  }));

  const maxCount = Math.max(...bins, ...(compareBins ?? []));

  return (
    <div className="relative w-full" style={{ maxHeight: '50vh', aspectRatio: 1.618 }}>
      <BarChart data={data} style={{ width: '100%', height: '100%' }} responsive margin={CHART_MARGIN}>
        <XAxis
            dataKey="range"
            tick={colorCodedTicks ? ColoredTick : { fontSize: 9 }}
            interval={Math.floor(bins.length / 8)}
            label={{
                value: compareLabel
                ? `${label} (Cyan) vs ${compareLabel} (Magenta)`
                : label,
                position: 'insideBottom',
                offset: -10,
                style: { fontSize: 11, fill: '#0A0A0A' },
            }}
        />
        <YAxis domain={[0, maxCount]} width={20} tick={false} axisLine={false} tickLine={false} />
        <Bar dataKey="value" name={label} fill="#00FFFF" fillOpacity={0.5} />
      </BarChart>

      {compareData && (
        <div className="absolute inset-0">
          <BarChart data={compareData} style={{ width: '100%', height: '100%' }} responsive margin={CHART_MARGIN}>
            <XAxis dataKey="range" tick={false} axisLine={false} tickLine={false} />
            <YAxis domain={[0, maxCount]} width={20} tick={false} axisLine={false} tickLine={false} />
            <Bar dataKey="value" name={compareLabel} fill="#FF00FF" fillOpacity={0.5} />
          </BarChart>
        </div>
      )}
    </div>
  );
}