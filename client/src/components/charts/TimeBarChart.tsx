import { BarChart, Bar, XAxis, YAxis, CartesianGrid, type BarShapeProps } from 'recharts';

interface TimeBarDatum {
  date: string;
  value: number;
  hasData: boolean;
  actualValue: number | null;
}

const TimeBar = (props: BarShapeProps) => {
  // @ts-expect-error — Recharts spreads the datum onto shape props at runtime
  const entry: TimeBarDatum = props;
  const fill = entry.hasData ? '#0fe1e1d9' : '#d613d6df';

  return (
    <g>
      <rect x={props.x} y={props.y} width={props.width} height={props.height} fill={fill} fillOpacity={0.6} />
      {!entry.hasData && (
        <text x={props.x + props.width / 2} y={props.y - 4} textAnchor="middle" fontSize={8} fill="#0A0A0A">
          N/A
        </text>
      )}
    </g>
  );
};

interface TimeBarChartProps {
  data: TimeBarDatum[];
  label?: string;
}

export default function TimeBarChart({ data, label = 'Hours Spent' }: TimeBarChartProps) {
  return (
    <BarChart data={data} style={{ width: '100%', maxHeight: '50vh', aspectRatio: 1.618 }} responsive margin={{ top: 20, right: 10, bottom: 20, left: 30 }}>
      <CartesianGrid horizontal vertical={false} strokeDasharray="3 3" />
      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
      <YAxis tick={{ fontSize: 11 }} label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#0A0A0A' } }} />
      <Bar dataKey="value" name={label} shape={TimeBar} />
    </BarChart>
  );
}