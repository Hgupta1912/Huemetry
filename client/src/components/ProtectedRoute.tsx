import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
import LoadingPage from '../pages/LoadingPage';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingPage />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}