import { useCallback, useEffect, useRef, useState } from 'react';
import { AsyncState } from '../types/common';

/**
 * Options for useAsync hook
 */
interface UseAsyncOptions<T> {
  /** Initial data */
  initialData?: T;
  /** Whether to execute immediately on mount */
  immediate?: boolean;
  /** Dependencies that trigger re-execution */
  deps?: React.DependencyList;
  /** Callback when operation succeeds */
  onSuccess?: (data: T) => void;
  /** Callback when operation fails */
  onError?: (error: Error) => void;
  /** Custom error handler */
  errorHandler?: (error: unknown) => Error;
  /** Timeout for the async operation (ms) */
  timeout?: number;
  /** Whether to cancel the operation on unmount */
  cancelOnUnmount?: boolean;
}

/**
 * Return type for useAsync hook
 */
interface UseAsyncReturn<T> extends AsyncState<T> {
  /** Execute the async operation */
  execute: (...args: any[]) => Promise<T | undefined>;
  /** Reset the state */
  reset: () => void;
  /** Cancel the current operation */
  cancel: () => void;
  /** Whether operation was cancelled */
  isCancelled: boolean;
}

/**
 * Hook for handling async operations with comprehensive state management
 *
 * @param asyncFunction - The async function to execute
 * @param options - Configuration options
 * @returns Async state and control functions
 *
 * @example
 * ```tsx
 * const UserProfile = ({ userId }) => {
 *   const {
 *     data: user,
 *     isLoading,
 *     error,
 *     execute: fetchUser,
 *   } = useAsync(
 *     (id) => fetchUserById(id),
 *     {
 *       immediate: true,
 *       deps: [userId],
 *       onError: (error) => console.error('Failed to fetch user:', error),
 *     }
 *   );
 *
 *   useEffect(() => {
 *     fetchUser(userId);
 *   }, [userId, fetchUser]);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   return <div>Welcome, {user?.name}!</div>;
 * };
 * ```
 */
export const useAsync = <T, Args extends any[] = any[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T> => {
  const {
    initialData = null,
    immediate = false,
    deps = [],
    onSuccess,
    onError,
    errorHandler,
    timeout,
    cancelOnUnmount = true,
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    error: null,
    isLoading: false,
    isCompleted: false,
    isSuccess: false,
  });

  const [isCancelled, setIsCancelled] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Default error handler
   */
  const defaultErrorHandler = useCallback((error: unknown): Error => {
    if (error instanceof Error) {
      return error;
    }
    if (typeof error === 'string') {
      return new Error(error);
    }
    return new Error('An unknown error occurred');
  }, []);

  /**
   * Cancel the current operation
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsCancelled(true);
  }, []);

  /**
   * Reset the state to initial values
   */
  const reset = useCallback(() => {
    setState({
      data: initialData,
      error: null,
      isLoading: false,
      isCompleted: false,
      isSuccess: false,
    });
    setIsCancelled(false);
  }, [initialData]);

  /**
   * Execute the async operation
   */
  const execute = useCallback(
    async (...args: Args): Promise<T | undefined> => {
      // Cancel any previous operation
      cancel();

      // Reset cancelled state
      setIsCancelled(false);

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // Set loading state
      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        isCompleted: false,
        isSuccess: false,
      }));

      try {
        let promise = asyncFunction(...args);

        // Add timeout if specified
        if (timeout) {
          promise = Promise.race([
            promise,
            new Promise<never>((_, reject) => {
              timeoutRef.current = setTimeout(() => {
                reject(new Error(`Operation timed out after ${timeout}ms`));
              }, timeout);
            }),
          ]);
        }

        const result = await promise;

        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Check if operation was cancelled
        if (abortControllerRef.current?.signal.aborted || isCancelled) {
          return undefined;
        }

        // Update state with success
        setState({
          data: result,
          error: null,
          isLoading: false,
          isCompleted: true,
          isSuccess: true,
        });

        // Call success callback
        onSuccess?.(result);

        return result;
      } catch (error) {
        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Check if operation was cancelled
        if (abortControllerRef.current?.signal.aborted || isCancelled) {
          return undefined;
        }

        // Handle error
        const processedError = errorHandler ? errorHandler(error) : defaultErrorHandler(error);

        // Update state with error
        setState({
          data: initialData,
          error: processedError,
          isLoading: false,
          isCompleted: true,
          isSuccess: false,
        });

        // Call error callback
        onError?.(processedError);

        throw processedError;
      }
    },
    [
      asyncFunction,
      timeout,
      isCancelled,
      onSuccess,
      onError,
      errorHandler,
      defaultErrorHandler,
      initialData,
      cancel,
    ]
  );

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as Args));
    }
  }, [immediate, execute, ...deps]);

  // Cancel on unmount if requested
  useEffect(() => {
    return () => {
      if (cancelOnUnmount) {
        cancel();
      }
    };
  }, [cancelOnUnmount, cancel]);

  return {
    ...state,
    execute,
    reset,
    cancel,
    isCancelled,
  };
};

