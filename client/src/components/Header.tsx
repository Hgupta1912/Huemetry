import { Link, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext'; 

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/portfolio': 'Portfolio',
  '/collections': 'Collections',
  '/collections/new': 'New Collection',
  '/discover': 'Discover Artists',
  '/settings': 'Settings',
  '/new-project': 'New Project',
  '/analyze': 'Analyze Artwork',
  '/login': 'Log In',
  '/signup': 'Sign Up',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const match = Object.keys(PAGE_TITLES).find((path) => pathname.startsWith(path));
  return match ? PAGE_TITLES[match] : 'Huemetry';
}

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <>
        <div className="bg-magenta-true/50 px-4 flex items-center justify-between" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)', paddingBottom: '12px' }}>
          <Link to="/" className="flex items-center">
            <img src="/logo.svg" alt="Huemetry" className="w-12 h-12 object-contain rounded-xl" />
            <span className="font-display text-2xl uppercase text-ink ml-2">Huemetry</span>
          </Link>
        </div>
        <div className="h-5 bg-gradient-to-b from-magenta-true/50 via-cyan-true/50 to-yellow-true/50" />
      </>
    );
  }

  return (
    <>
      <div className="bg-magenta-true/50 px-4 flex items-center justify-between" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)', paddingBottom: '12px' }}>
        <div className="flex items-center gap-2">
          <Link to="/" className="flex-shrink-0">
            <img src="/logo.svg" alt="Huemetry" className="w-12 h-12 object-contain rounded-xl" />
          </Link>
          <h1 className="font-display text-2xl uppercase text-ink">{getPageTitle(location.pathname)}</h1>
        </div>

        <button
          type="button"
          onClick={logout}
          className="px-3 py-1.5 font-display text-xs uppercase tracking-wide text-ink bg-yellow-true/80 active:bg-blend-red transition-colors"
        >
          Log out
        </button>
      </div>

      <div className="h-5 bg-gradient-to-b from-magenta-true/50 via-cyan-true/50 to-yellow-true/50" />
    </>
  );
}