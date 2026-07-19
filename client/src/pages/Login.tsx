import { useState, type SubmitEvent } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-[80vh] px-6">
      <h1 className="font-display text-4xl uppercase text-ink mb-6">Log in</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        {error && (
          <p className="text-sm bg-magenta-true/50 text-ink px-3 py-2">{error}</p>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium text-ink">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-3 py-2 bg-white focus:outline-none focus:bg-cyan-true/20"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium text-ink">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="px-3 py-2 bg-white focus:outline-none focus:bg-cyan-true/20"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 py-3 font-display uppercase tracking-wide text-ink bg-yellow-true/50 active:bg-blend-red transition-colors disabled:opacity-50"
        >
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to="/signup" className="font-medium text-ink underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}