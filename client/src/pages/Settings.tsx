import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingPage from './LoadingPage';
import ErrorPage from './ErrorPage';

interface User {
  id: number;
  email: string;
  username: string;
  isPublic: boolean;
}

export default function Settings() {
  const { logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [usernameDraft, setUsernameDraft] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiRequest('/api/users/me')
      .then((data: User) => {
        setUser(data);
        setUsernameDraft(data.username);
        setIsPublic(data.isPublic);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    try {
      const updated = await apiRequest('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ username: usernameDraft, isPublic }),
      });
      setUser(updated);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage title="Something went wrong" message="We're having trouble loading your settings." />;
  if (!user) return <ErrorPage />;

  return (
    <main className="px-4 py-6">
      {saveError && (
        <p className="mb-4 text-sm bg-magenta-true/50 text-ink px-3 py-2">{saveError}</p>
      )}
      {saved && (
        <p className="mb-4 text-sm bg-cyan-true/50 text-ink px-3 py-2">Saved.</p>
      )}

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-ink">Email</label>
          <p className="text-gray-500 text-sm">{user.email}</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-ink">Username</label>
          <input
            type="text"
            value={usernameDraft}
            onChange={(e) => {
              setUsernameDraft(e.target.value);
              setSaved(false);
            }}
            className="px-3 py-2 bg-white focus:outline-none focus:bg-cyan-true/20"
          />
        </div>

        <label className="flex items-center justify-between py-2">
          <span className="text-ink font-medium">Public profile</span>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => {
              setIsPublic(e.target.checked);
              setSaved(false);
            }}
          />
        </label>
        <p className="text-xs text-gray-500 -mt-3">
          When on, your finished, public pieces and collections are visible to other artists.
        </p>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="py-3 font-display uppercase tracking-wide text-ink bg-yellow-true/50 active:bg-blend-red transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        <button
          type="button"
          onClick={logout}
          className="py-3 font-display uppercase tracking-wide text-ink bg-gray-100 active:bg-gray-200 transition-colors mt-6"
        >
          Log Out
        </button>
      </div>
    </main>
  );
}