import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Performance metrics interface
 */
interface PerformanceMetrics {
  /** Component render count */
  renderCount: number;
  /** Last render timestamp */
  lastRenderTime: number;
  /** Average render time */
  averageRenderTime: number;
  /** Peak render time */
  peakRenderTime: number;
  /** Total render time */
  totalRenderTime: number;
}

/**
 * Performance monitoring options
 */
interface PerformanceOptions {
  /** Component name for debugging */
  name?: string;
  /** Whether to log performance metrics */
  logMetrics?: boolean;
  /** Whether to warn on slow renders */
  warnOnSlowRender?: boolean;
  /** Threshold for slow render warning (ms) */
  slowRenderThreshold?: number;
  /** Maximum number of metrics to keep in memory */
  maxMetrics?: number;
}

/**
 * Hook for monitoring component performance
 *
 * @param options - Performance monitoring options
 * @returns Performance metrics and utilities
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { renderCount, logRender } = usePerformanceMonitor({
 *     name: 'MyComponent',
 *     warnOnSlowRender: true,
 *   });
 *
 *   useEffect(() => {
 *     logRender();
 *   });
 *
 *   return <div>Render #{renderCount}</div>;
 * };
 * ```
 */
export const usePerformanceMonitor = (options: PerformanceOptions = {}) => {
  const {
    name = 'UnnamedComponent',
    logMetrics = process.env.NODE_ENV === 'development',
    warnOnSlowRender = process.env.NODE_ENV === 'development',
    slowRenderThreshold = 16, // 16ms for 60fps
    maxMetrics = 100,
  } = options;

  const metricsRef = useRef<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    peakRenderTime: 0,
    totalRenderTime: 0,
  });

  const renderTimesRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);

  /**
   * Start measuring render time
   */
  const startRender = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  /**
   * End measuring render time and log metrics
   */
  const endRender = useCallback(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTimeRef.current;

    metricsRef.current.renderCount += 1;
    metricsRef.current.lastRenderTime = renderTime;
    metricsRef.current.totalRenderTime += renderTime;

    // Update render times array
    renderTimesRef.current.push(renderTime);
    if (renderTimesRef.current.length > maxMetrics) {
      renderTimesRef.current.shift();
    }

    // Calculate average and peak
    metricsRef.current.averageRenderTime =
      metricsRef.current.totalRenderTime / metricsRef.current.renderCount;
    metricsRef.current.peakRenderTime = Math.max(
      metricsRef.current.peakRenderTime,
      renderTime
    );

    // Warn on slow renders
    if (warnOnSlowRender && renderTime > slowRenderThreshold) {
      console.warn(
        `🐌 Slow render detected in ${name}: ${renderTime.toFixed(2)}ms (threshold: ${slowRenderThreshold}ms)`
      );
    }

    // Log metrics
    if (logMetrics && metricsRef.current.renderCount % 10 === 0) {
      console.log(`📊 Performance metrics for ${name}:`, {
        renders: metricsRef.current.renderCount,
        averageTime: `${metricsRef.current.averageRenderTime.toFixed(2)}ms`,
        peakTime: `${metricsRef.current.peakRenderTime.toFixed(2)}ms`,
        lastTime: `${renderTime.toFixed(2)}ms`,
      });
    }
  }, [name, logMetrics, warnOnSlowRender, slowRenderThreshold, maxMetrics]);

  /**
   * Log render (combines start and end)
   */
  const logRender = useCallback(() => {
    endRender();
    startRender();
  }, [startRender, endRender]);

  /**
   * Get current metrics
   */
  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metricsRef.current };
  }, []);

  /**
   * Reset metrics
   */
  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      peakRenderTime: 0,
      totalRenderTime: 0,
    };
    renderTimesRef.current = [];
  }, []);

  // Start measuring on mount
  useEffect(() => {
    startRender();
  }, [startRender]);

  return {
    metrics: metricsRef.current,
    startRender,
    endRender,
    logRender,
    getMetrics,
    resetMetrics,
  };
};

