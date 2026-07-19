import { Link } from 'react-router';

export default function Home() {
  return (
    <main className="flex flex-col items-center px-6 py-12 text-center">
      <h1 className="font-display text-5xl uppercase text-ink leading-tight mb-4">
        Art<br />Log
      </h1>
      <p className="text-gray-600 max-w-sm mb-8">
        Upload any piece and instantly see its color palette, tonal breakdown,
        and value statistics — powered by color science, built for artists.
      </p>

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

      <div className="flex gap-3 w-full max-w-xs mt-6">
        <Link
          to="/signup"
          className="flex-1 py-3 font-display uppercase tracking-wide text-ink bg-cyan-true/50 active:bg-blend-blue transition-colors"
        >
          Sign up
        </Link>
        <Link
          to="/login"
          className="flex-1 py-3 font-display uppercase tracking-wide text-ink bg-magenta-true/50 active:bg-blend-blue transition-colors"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}