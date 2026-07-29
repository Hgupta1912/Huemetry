import { useState } from 'react';
import { useNavigate } from 'react-router';
import { apiRequest } from '../utils/api';

export default function AddCollection() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      await apiRequest('/api/collections', {
        method: 'POST',
        body: JSON.stringify({ name, isPublic }),
      });
      navigate('/collections');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="px-4 py-6">
      <h1 className="font-display text-3xl uppercase text-ink mb-6">New Collection</h1>

      {error && (
        <p className="mb-4 text-sm bg-magenta-true/50 text-ink px-3 py-2">{error}</p>
      )}

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-ink">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 bg-white focus:outline-none focus:bg-cyan-true/20"
          />
        </div>

        <label className="flex items-center justify-between py-2">
          <span className="text-ink font-medium">Make public</span>
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        </label>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="py-3 font-display uppercase tracking-wide text-ink bg-yellow-true/50 active:bg-blend-red transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Collection'}
        </button>
      </div>
    </main>
  );
}