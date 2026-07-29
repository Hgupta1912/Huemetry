import { Link, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M120-840h320v320H120v-320Zm80 80v160-160Zm320-80h320v320H520v-320Zm80 80v160-160ZM120-440h320v320H120v-320Zm80 80v160-160Zm440-80h80v120h120v80H720v120h-80v-120H520v-80h120v-120Zm-40-320v160h160v-160H600Zm-400 0v160h160v-160H200Zm0 400v160h160v-160H200Z"/></svg> },
  { to: '/portfolio', label: 'Portfolio', icon: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="000000"><path d="M120-200q-33 0-56.5-23.5T40-280v-400q0-33 23.5-56.5T120-760h400q33 0 56.5 23.5T600-680v400q0 33-23.5 56.5T520-200H120Zm0-80h400v-400H120v400Zm40-80h320L376-500l-76 100-56-74-84 114Zm520 160v-560h80v560h-80Zm160 0v-560h80v560h-80Zm-720-80v-400 400Z"/></svg> },
  { to: '/collections', label: 'Collections', icon: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="000000"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640H447l-80-80H160v480l96-320h684L837-217q-8 26-29.5 41.5T760-160H160Zm84-80h516l72-240H316l-72 240Zm0 0 72-240-72 240Zm-84-400v-80 80Z"/></svg> },
  { to: '/discover', label: 'Discover', icon: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="000000"><path d="M360-240ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q32 0 64.5 3.5T489-425q-13 17-22.5 35.5T451-351q-23-5-45.5-7t-45.5-2q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32h323q4 22 11 42t18 38H40Zm207-367q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47Zm466 0q-47 47-113 47-11 0-28-2.5t-28-5.5q27-32 41.5-71t14.5-81q0-42-14.5-81T544-792q14-5 28-6.5t28-1.5q66 0 113 47t47 113q0 66-47 113Zm-296.5-56.5Q440-607 440-640t-23.5-56.5Q393-720 360-720t-56.5 23.5Q280-673 280-640t23.5 56.5Q327-560 360-560t56.5-23.5ZM360-640Zm376.5 420q22.5-20 23.5-60 1-34-22.5-57T680-360q-34 0-57 23t-23 57q0 34 23 57t57 23q34 0 56.5-20ZM680-120q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 23-5.5 43.5T818-198L920-96l-56 56-102-102q-18 11-38.5 16.5T680-120Z"/></svg> },
  { to: '/settings', label: 'Settings', icon: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="000000"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/></svg> },
];

export default function Footer() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <footer className="bg-magenta-true/50 h-[64px]" />;
  }

  if (!user) {
    return (
      <>
        <div className="h-5 bg-gradient-to-t from-magenta-true/50 via-cyan-true/50 to-yellow-true/50" />
        <footer className="bg-magenta-true/50 px-4 flex items-center justify-between" style={{ paddingTop: '8px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}>
          <Link to="/" className="flex-shrink-0">
            <span className="font-display text-2xl uppercase text-ink">ArtLog</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-1.5 font-display text-sm uppercase tracking-wide text-ink bg-cyan-true/50 active:bg-blend-blue transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="px-4 py-1.5 font-display text-sm uppercase tracking-wide text-ink bg-yellow-true/50 active:bg-blend-red transition-colors"
            >
              Sign up
            </Link>
          </div>
        </footer>
      </>
    );
  }

  return (
    <>
      <div className="h-5 bg-gradient-to-t from-magenta-true/50 via-cyan-true/50 to-yellow-true/50" />
      <footer className="bg-magenta-true/50 px-2 flex items-center justify-between" style={{ paddingTop: '8px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}>
        {NAV_LINKS.map((link) => {
          const isActive = location.pathname.startsWith(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 transition-colors ${
                isActive ? 'bg-cyan-true/50' : 'active:bg-blend-red'
              }`}
            >
              {link.icon}
              <span className="text-[10px] font-display uppercase tracking-wide text-ink">{link.label}</span>
            </Link>
          );
        })}
      </footer>
    </>
  );
}