/**
 * Hook for debouncing values to prevent excessive re-renders
 *
 * @param value - Value to debounce
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced value
 *
 * @example
 * ```tsx
 * const MyComponent = ({ searchTerm }) => {
 *   const debouncedSearchTerm = useDebounce(searchTerm, 300);
 *
 *   useEffect(() => {
 *     // This will only run 300ms after searchTerm stops changing
 *     fetchSearchResults(debouncedSearchTerm);
 *   }, [debouncedSearchTerm]);
 *
 *   return <div>Searching for: {debouncedSearchTerm}</div>;
 * };
 * ```
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for throttling function calls to improve performance
 *
 * @param callback - Function to throttle
 * @param delay - Throttle delay in milliseconds
 * @returns Throttled function
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const handleScroll = useThrottle((event) => {
 *     console.log('Scroll event:', event.target.scrollTop);
 *   }, 100);
 *
 *   return <div onScroll={handleScroll}>Scrollable content</div>;
 * };
 * ```
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRan = useRef<number>(0);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const throttledFunction = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = now;
      } else {
        if (timeoutId.current) {
          clearTimeout(timeoutId.current);
        }
        timeoutId.current = setTimeout(() => {
          callback(...args);
          lastRan.current = Date.now();
        }, delay - (now - lastRan.current));
      }
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, []);

  return throttledFunction;
};

/**
 * Hook for memoizing expensive calculations with cache invalidation
 *
 * @param factory - Function that creates the value
 * @param deps - Dependencies array
 * @param options - Memoization options
 * @returns Memoized value
 *
 * @example
 * ```tsx
 * const MyComponent = ({ items, filterTerm }) => {
 *   const filteredItems = useMemoWithCache(
 *     () => items.filter(item => item.name.includes(filterTerm)),
 *     [items, filterTerm],
 *     { maxCacheSize: 10 }
 *   );
 *
 *   return <ul>{filteredItems.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
 * };
 * ```
 */
export const useMemoWithCache = <T>(
  factory: () => T,
  deps: React.DependencyList,
  options: {
    maxCacheSize?: number;
    ttl?: number; // Time to live in milliseconds
  } = {}
): T => {
  const { maxCacheSize = 5, ttl } = options;
  const cacheRef = useRef<Map<string, { value: T; timestamp: number }>>(new Map());

  return useMemo(() => {
    const key = JSON.stringify(deps);
    const now = Date.now();
    const cached = cacheRef.current.get(key);

    // Check if cached value is still valid
    if (cached && (!ttl || now - cached.timestamp < ttl)) {
      return cached.value;
    }

    // Compute new value
    const value = factory();

    // Store in cache
    cacheRef.current.set(key, { value, timestamp: now });

    // Clean up old cache entries
    if (cacheRef.current.size > maxCacheSize) {
      const entries = Array.from(cacheRef.current.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, entries.length - maxCacheSize);
      toRemove.forEach(([k]) => cacheRef.current.delete(k));
    }

    return value;
  }, deps);
};

/**
 * Hook for tracking when a component is visible in the viewport
 * Useful for lazy loading and performance optimization
 *
 * @param options - Intersection observer options
 * @returns Ref to attach to element and visibility state
 *
 * @example
 * ```tsx
 * const LazyComponent = () => {
 *   const [ref, isVisible] = useIntersectionObserver({
 *     threshold: 0.1,
 *     rootMargin: '50px',
 *   });
 *
 *   return (
 *     <div ref={ref}>
 *       {isVisible ? <ExpensiveComponent /> : <div>Loading...</div>}
 *     </div>
 *   );
 * };
 * ```
 */
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLElement>, boolean] => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '0px',
        ...options,
      }
    );

    const currentElement = ref.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [options]);

  return [ref, isVisible];
};

/**
 * Hook for managing window size efficiently
 *
 * @returns Current window dimensions
 *
 * @example
 * ```tsx
 * const ResponsiveComponent = () => {
 *   const { width, height } = useWindowSize();
 *
 *   return (
 *     <div>
 *       Window size: {width} x {height}
 *       {width < 768 ? <MobileLayout /> : <DesktopLayout />}
 *     </div>
 *   );
 * };
 * ```
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const handleResize = useThrottle(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, 100);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return windowSize;
};

/**
 * Hook for detecting when user is idle
 * Useful for pausing expensive operations when user is not active
 *
 * @param timeout - Idle timeout in milliseconds
 * @returns Whether user is currently idle
 *
 * @example
 * ```tsx
 * const AutoSaveComponent = () => {
 *   const isIdle = useIdle(5000); // 5 seconds
 *
 *   useEffect(() => {
 *     if (isIdle) {
 *       autoSaveData();
 *     }
 *   }, [isIdle]);
 *
 *   return <div>Auto-save when idle</div>;
 * };
 * ```
 */
export const useIdle = (timeout: number = 5000): boolean => {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const resetTimeout = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    setIsIdle(false);
    timeoutId.current = setTimeout(() => {
      setIsIdle(true);
    }, timeout);
  }, [timeout]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    events.forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });

    resetTimeout(); // Start the timer

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout, true);
      });
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, [resetTimeout]);

  return isIdle;
};

export default {
  usePerformanceMonitor,
  useDebounce,
  useThrottle,
  useMemoWithCache,
  useIntersectionObserver,
  useWindowSize,
  useIdle,
};