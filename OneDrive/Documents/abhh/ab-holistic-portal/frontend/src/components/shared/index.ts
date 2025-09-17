// Shared component exports for AB Holistic Interview Portal

// Core UI Components
export { default as Button } from './Button';
export type { ButtonProps } from './Button';

export { default as Input } from './Input';
export type { InputProps } from './Input';

export { default as Card } from './Card';
export type { CardProps, CardHeaderProps, CardContentProps, CardFooterProps } from './Card';

export { default as Badge } from './Badge';
export type { BadgeProps } from './Badge';

export { default as LoadingSpinner } from './LoadingSpinner';
export type { LoadingSpinnerProps } from './LoadingSpinner';

// Layout Components with Enhanced Error Handling
export { default as Header } from './Header';
export type { HeaderProps, HeaderUser } from './Header';

export { default as Layout } from './Layout';
export type { LayoutProps } from './Layout';

// Error Boundary Components
export { default as ErrorBoundary } from './ErrorBoundary';

export { default as AsyncErrorBoundary } from './AsyncErrorBoundary';
export type { AsyncErrorBoundaryProps, AsyncErrorFallbackProps } from './AsyncErrorBoundary';

// Hooks for Enhanced Performance and Error Handling
export {
  usePerformanceMonitor,
  useDebounce,
  useThrottle,
  useMemoWithCache,
  useIntersectionObserver,
  useWindowSize,
  useIdle,
} from '../../hooks/usePerformance';

export {
  useAsync,
  useMultipleAsync,
  useAsyncPolling,
} from '../../hooks/useAsync';

export {
  useErrorHandler,
  useApiErrorHandler,
} from '../../hooks/useErrorHandler';