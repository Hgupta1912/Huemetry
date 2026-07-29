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
      <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="000000"><path d="M503.5-289.48q9.5-9.48 9.5-23.5t-9.48-23.52q-9.48-9.5-23.5-9.5t-23.52 9.48q-9.5 9.48-9.5 23.5t9.48 23.52q9.48 9.5 23.5 9.5t23.52-9.48ZM453-433h60v-253h-60v253Zm27.27 353q-82.74 0-155.5-31.5Q252-143 197.5-197.5t-86-127.34Q80-397.68 80-480.5t31.5-155.66Q143-709 197.5-763t127.34-85.5Q397.68-880 480.5-880t155.66 31.5Q709-817 763-763t85.5 127Q880-563 880-480.27q0 82.74-31.5 155.5Q817-252 763-197.68q-54 54.31-127 86Q563-80 480.27-80Zm.23-60Q622-140 721-239.5t99-241Q820-622 721.19-721T480-820q-141 0-240.5 98.81T140-480q0 141 99.5 240.5t241 99.5Zm-.5-340Z"/></svg>      
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