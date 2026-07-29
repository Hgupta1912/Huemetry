import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { apiRequest } from '../utils/api';
import ProjectCard from '../components/ProjectCard';
import LoadingPage from './LoadingPage';
import ErrorPage from './ErrorPage';

const PALETTE = ['bg-cyan-true/50', 'bg-magenta-true/50', 'bg-yellow-true/50'];

interface Project {
  id: number;
  title: string;
  mediums: string[];
  isFinalized: boolean;
  artSessions: { imageUrl: string }[];
}

interface Collection {
  id: number;
  name: string;
  isPublic: boolean;
  projects: Project[];
}

export default function CollectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const refetch = () => {
    apiRequest(`/api/collections/${id}`)
      .then((data) => {
        setCollection(data);
        setNameDraft(data.name);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refetch();
  }, [id]);

  const toggleEditMode = () => {
    setEditMode((e) => {
      if (e) {
        setRenaming(false);
        setConfirmingDelete(false);
      }
      return !e;
    });
  };

  const handleRename = async () => {
    if (!nameDraft.trim() || !collection) return;
    await apiRequest(`/api/collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: nameDraft }),
    });
    setRenaming(false);
    refetch();
  };

  const handleTogglePublic = async () => {
    if (!collection) return;
    await apiRequest(`/api/collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublic: !collection.isPublic }),
    });
    refetch();
  };

  const handleRemove = async (projectId: number) => {
    await apiRequest(`/api/collections/${id}/projects/${projectId}`, { method: 'DELETE' });
    refetch();
  };

  const handleDeleteCollection = async () => {
    await apiRequest(`/api/collections/${id}`, { method: 'DELETE' });
    navigate('/collections');
  };

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage title="Something went wrong" message="We're having trouble loading this collection." />;
  if (!collection) return <ErrorPage />;

  return (
    <main className="px-4 py-6">
      <div className="flex items-center gap-2 mb-1">
        {renaming ? (
          <>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="flex-1 min-w-0 px-2 py-1 bg-white"
              autoFocus
            />
            <button onClick={handleRename} className="px-3 py-1 bg-cyan-true/50 text-sm flex-shrink-0">Save</button>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl uppercase text-ink flex-1 min-w-0 overflow-x-auto overflow-y-hidden whitespace-nowrap">
              {collection.name}
            </h1>
            {editMode && (
              <button
                onClick={() => setRenaming(true)}
                className="w-6 h-6 flex items-center px-1 py-1justify-center bg-cyan-true/50 text-xs flex-shrink-0"
                aria-label="Rename collection"
              >
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="000000"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
              </button>
            )}
          </>
        )}
      </div>

      {editMode && (
        <div className="flex flex-col gap-2 mt-3">
          {confirmingDelete ? (
            <div className="flex flex-col gap-2 bg-magenta-true/20 p-3">
              <p className="text-sm text-ink">Delete this collection? This can't be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="flex-1 py-2 font-display uppercase text-sm text-ink bg-gray-100 active:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCollection}
                  className="flex-1 py-2 font-display uppercase text-sm text-ink bg-magenta-true active:bg-blend-red transition-colors"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmingDelete(true)}
                className="flex-1 py-2 font-display uppercase text-sm text-ink bg-magenta-true/50 active:bg-blend-red transition-colors"
              >
                Delete Collection
              </button>
              <button
                onClick={handleTogglePublic}
                className={`flex-1 py-2 font-display uppercase text-sm text-ink transition-colors 
                  ${collection.isPublic ? 'bg-cyan-true/50' : 'bg-yellow-true/50'}
                  ${collection.isPublic ? 'active:bg-blend-blue/50' : 'active:bg-blend-red/50'}`}
              >
                {collection.isPublic ? 'Public' : 'Private'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 mb-4 mt-3">
        <Link
          to={`/collections/${id}/add-project`}
          className="flex-1 text-center py-2 font-display uppercase text-sm text-ink bg-yellow-true/50 active:bg-blend-red transition-colors"
        >
          Add Project
        </Link>
        <button
          type="button"
          onClick={toggleEditMode}
          className={`flex-1 py-2 font-display uppercase text-sm text-ink transition-colors ${editMode ? 'bg-cyan-true/50 active:bg-blend-blue/50' : 'bg-gray-100 text-gray-500'}`}
        >
          {editMode ? 'Done' : 'Edit'}
        </button>
      </div>

      {collection.projects.length === 0 ? (
        <p className="text-gray-500 text-sm">No projects in this collection yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {collection.projects.map((project, index) => (
            <div key={project.id} className="relative">
              <Link to={`/projects/${project.id}`}>
                <ProjectCard
                  id={project.id}
                  title={project.title}
                  imageUrl={project.artSessions[0]?.imageUrl ?? ''}
                  medium={project.mediums[0] ?? 'Mixed'}
                  isFinalized={project.isFinalized}
                  color={PALETTE[index % PALETTE.length]}
                />
              </Link>
              {editMode && (
                <button
                  onClick={() => handleRemove(project.id)}
                  className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-magenta-true/70 text-ink text-xs"
                  aria-label="Remove from collection"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}