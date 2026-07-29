import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { apiRequest } from '../utils/api';
import LoadingPage from './LoadingPage';
import ErrorPage from './ErrorPage';

const USERNAME_BAR_PALETTE = ['bg-cyan-true/50', 'bg-magenta-true/50', 'bg-yellow-true/50'];
const USERNAME_BAR_ACTIVE: Record<string, string> = {
  'bg-cyan-true/50': 'active:bg-blend-blue',
  'bg-magenta-true/50': 'active:bg-blend-red',
  'bg-yellow-true/50': 'active:bg-blend-green',
};

interface Project {
  id: number;
  title: string;
  mediums: string[];
  substrates: string[];
  genres: string[];
  dimensions: number[];
  collaborators: string[];
  artSessions: { imageUrl: string }[];
}

interface Artist {
  id: number;
  username: string;
  projects: Project[];
  _count?: { projects: number };
}

function formatMediums(mediums: string[]) {
  if (mediums.length > 3) return 'Mixed Media';
  return mediums.join(', ');
}

export default function DiscoverArtists() {
  const [artists, setArtists] = useState<Artist[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');

  useEffect(() => {
    apiRequest('/api/users')
      .then((data: Artist[]) => setArtists(data.filter((a) => a.projects.length > 0)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPage />;
  if (error) return <ErrorPage title="Something went wrong" message="We're having trouble loading artists." />;

  const filteredArtists = artists.filter((a) =>
    a.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="h-full overflow-y-auto">
      <div className="sticky top-0 z-10 bg-surface px-3 py-2">
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-2">
          <span className="text-gray-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username"
            className="flex-1 bg-transparent focus:outline-none text-sm text-ink"
          />
        </div>
      </div>

      {filteredArtists.length === 0 ? (
        <p className="text-gray-500 text-sm px-4 py-6">
          {search ? `No artists found matching "${search}".` : 'No public artists yet.'}
        </p>
      ) : (
        filteredArtists.map((artist, index) => {
          const project = artist.projects[0];
          const image = project.artSessions[0]?.imageUrl;
          const barColor = USERNAME_BAR_PALETTE[index % USERNAME_BAR_PALETTE.length];
          const barActive = USERNAME_BAR_ACTIVE[barColor];

          return (
            <div key={artist.id} className="mb-6">
              <div className={`flex items-center justify-between px-3 py-2 ${barColor}`}>
                <div>
                  <p className="font-body font-semibold text-ink text-sm">@{artist.username}</p>
                   {project.collaborators?.length > 0 && (
                    <p className="text-[11px] text-ink/70">{`Collaborated with: ${project.collaborators.join(', ')}`}</p>
                  )}
                  {project.genres?.length > 0 && (
                    <p className="text-[11px] text-ink/70">{project.genres.join(', ')}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <Link
                    to={`/artists/${artist.username}/portfolio`}
                    className={`text-xs text-gray-600 underline flex items-center gap-0.5 ${barActive}`}
                  >
                    See portfolio →
                  </Link>
                  <Link
                    to={`/artists/${artist.username}/projects/${project.id}`}
                    className={`text-xs text-gray-600 underline flex items-center gap-0.5 ${barActive}`}
                  >
                    Project details →
                  </Link>
                </div>
              </div>

              {image && (
                <img src={image} alt={project.title} className="w-full aspect-auto object-cover" />
              )}

              <div className="bg-gray-100 px-3 py-2">
                <p className="text-sm font-semibold text-ink">{project.title}</p>
                <p className="text-sm text-gray-600">{formatMediums(project.mediums)}{project.substrates?.length > 0 && (` on ${project.substrates.join(', ')}`)} </p>
                <p className="text-sm text-gray-600">{project.dimensions?.length == 3 ? `${project.dimensions[0]} in x ${project.dimensions[1]} in x ${project.dimensions[3]} in ` : `${project.dimensions[0]} in x ${project.dimensions[1]} in`}</p>
              </div>
            </div>
          );
        })
      )}
    </main>
  );
}