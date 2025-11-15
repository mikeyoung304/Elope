/**
 * Error handling hook
 * Provides error state management and reporting
 */

import { useState, useCallback } from 'react';

export interface UseErrorHandlerReturn {
  error: Error | null;
  handleError: (error: Error) => void;
  clearError: () => void;
  hasError: boolean;
}

/**
 * Hook for managing error state in components
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { error, handleError, clearError } = useErrorHandler();
 *
 *   const fetchData = async () => {
 *     try {
 *       const data = await api.getData();
 *     } catch (err) {
 *       handleError(err as Error);
 *     }
 *   };
 *
 *   return (
 *     <>
 *       {error && <ErrorMessage error={error} onClose={clearError} />}
 *       <button onClick={fetchData}>Fetch</button>
 *     </>
 *   );
 * }
 * ```
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((error: Error) => {
    console.error('Error:', error);
    setError(error);

    // TODO: Send to Sentry when available
    /*
    import * as Sentry from '@sentry/react';
    Sentry.captureException(error);
    */
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
    hasError: error !== null,
  };
}

/**
 * Hook for wrapping async functions with error handling
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { execute, error, loading } = useAsyncError(async () => {
 *     const data = await api.getData();
 *     return data;
 *   });
 *
 *   return (
 *     <>
 *       {error && <ErrorMessage error={error} />}
 *       <button onClick={execute} disabled={loading}>
 *         Fetch
 *       </button>
 *     </>
 *   );
 * }
 * ```
 */
export function useAsyncError<T>(
  asyncFn: () => Promise<T>
): {
  execute: () => Promise<T | void>;
  error: Error | null;
  loading: boolean;
  clearError: () => void;
} {
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFn();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Async error:', error);
      setError(error);

      // TODO: Send to Sentry when available
      /*
      import * as Sentry from '@sentry/react';
      Sentry.captureException(error);
      */
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { execute, error, loading, clearError };
}
