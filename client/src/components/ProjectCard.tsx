const PALETTE_ACTIVE: Record<string, string> = {
  'bg-cyan-true/50': 'group-active:bg-blend-blue',
  'bg-magenta-true/50': 'group-active:bg-blend-red',
  'bg-yellow-true/50': 'group-active:bg-blend-green',
};

interface ProjectCardProps {
  id: number;
  title: string;
  imageUrl: string;
  medium: string;
  isFinalized: boolean;
  color: string;
}

export default function ProjectCard({ title, imageUrl, medium, isFinalized, color }: ProjectCardProps) {
  const activeClass = PALETTE_ACTIVE[color] ?? '';

  return (
    <div className="overflow-hidden group">
      {imageUrl !== '' ? (
        <img src={imageUrl} alt={title} className="w-full aspect-square object-cover" />
      ) : (
        <div className="w-full aspect-square bg-cyan-true/20 flex items-center justify-center">
          <span className="text-xs text-gray-400 uppercase">No image yet</span>
        </div>
      )}
      <div className={`px-3 py-2 ${color} ${activeClass} transition-colors`}>
        <p className="font-body font-semibold text-ink truncate">{title}</p>
        <p className="text-sm text-ink">{medium}</p>
        <p className="text-sm italic text-ink">{isFinalized ? 'Finished' : 'In Progress'}</p>
      </div>
    </div>
  );
}