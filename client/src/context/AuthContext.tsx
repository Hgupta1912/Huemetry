import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiRequest } from '../utils/api';
import ServerWakingPage from '../pages/ServerWakingPage';

interface User {
  id: number;
  email: string;
  username: string;
  isPublic: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    apiRequest('/api/users/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);





  const login = async (email: string, password: string) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const signup = async (email: string, password: string, username: string) => {
    const data = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {loading ? <ServerWakingPage /> : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};