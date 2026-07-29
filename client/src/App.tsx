import { Outlet } from 'react-router';
import Header from './components/Header';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="h-screen flex flex-col bg-surface font-body">
      <Header />

      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>

      <Footer />
    </div>
  );
}