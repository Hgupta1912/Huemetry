// client/src/components/PaletteMatchRow.tsx
interface Match {
  referenceHex: string;
  referenceWeight: number;
  closestWipHex: string;
  distance: number;
}
interface UnmatchedColor {
  hex: string;
  weight: number;
}
interface PaletteMatchRowProps {
  title: string;
  matches: Match[];
  unmatchedWipColors: UnmatchedColor[];
}

export default function PaletteMatchRow({ title, matches, unmatchedWipColors }: PaletteMatchRowProps) {
  // Group reference colors by which WIP color they matched to, so a WIP
  // color matched by two different reference colors renders as one
  // double-wide slot with both reference swatches stacked above it.
  const groups = new Map<string, Match[]>();
  matches.forEach((m) => {
    const existing = groups.get(m.closestWipHex) ?? [];
    groups.set(m.closestWipHex, [...existing, m]);
  });

  return (
    <div className="mb-4">
      <p className="text-sm font-semibold text-ink capitalize mb-2">{title}</p>
      <div className="flex gap-3">
        {/* Row labels, one per swatch row; sits directly beside the rows
            it describes, instead of a shared caption underneath everything. */}
        <div className="flex flex-col gap-1 justify-end text-[10px] text-gray-400 flex-shrink-0">
          <span className="h-8 flex items-center">Ref</span>
          <span className="h-8 flex items-center">You</span>
        </div>

        <div className="flex gap-1 items-end flex-1">
          {Array.from(groups.entries()).map(([wipHex, refs]) => (
            <div key={wipHex} className="flex flex-col gap-1" style={{ width: `${refs.length * 32}px` }}>
              <div className="flex gap-0.5">
                {refs.map((r) => (
                  <div key={r.referenceHex} className="h-8 flex-1" style={{ backgroundColor: r.referenceHex }} />
                ))}
              </div>
              <div className="h-8 w-full" style={{ backgroundColor: wipHex }} />
            </div>
          ))}

          {unmatchedWipColors.length > 0 && (
            <div className="flex flex-col gap-1 ml-3 pl-3 border-l border-gray-300 flex-shrink-0">
              <p className="text-[10px] text-gray-400 -mb-1">Unmatched</p>
              <div className="flex gap-1">
                {unmatchedWipColors.map((c) => (
                  <div key={c.hex} className="flex flex-col gap-1" style={{ width: '32px' }}>
                    <div className="h-8 w-full bg-gray-100" />
                    <div className="h-8 w-full" style={{ backgroundColor: c.hex }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}