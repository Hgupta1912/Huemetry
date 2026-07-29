import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

export function usePublicProject(username: string | undefined, projectId: string | undefined) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

    const refetch = () => {}; // no-op — public view never mutates, but keeps the hook's shape consistent with useProject

  useEffect(() => {
    if (!username || !projectId) return;
    setLoading(true);
    apiRequest(`/api/users/${username}/projects/${projectId}`)
      .then(setProject)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [username, projectId]);

  return { project, loading, error, refetch };
}