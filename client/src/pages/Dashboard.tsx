import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { apiRequest } from '../utils/api';
import ProjectCard from '../components/ProjectCard';
import LoadingPage from './LoadingPage';
import ErrorPage from './ErrorPage';

const PALETTE = ['bg-cyan-true/50 active:bg-blend-blue/50', 'bg-magenta-true/50 active:bg-blend-red', 'bg-yellow-true/50 active:bg-blend-green/50'];

interface Project {
  id: number;
  title: string;
  mediums: string[];
  isFinalized: boolean;
  artSessions: { imageUrl: string }[];
}

interface Artist {
  id: number;
  username: string;
  _count?: { projects: number };
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiRequest('/api/projects'),
      apiRequest('/api/users'),
    ])
      .then(([projectsData, artistsData]) => {
        setProjects(projectsData);
        setArtists(artistsData.slice(0, 3));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage title="Something went wrong" message="We're having trouble loading your dashboard." />;

  return (
    <main className="flex flex-col overflow-y-auto h-full">
      <section className="flex-[2.5] flex flex-col min-h-0">
        <div className="flex items-center justify-between bg-surface px-4 pt-4 pb-2 z-10 relative">
            <h1 className="font-display text-3xl uppercase text-ink">Projects</h1>
            <Link
            to="/new-project"
            className="px-3 py-1.5 font-display uppercase text-sm text-ink bg-yellow-true/50 active:bg-blend-red transition-colors"
            >
            New Project
            </Link>
        </div>

        <div className="overflow-y-auto px-4 pb-4 min-h-0 h-full">
            {projects.length === 0 ? (
            <p className="text-gray-500 text-sm">No projects yet. Start your first one!</p>
            ) : (
            <div className="grid grid-cols-2 gap-3">
                {projects.map((project, index) => (
                <Link key={project.id} to={`/projects/${project.id}`}>
                    <ProjectCard
                    id={project.id}
                    title={project.title}
                    imageUrl={project.artSessions[0]?.imageUrl ?? ''}
                    medium={project.mediums.length > 1 ? 'Mixed Media' : project.mediums[0] ?? 'Mixed'}
                    isFinalized={project.isFinalized}
                    color={PALETTE[index % PALETTE.length]}
                    />
                </Link>
                ))}
            </div>
            )}
        </div>
      </section>

      <section className="flex-1 px-4 pt-4 pt-7 min-h-0">
        <div className="flex items-center justify-between sticky top-0 z-10 bg-surface pb-2 mb-4">
          <h2 className="font-display text-2xl uppercase text-ink">Discover Artists</h2>
          <Link to="/discover" className="text-xs text-gray-600 underline">
            See all →
          </Link>
        </div>

        <div className="px-4 pb-4 min-h-0">
            {artists.length === 0 ? (
            <p className="text-gray-500 text-sm">No public artists yet.</p>
            ) : (
            <div className="flex flex-col gap-3 overflow-y-auto">
                {artists.map((artist, index) => (
                <Link
                    key={artist.id}
                    to={`/artists/${artist.username}/portfolio`}
                    className={`flex items-center justify-between px-4 py-3 ${PALETTE[index % PALETTE.length]}`}
                >
                    <span className="font-body font-medium text-ink">@{artist.username}</span>
                    <span className="text-sm text-ink">{artist._count?.projects ?? 0} projects</span>
                </Link>
                ))}
            </div>
            )}
        </div>
      </section>
    </main>
  );
}