/**
 * Hook for managing multiple async operations
 *
 * @param operations - Object with async operations
 * @returns Object with state for each operation
 *
 * @example
 * ```tsx
 * const Dashboard = () => {
 *   const {
 *     users: { data: users, isLoading: usersLoading },
 *     posts: { data: posts, isLoading: postsLoading },
 *   } = useMultipleAsync({
 *     users: () => fetchUsers(),
 *     posts: () => fetchPosts(),
 *   });
 *
 *   const isLoading = usersLoading || postsLoading;
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   return <div>Dashboard content</div>;
 * };
 * ```
 */
export const useMultipleAsync = <T extends Record<string, (...args: any[]) => Promise<any>>>(
  operations: T,
  options: Partial<UseAsyncOptions<any>> = {}
): {
  [K in keyof T]: UseAsyncReturn<Awaited<ReturnType<T[K]>>>;
} => {
  const results = {} as {
    [K in keyof T]: UseAsyncReturn<Awaited<ReturnType<T[K]>>>;
  };

  for (const [key, asyncFn] of Object.entries(operations)) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[key as keyof T] = useAsync(asyncFn, options);
  }

  return results;
};

/**
 * Hook for polling an async operation at regular intervals
 *
 * @param asyncFunction - The async function to poll
 * @param interval - Polling interval in milliseconds
 * @param options - Additional options
 * @returns Async state and control functions
 *
 * @example
 * ```tsx
 * const ServerStatus = () => {
 *   const { data: status, isLoading, start, stop } = useAsyncPolling(
 *     () => fetchServerStatus(),
 *     5000, // Poll every 5 seconds
 *     { immediate: true }
 *   );
 *
 *   return (
 *     <div>
 *       <div>Status: {status?.status}</div>
 *       <button onClick={start}>Start Polling</button>
 *       <button onClick={stop}>Stop Polling</button>
 *     </div>
 *   );
 * };
 * ```
 */
export const useAsyncPolling = <T>(
  asyncFunction: () => Promise<T>,
  interval: number,
  options: UseAsyncOptions<T> & {
    /** Whether to stop polling on error */
    stopOnError?: boolean;
    /** Maximum number of consecutive errors before stopping */
    maxErrors?: number;
  } = {}
): UseAsyncReturn<T> & {
  /** Start polling */
  start: () => void;
  /** Stop polling */
  stop: () => void;
  /** Whether currently polling */
  isPolling: boolean;
} => {
  const { stopOnError = false, maxErrors = 3, ...asyncOptions } = options;
  const [isPolling, setIsPolling] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const asyncResult = useAsync(asyncFunction, {
    ...asyncOptions,
    onSuccess: (data) => {
      setErrorCount(0); // Reset error count on success
      asyncOptions.onSuccess?.(data);
    },
    onError: (error) => {
      setErrorCount(prev => prev + 1);

      if (stopOnError || errorCount >= maxErrors - 1) {
        setIsPolling(false);
      }

      asyncOptions.onError?.(error);
    },
  });

  const start = useCallback(() => {
    if (intervalRef.current) return;

    setIsPolling(true);
    setErrorCount(0);

    // Execute immediately
    asyncResult.execute();

    // Set up polling
    intervalRef.current = setInterval(() => {
      asyncResult.execute();
    }, interval);
  }, [asyncResult, interval]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // Stop polling if max errors reached
  useEffect(() => {
    if (errorCount >= maxErrors) {
      stop();
    }
  }, [errorCount, maxErrors, stop]);

  return {
    ...asyncResult,
    start,
    stop,
    isPolling,
  };
};

export default {
  useAsync,
  useMultipleAsync,
  useAsyncPolling,
};