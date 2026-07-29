import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../utils/api';

export function useProject(id: string | undefined) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!id) return;
    setLoading(true);
    apiRequest(`/api/projects/${id}`)
      .then(setProject)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { project, loading, error, refetch };
}