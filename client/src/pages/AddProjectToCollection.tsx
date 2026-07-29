import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { apiRequest } from '../utils/api';
import LoadingPage from './LoadingPage';
import ErrorPage from './ErrorPage';

interface Project {
  id: number;
  title: string;
  artSessions: { imageUrl: string }[];
}

export default function AddProjectToCollection() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [available, setAvailable] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      apiRequest('/api/projects'),
      apiRequest(`/api/collections/${id}`),
    ])
      .then(([allProjects, collection]) => {
        const inCollection = new Set(collection.projects.map((p: Project) => p.id));
        setAvailable(allProjects.filter((p: Project) => !inCollection.has(p.id)));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleSelected = (projectId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleDone = async () => {
    if (selected.size === 0) {
      navigate(`/collections/${id}`);
      return;
    }
    setSubmitting(true);
    try {
      await Promise.all(
        Array.from(selected).map((projectId) =>
          apiRequest(`/api/collections/${id}/projects/${projectId}`, { method: 'POST' })
        )
      );
      navigate(`/collections/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add projects');
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage title="Something went wrong" message="We're having trouble loading your projects." />;

  return (
    <main className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl uppercase text-ink">Add Projects</h1>
        <button
          onClick={handleDone}
          disabled={submitting}
          className="px-3 py-1.5 font-display uppercase text-sm text-ink bg-yellow-true/50 active:bg-blend-red transition-colors disabled:opacity-50"
        >
          {submitting ? 'Adding...' : `Done${selected.size > 0 ? ` (${selected.size})` : ''}`}
        </button>
      </div>

      {available.length === 0 ? (
        <p className="text-gray-500 text-sm">All your projects are already in this collection.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {available.map((project) => {
            const isSelected = selected.has(project.id);
            return (
              <button
                key={project.id}
                onClick={() => toggleSelected(project.id)}
                className={`flex items-center gap-3 text-left px-3 py-2 transition-colors ${
                  isSelected ? 'bg-cyan-true/50' : 'bg-gray-100'
                }`}
              >
                <img src={project.artSessions[0]?.imageUrl ?? ''} alt="" className="w-14 h-14 object-cover flex-shrink-0" />
                <span className="font-body text-ink flex-1">{project.title}</span>
                {isSelected && <span className="text-ink">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}