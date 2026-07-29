import { PieChart, Pie, Tooltip, Sector, type PieSectorShapeProps } from 'recharts';

interface PaletteColor {
  hex: string;
  weight: number;
}

interface PaletteChartProps {
  colors: PaletteColor[];
  title?: string;
  size?: 'large' | 'small';
}

const makeSliceShape = (colors: PaletteColor[]) => (props: PieSectorShapeProps) => {
  const fill = colors[props.index ?? 0]?.hex ?? '#cccccc';
  return <Sector {...props} fill={fill} />;
};

export default function PaletteChart({ colors, title, size = 'large' }: PaletteChartProps) {
  const data = colors.map((c) => ({ name: c.hex, value: c.weight }));
  const heightPx = size === 'large' ? 280 : 140;

  return (
    <div style={{ width: '100%', height: `${heightPx}px` }}>
      {title && <p className="font-body font-semibold text-ink text-xs mb-1 text-center">{title}</p>}
      <PieChart style={{ width: '100%', height: '100%' }} responsive>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius="80%"
          shape={makeSliceShape(colors)}
        />
        <Tooltip formatter={(value) => (typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : '')} />
      </PieChart>
    </div>
  );
}