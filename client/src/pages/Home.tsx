import { Link } from 'react-router';

export default function Home() {
  return (
    <main className="flex flex-col items-center px-6 pt-3 text-center overflow-y-auto h-full">

      <div className="relative w-full flex flex-col items-center pt-12 pb-8">
        <div className="absolute top-1 left-1/4 w-32 h-32 bg-cyan-true/50" />
        <div className="absolute top-8 right-1/4 w-28 h-28 bg-magenta-true/50" />
        <div className="absolute top-14 left-1/3 w-26 h-26 bg-yellow-true/50" />

        <br/>
        <br/>        
        <br/>        
        <br/>                
        <br/>        
        <br/>
        <p className="relative text-gray-600 max-w-sm">
          Upload any piece and instantly see its color palette and tonal breakdown; hue, saturation,
          and value statistics, and more.<br/>Built by artists for artists.
        </p>
      </div>

      <Link
        to="/analyze"
        className="py-4 px-8 font-display text-lg uppercase tracking-wide text-ink bg-yellow-true/50 active:bg-blend-red transition-colors w-full max-w-xs"
      >
        Analyze artwork — free
      </Link>
      <p className="text-xs text-gray-500 mt-2">No account needed</p>

      <div className="mt-10 flex items-center gap-3 w-full max-w-xs">
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-xs text-gray-400 uppercase tracking-wide">or</span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>

      <Link
        to="/discover"
        className="mt-6 py-3 w-full max-w-xs font-display uppercase tracking-wide text-ink bg-cyan-true/50 active:bg-blend-blue transition-colors"
      >
        Discover Artists
      </Link>
    </main>
  );
}