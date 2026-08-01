import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { apiRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingPage from './LoadingPage';
import ErrorPage from './ErrorPage';

interface Project {
  id: number;
  title: string;
  mediums: string[];
  substrates: string[];
  imageUrl: string;
  artSessions: { imageUrl: string; isFinal: boolean }[];
}

export default function Portfolio() {
  const { username } = useParams();
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [hasInteracted, setHasInteracted] = useState(false);

  const isOwnPortfolio = !username || username === user?.username;

  useEffect(() => {
    setLoading(true);
    setIndex(0);

    if (isOwnPortfolio) {
      apiRequest('/api/projects')
        .then((data: any[]) => setProjects(data.filter((p) => p.isFinalized)))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      apiRequest(`/api/users/${username}`)
        .then((data: any) => setProjects(data.projects))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [username, isOwnPortfolio]);

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage title="Something went wrong" message="We're having trouble loading this portfolio." />;

  if (projects.length === 0) {
    return (
      <main className="px-4 py-6">
        <h1 className="font-display text-3xl uppercase text-ink mb-4">
          {isOwnPortfolio ? 'Portfolio' : `${username}'s Portfolio`}
        </h1>
        <p className="text-gray-500 text-sm">No finished pieces yet.</p>
      </main>
    );
  }

  const project = projects[index];

  const goNext = () => {
    setHasInteracted(true);
    setDirection('right');
    setIndex((i) => (i + 1) % projects.length);
  };

  const goPrev = () => {
    setHasInteracted(true);
    setDirection('left');
    setIndex((i) => (i - 1 + projects.length) % projects.length);
  };

  const finalImage = isOwnPortfolio
    ? project.artSessions?.find((s: any) => s.isFinal)?.imageUrl ?? project.artSessions?.[0]?.imageUrl
    : project.imageUrl;

  const detailHref = isOwnPortfolio
    ? `/projects/${project.id}`
    : `/artists/${username}/projects/${project.id}`;

  return (
    <main className="px-4 py-6 flex flex-col h-full overflow-hidden">
      <h1 className="font-display text-3xl uppercase text-ink mb-4 flex-shrink-0">
        {isOwnPortfolio ? '' : `${username}'s Portfolio`}
      </h1>

      <div className="relative flex items-center overflow-hidden flex-1 min-h-0">
        <button
          onClick={goPrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-yellow-true/50 active:bg-blend-red"
          aria-label="Previous piece"
        >
          ←
        </button>

        <Link
          to={detailHref}
          key={project.id}
          className={`w-full h-full flex flex-col items-center overflow-y-auto overflow-x-hidden ${
            hasInteracted ? (direction === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left') : ''
          }`}
        >
          <img
            src={finalImage}
            alt={project.title}
            className="max-h-full w-auto object-contain flex-shrink-0"
          />
          <p className="font-body font-semibold text-ink mt-3 overflow-wrap max-w-full">{project.title}</p>
          <p className="text-sm text-gray-500">{project.mediums.join(', ')}</p>
          <p className="text-sm text-gray-500">On {project.substrates.join(', ')}</p>
        </Link>

        <button
          onClick={goNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-yellow-true/50 active:bg-blend-red"
          aria-label="Next piece"
        >
          →
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 bg-surface py-2 flex-shrink-0">
        {index + 1} / {projects.length}
      </p>
    </main>
  );
}