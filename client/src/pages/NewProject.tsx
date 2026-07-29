import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { apiRequest } from '../utils/api';
import TagSelector from '../components/TagSelector';
import { GENRE_OPTIONS, SUBSTRATE_OPTIONS, MEDIUM_OPTIONS } from '../utils/constants';
import LoadingPage from './LoadingPage';

const STEPS = ['Basics', 'Details', 'Options'] as const;

const sortWithOtherLast = (items: string[]) =>
  [...items].sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return 0;
  });

export default function NewProject() {
  const mainRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const { id } = useParams(); //only the edit route has a dynamic segment
  const isEditMode = Boolean(id);

  const [initializing, setInitializing] = useState(isEditMode);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'progressive' | 'retrospective'>('progressive');
  const [mediums, setMediums] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);

  const [substrates, setSubstrates] = useState<string[]>([]);
  const [is3D, setIs3D] = useState(false);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [depth, setDepth] = useState('');
  const [collaborators, setCollaborators] = useState('');

  const [isRealism, setIsRealism] = useState(false);
  const [isMonochrome, setIsMonochrome] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [createdAt, setCreatedAt] = useState('');
  const [hasExistingSession, setHasExistingSession] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const canProceedFromBasics = title.trim() && mediums.length > 0 && genres.length > 0;

  useEffect(() => {
    if (!isEditMode) return;

    apiRequest(`/api/projects/${id}`).then((project) => {
      setTitle(project.title);
      setMode(project.mode); 
      setMediums(project.mediums); 
      setGenres(project.genres);  
      setSubstrates(project.substrates ?? []); 
      setCollaborators((project.collaborators ?? []).join(', '));  
      setIsRealism(project.isRealism);
      setIsMonochrome(project.isMonochrome);
      setIsPublic(project.isPublic);
      setHasExistingSession(project.artSessions.length > 0);

      if (project.dimensions?.length === 3) {
        setIs3D(true);
        setWidth(String(project.dimensions[0]));
        setHeight(String(project.dimensions[1]));
        setDepth(String(project.dimensions[2]));
      } else if (project.dimensions?.length === 2) {
        setWidth(String(project.dimensions[0]));
        setHeight(String(project.dimensions[1]));
      }

      if (project.createdAt) {
        setCreatedAt(project.createdAt.slice(0, 10)); // "YYYY-MM-DDTHH:mm:ss..." -> "YYYY-MM-DD"
      }

      setInitializing(false);
    });
  }, [id, isEditMode]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    const dimensions = is3D
      ? [Number(width), Number(height), Number(depth)]
      : [Number(width), Number(height)];

    const payload = {
      title,
      mode,
      mediums: sortWithOtherLast(mediums),
      genres: sortWithOtherLast(genres),
      substrates: sortWithOtherLast(substrates),
      dimensions,
      collaborators: collaborators
        ? collaborators.split(',').map((c) => c.trim()).filter((c) => Boolean(c))
        : [],
      isRealism,
      isMonochrome,
      isPublic,
      ...(mode === 'retrospective' && !isEditMode ? { createdAt } : {}),
    };

    try {
      if (isEditMode) {
        await apiRequest(`/api/projects/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        navigate(`/projects/${id}`);
      } else {
        const project = await apiRequest('/api/projects', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        navigate(`/projects/${project.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    await apiRequest(`/api/projects/${id}`, { method: 'DELETE' });
    navigate('/dashboard');
  };

  if (initializing) return <LoadingPage />;

  return (
    <main ref={mainRef} className="px-4 py-6 overflow-y-auto h-full">
      <h1 className="font-display text-3xl uppercase text-ink mb-2">
        {isEditMode ? 'Edit Project' : 'New Project'}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>

      {isEditMode && (
        <div className="mb-6">
          {confirmingDelete ? (
            <div className="flex flex-col gap-2 bg-magenta-true/20 p-3">
              <p className="text-sm text-ink">Delete this project? This can't be undone.</p>
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
              Delete Project
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="mb-4 text-sm bg-magenta-true/50 text-ink px-3 py-2">{error}</p>
      )}

      {step === 0 && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-3 py-2 bg-white focus:outline-none focus:bg-cyan-true/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">
              Mode <span className="text-sm font-medium text-ink/70"><br />{`(have you just started or already finished the project?)`}</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isEditMode}
                onClick={() => setMode('progressive')}
                className={`flex-1 py-2 font-display uppercase text-sm disabled:opacity-50 ${
                  mode === 'progressive' ? 'bg-cyan-true/50 text-ink' : 'bg-gray-100 text-gray-500'
                }`}
              >
                Progressive
              </button>
              <button
                type="button"
                disabled={isEditMode}
                onClick={() => setMode('retrospective')}
                className={`flex-1 py-2 font-display uppercase text-sm disabled:opacity-50 ${
                  mode === 'retrospective' ? 'bg-cyan-true/50 text-ink' : 'bg-gray-100 text-gray-500'
                }`}
              >
                Retrospective
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">Mediums</label>
            <TagSelector options={MEDIUM_OPTIONS} selected={mediums} onChange={setMediums} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">Genres</label>
            <TagSelector options={GENRE_OPTIONS} selected={genres} onChange={setGenres} />
          </div>

          <button
            type="button"
            disabled={!canProceedFromBasics}
            onClick={() => setStep(1)}
            className="mt-2 py-3 font-display uppercase tracking-wide text-ink bg-yellow-true/50 active:bg-blend-red transition-colors disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">Substrates (optional)</label>
            <TagSelector options={SUBSTRATE_OPTIONS} selected={substrates} onChange={setSubstrates} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">Dimensions (inches)</label>
            <label className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <input type="checkbox" checked={is3D} onChange={(e) => setIs3D(e.target.checked)} />
              This piece is 3D
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Width"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 bg-white focus:outline-none focus:bg-cyan-true/20"
              />
              <input
                type="number"
                placeholder="Height"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 bg-white focus:outline-none focus:bg-cyan-true/20"
              />
              {is3D && (
                <input
                  type="number"
                  placeholder="Depth"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 bg-white focus:outline-none focus:bg-cyan-true/20"
                />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-ink">Collaborators (optional, comma-separated)</label>
            <input
              type="text"
              value={collaborators}
              onChange={(e) => setCollaborators(e.target.value)}
              className="px-3 py-2 bg-white focus:outline-none focus:bg-cyan-true/20"
            />
          </div>

          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="flex-1 py-3 font-display uppercase tracking-wide text-ink bg-gray-100 active:bg-gray-200 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!width || !height || (is3D && !depth)}
              onClick={() => setStep(2)}
              className="flex-1 py-3 font-display uppercase tracking-wide text-ink bg-yellow-true/50 active:bg-blend-red transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <label className="flex items-center justify-between py-2">
            <span className="text-ink font-medium">Realism piece (allows reference photo and comparative analytics)</span>
            <input type="checkbox" checked={isRealism} onChange={(e) => setIsRealism(e.target.checked)} />
          </label>

          <label className="flex items-center justify-between py-2">
            <span className={`font-medium ${hasExistingSession ? 'text-gray-400' : 'text-ink'}`}>Monochrome</span>
            <input
              type="checkbox"
              checked={isMonochrome}
              disabled={hasExistingSession}
              onChange={(e) => setIsMonochrome(e.target.checked)}
            />
          </label>
          {hasExistingSession && (
            <p className="text-xs text-gray-500 -mt-3">Can't be changed after sessions have been logged.</p>
          )}

          <label className="flex items-center justify-between py-2">
            <span className="text-ink font-medium">Make public</span>
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          </label>

          {mode === 'retrospective' && !isEditMode && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-ink">Date completed</label>
              <input
                type="date"
                value={createdAt}
                onChange={(e) => setCreatedAt(e.target.value)}
                className="px-3 py-2 bg-white focus:outline-none focus:bg-cyan-true/20"
              />
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-3 font-display uppercase tracking-wide text-ink bg-gray-100 active:bg-gray-200 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              disabled={submitting || (mode === 'retrospective' && !isEditMode && !createdAt)}
              onClick={handleSubmit}
              className="flex-1 py-3 font-display uppercase tracking-wide text-ink bg-yellow-true/50 active:bg-blend-red transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}