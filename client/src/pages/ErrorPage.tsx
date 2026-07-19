import { Link } from 'react-router';

interface ErrorPageProps {
  title?: string;
  message?: string;
}

export default function ErrorPage({
  title = 'Page not found',
  message = "Looks like this piece doesn't exist. Let's get you back to the studio.",
}: ErrorPageProps) {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
      <p className="text-7xl">🖼️</p>
      <h1 className="font-display text-4xl uppercase text-ink">{title}</h1>
      <p className="text-gray-600 max-w-sm">{message}</p>
      <Link
        to="/"
        className="mt-2 px-6 py-2 font-display uppercase tracking-wide text-ink bg-cyan-true/50 active:bg-cyan-true/70 transition-colors"
      >
        Back to home
      </Link>
    </main>
  );
}