import { Link, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/collections', label: 'Collections' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/portfolio', label: 'Portfolio' },
];

export default function Header() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <header className="bg-magenta-true/50 px-4 py-3 h-[52px]" />;
  }

  if (!user) {
    return (
      <header className="bg-magenta-true/50 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex-shrink-0">
          {/* placeholder — swap for a real logo SVG once you have one */}
          <span className="font-display text-2xl uppercase text-ink">ArtLog</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="px-4 py-1.5 font-display text-sm uppercase tracking-wide text-ink bg-cyan-true/50 active:bg-cyan-true/70"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="px-4 py-1.5 font-display text-sm uppercase tracking-wide text-ink bg-yellow-true/50 active:bg-yellow-true/70"
          >
            Sign up
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-magenta-true/50 px-4 py-3 flex items-center justify-between gap-2">
        <Link to="/dashboard" className="flex-shrink-0">
        <div className="w-10 h-10 bg-yellow-true/50 overflow-hidden">
            {/* placeholder avatar */}
        </div>
        </Link>

        <nav className="flex items-center gap-2 overflow-x-auto">
        {NAV_LINKS.map((link) => {
            const isActive = location.pathname.startsWith(link.to);
            return (
            <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-1.5 font-display text-sm uppercase tracking-wide whitespace-nowrap text-ink transition-colors ${
                isActive ? 'bg-cyan-true/50' : 'bg-yellow-true/50 active:bg-blend-red'
                }`}
            >
                {link.label}
            </Link>
            );
        })}

        <Link
            to="/settings"
            className="w-9 h-9 flex-shrink-0 bg-cyan-true/50 flex items-center justify-center active:bg-blend-blue"
            aria-label="Settings"
        >
            ⚙️
        </Link>
        </nav>
    </header>
  );
}