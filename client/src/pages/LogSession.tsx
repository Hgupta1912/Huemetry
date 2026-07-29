import { useState, useEffect, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router';
import { apiRequest } from '../utils/api';
import LoadingPage from './LoadingPage';

const API_URL = import.meta.env.VITE_API_URL;

export default function LogSession() {
  const { id: projectId, sessionId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(sessionId);
  const [initializing, setInitializing] = useState(isEditMode);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hoursSpent, setHoursSpent] = useState('');
  const [comments, setComments] = useState('');
  const [isFinal, setIsFinal] = useState(false);

  const [projectIsFinalized, setProjectIsFinalized] = useState(false);
  const [wasThisSessionFinal, setWasThisSessionFinal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;

    Promise.all([
      apiRequest(`/api/projects/${projectId}/sessions/${sessionId}`),
      apiRequest(`/api/projects/${projectId}`),
    ]).then(([session, project]) => {
      setPreviewUrl(session.imageUrl);
      setHoursSpent(session.hoursSpent != null ? String(session.hoursSpent) : '');
      setComments(session.comments ?? '');
      setIsFinal(session.isFinal);
      setWasThisSessionFinal(session.isFinal);
      setProjectIsFinalized(project.isFinalized);
      setInitializing(false);
    });
  }, [projectId, sessionId, isEditMode]);

  // Locked if the project is already finalized by a DIFFERENT session.
  // This session's own "final" checkbox is only editable if either the
  // project isn't finalized yet, or this session is the one that made it so.
  const finalCheckboxLocked = projectIsFinalized && !wasThisSessionFinal;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleRemoveImage = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async () => {
    if (isEditMode && !file && !previewUrl) {
      setError('An image is required');
      return;
    }
    if (!isEditMode && !file) {
      setError('An image is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    if (file) formData.append('image', file); // only include a new image if one was actually selected
    formData.append('isFinal', String(isFinal));
    if (hoursSpent) formData.append('hoursSpent', hoursSpent);
    if (comments) formData.append('comments', comments);

    try {
      const token = localStorage.getItem('token');
      const url = isEditMode
        ? `${API_URL}/api/projects/${projectId}/sessions/${sessionId}`
        : `${API_URL}/api/projects/${projectId}/sessions`;

      const res = await fetch(url, {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to save session' }));
        throw new Error(err.error || 'Failed to save session');
      }

      navigate(`/projects/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    await apiRequest(`/api/projects/${projectId}/sessions/${sessionId}`, { method: 'DELETE' });
    navigate(`/projects/${projectId}`);
  };

  if (initializing) return <LoadingPage />;

  return (
    <main className="px-4 py-6 h-full overflow-y-auto">
      <h1 className="font-display text-3xl uppercase text-ink mb-6">
        {isEditMode ? 'Edit Session' : 'Log Session'}
      </h1>

      {isEditMode && (
        <div className="mb-6">
          {confirmingDelete ? (
            <div className="flex flex-col gap-2 bg-magenta-true/20 p-3">
              <p className="text-sm text-ink">Delete this session? This can't be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="flex-1 py-2 font-display uppercase text-sm text-ink bg-gray-100 active:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 font-display uppercase text-sm text-ink bg-magenta-true active:bg-blend-red transition-colors"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="w-full py-2 font-display uppercase text-sm text-ink bg-magenta-true/50 active:bg-blend-red transition-colors"
            >
              Delete Session
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="mb-4 text-sm bg-magenta-true/50 text-ink px-3 py-2">{error}</p>
      )}

      {!previewUrl ? (
        <label className="flex flex-col items-center justify-center gap-2 py-16 bg-cyan-true/20 cursor-pointer mb-2">
          <span className="font-display uppercase text-ink">Choose an image</span>
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      ) : (
        <>
          <img src={previewUrl} alt="Preview" className="w-full aspect-auto object-cover mb-2" />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="text-xs text-gray-500 underline mb-5"
          >
            Remove image
          </button>
        </>
      )}

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-ink">{`Hours spent (optional if project is retrospective)`}</label>
          <input
            type="number"
            step="0.1"
            value={hoursSpent}
            onChange={(e) => setHoursSpent(e.target.value)}
            className="px-3 py-2 bg-white focus:outline-none focus:bg-cyan-true/20"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-ink">Comments (optional)</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            className="px-3 py-2 bg-white focus:outline-none focus:bg-cyan-true/20"
          />
        </div>

        <label className="flex items-center justify-between py-2">
          <span className={`font-medium ${finalCheckboxLocked ? 'text-gray-400' : 'text-ink'}`}>
            This is the final image
          </span>
          <input
            type="checkbox"
            checked={isFinal}
            disabled={finalCheckboxLocked}
            onChange={(e) => setIsFinal(e.target.checked)}
          />
        </label>
        {finalCheckboxLocked && (
          <p className="text-xs text-gray-500 -mt-3">
            This project already has a different final session.
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || (isEditMode ? !file && !previewUrl : !file)}
          className="py-3 font-display uppercase tracking-wide text-ink bg-yellow-true/50 active:bg-blend-red transition-colors disabled:opacity-50"
        >
          {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Log Session'}
        </button>
      </div>
    </main>
  );
}