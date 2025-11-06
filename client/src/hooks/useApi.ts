/**
 * Shared hook for API queries with loading/error states
 */

import { useState, useEffect } from 'react';

export interface UseApiOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing API queries with loading and error states
 */
export function useApi<T>(
  queryFn: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const { enabled = true, refetchInterval } = options;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let mounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await queryFn();
        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (e) {
        if (mounted) {
          setError(e as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Set up refetch interval if specified
    if (refetchInterval && refetchInterval > 0) {
      intervalId = setInterval(fetchData, refetchInterval);
    }

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [enabled, refetchInterval, refetchTrigger]);

  const refetch = async () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { data, loading, error, refetch };
}
