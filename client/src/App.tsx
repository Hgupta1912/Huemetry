import { Outlet } from 'react-router';
import Header from './components/Header';

export default function App() {
  return (
    <div className="min-h-screen bg-surface font-body">
      <header className="sticky top-0 z-10">
        <Header />
        <div className="h-6 bg-gradient-to-b from-magenta-true/50 via-cyan-true/50 to-yellow-true/50" />      
      </header>
      <Outlet />
    </div>
  );
}