import { useState, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router';

const API_URL = import.meta.env.VITE_API_URL;

export default function AddReference() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('An image is required');
      return;
    }
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/projects/${id}/reference`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to upload reference' }));
        throw new Error(err.error || 'Failed to upload reference');
      }

      navigate(`/projects/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload reference');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="px-4 py-6 overflow-y-auto h-full">
      <h1 className="font-display text-3xl uppercase text-ink mb-2">Reference Photo</h1>
      <p className="text-sm text-gray-500 mb-6">
        Upload the reference you're working from. Your sessions will be compared against it.
      </p>

      {error && (
        <p className="mb-4 text-sm bg-magenta-true/50 text-ink px-3 py-2">{error}</p>
      )}

      {!previewUrl ? (
        <label className="flex flex-col items-center justify-center gap-2 py-16 bg-cyan-true/20 cursor-pointer mb-5">
          <span className="font-display uppercase text-ink">Choose an image</span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      ) : (
        <img src={previewUrl} alt="Preview" className="w-full aspect-auto object-cover mb-5" />
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || !file}
        className="w-full py-3 font-display uppercase tracking-wide text-ink bg-yellow-true/50 active:bg-blend-red transition-colors disabled:opacity-50"
      >
        {submitting ? 'Uploading...' : 'Upload Reference'}
      </button>
    </main>
  );
}