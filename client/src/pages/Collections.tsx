import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { apiRequest } from '../utils/api';
import LoadingPage from './LoadingPage';
import ErrorPage from './ErrorPage';

interface Collection {
  id: number;
  name: string;
  isPublic: boolean;
  projects: { id: number }[];
}

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest('/api/collections')
      .then(setCollections)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage title="Something went wrong" message="We're having trouble loading your collections." />;

  return (
    <main className="px-4 py-6">
      <Link
        to="/collections/new"
        className="block w-full text-center py-4 mb-6 font-display uppercase text-ink bg-yellow-true/50 active:bg-blend-red transition-colors"
      >
        New Collection
      </Link>

      <div className="h-px bg-gray-200 my-6" />

      {collections.length === 0 ? (
        <p className="text-gray-500 text-sm">No collections yet. Group your projects into a series.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {collections.map((collection, index) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.id}`}
              className={`flex items-center justify-between px-4 py-3 ${['bg-cyan-true/50 active:bg-blend-blue', 'bg-magenta-true/50 active:bg-blend-red', 'bg-yellow-true/50 active:bg-blend-green'][index % 3]}`}
            >
                <span className="font-body font-medium text-ink truncate flex-1 min-w-0">{collection.name}</span>
                <span className="text-sm text-ink flex items-center gap-1">
                {collection.projects.length} {collection.projects.length === 1 ? 'piece ' : 'pieces'}
                {!collection.isPublic && (
                    <svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="currentColor">
                    <path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm296.5-143.5Q560-327 560-360t-23.5-56.5Q513-440 480-440t-56.5 23.5Q400-393 400-360t23.5 56.5Q447-280 480-280t56.5-23.5ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z" />
                    </svg>
                )}
                {collection.isPublic && (
                    <svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="currentColor">
                    <path d="M240-160h480v-400H240v400Zm296.5-143.5Q560-327 560-360t-23.5-56.5Q513-440 480-440t-56.5 23.5Q400-393 400-360t23.5 56.5Q447-280 480-280t56.5-23.5ZM240-160v-400 400Zm0 80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h280v-80q0-83 58.5-141.5T720-920q83 0 141.5 58.5T920-720h-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80h120q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Z" />
                    </svg>
                )}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}