import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

interface TrendPoint {
  date: string;
  value: number;
}

interface TrendLineProps {
  data: TrendPoint[];
  label: string;
  domain?: [number, number];
  color?: string;
  referenceValue?: number;
  referenceLabel?: string;
}

export default function TrendLine({ data, label, domain, color = '#00FFFF', referenceValue, referenceLabel }: TrendLineProps) {
  return (
    <LineChart data={data} style={{ width: '100%', maxHeight: '50vh', aspectRatio: 1.618 }} responsive margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
      <CartesianGrid horizontal vertical={false} strokeDasharray="3 3" />
      <XAxis 
        dataKey="date" 
        tick={{ fontSize: 10 }}
        label={{
                value: referenceLabel
                ? `${label} (Cyan) vs ${referenceLabel} (Magenta)`
                : "",
                position: 'insideBottom',
                offset: -10,
                style: { fontSize: 11, fill: '#0A0A0A' },
            }}
      />
      <YAxis domain={domain} tick={{ fontSize: 11 }} />
      <Tooltip />
      <Line type="monotone" dataKey="value" name={label} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
      {referenceValue != null && (
        <ReferenceLine
          y={referenceValue}
          stroke="#FF00FF"
          strokeDasharray="4 4"
          label={{ value: referenceLabel ?? 'Reference', position: 'right', fontSize: 10, fill: '#FF00FF' }}
        />
      )}
    </LineChart>
  );
}