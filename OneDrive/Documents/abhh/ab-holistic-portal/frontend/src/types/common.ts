/**
 * Common type definitions for the AB Holistic Interview Portal
 */

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  /** Response data */
  data: T;
  /** Success status */
  success: boolean;
  /** Response message */
  message?: string;
  /** Additional metadata */
  meta?: {
    /** Total count for paginated responses */
    total?: number;
    /** Current page */
    page?: number;
    /** Items per page */
    limit?: number;
    /** Whether there are more pages */
    hasMore?: boolean;
  };
}

/**
 * Pagination metadata
 */
export interface PaginationResponse {
  /** Whether there are more pages */
  hasMore: boolean;
  /** Next cursor for pagination */
  nextCursor?: string;
  /** Total count of items */
  totalCount?: number;
  /** Current page number */
  currentPage?: number;
  /** Total number of pages */
  totalPages?: number;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  /** Pagination metadata */
  pagination: PaginationResponse;
}

/**
 * Generic error response structure
 */
export interface ApiError {
  /** Error message */
  message: string;
  /** Error code */
  code?: string;
  /** HTTP status code */
  status?: number;
  /** Detailed error information */
  details?: Record<string, unknown>;
  /** Validation errors */
  validationErrors?: ValidationError[];
}

/**
 * Validation error structure
 */
export interface ValidationError {
  /** Field name */
  field: string;
  /** Error message */
  message: string;
  /** Invalid value */
  value?: unknown;
}

/**
 * Base entity interface
 */
export interface BaseEntity {
  /** Unique identifier */
  id: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  /** Page number (1-based) */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search and filter options
 */
export interface SearchOptions extends PaginationOptions {
  /** Search query */
  query?: string;
  /** Filters to apply */
  filters?: Record<string, unknown>;
}

/**
 * File upload information
 */
export interface FileInfo {
  /** File name */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  type: string;
  /** File URL or path */
  url?: string;
  /** Upload timestamp */
  uploadedAt?: string;
}

/**
 * Form field configuration
 */
export interface FormFieldConfig {
  /** Field type */
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'file' | 'date';
  /** Field label */
  label: string;
  /** Field name/id */
  name: string;
  /** Whether field is required */
  required?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Field description */
  description?: string;
  /** Options for select/radio fields */
  options?: Array<{ value: string; label: string }>;
  /** Validation rules */
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: unknown) => string | undefined;
  };
}

/**
 * Loading state
 */
export interface LoadingState {
  /** Whether currently loading */
  isLoading: boolean;
  /** Loading message */
  message?: string;
  /** Loading progress (0-100) */
  progress?: number;
}

/**
 * Async operation state
 */
export interface AsyncState<T = unknown> extends LoadingState {
  /** Operation data */
  data: T | null;
  /** Error if operation failed */
  error: Error | null;
  /** Whether operation has completed (success or failure) */
  isCompleted: boolean;
  /** Whether operation was successful */
  isSuccess: boolean;
}

/**
 * Form submission state
 */
export interface FormState extends LoadingState {
  /** Form errors */
  errors: Record<string, string>;
  /** Whether form has been submitted */
  isSubmitted: boolean;
  /** Whether form is valid */
  isValid: boolean;
  /** Touched fields */
  touched: Record<string, boolean>;
}

/**
 * Modal state
 */
export interface ModalState {
  /** Whether modal is open */
  isOpen: boolean;
  /** Modal title */
  title?: string;
  /** Modal content */
  content?: React.ReactNode;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether modal can be closed by clicking overlay */
  closeOnOverlayClick?: boolean;
}

/**
 * Notification types
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Notification item
 */
export interface NotificationItem {
  /** Unique identifier */
  id: string;
  /** Notification type */
  type: NotificationType;
  /** Notification title */
  title: string;
  /** Notification message */
  message?: string;
  /** Auto-dismiss timeout in ms */
  timeout?: number;
  /** Whether notification is persistent */
  persistent?: boolean;
  /** Action buttons */
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /** Color scheme */
  mode: 'light' | 'dark';
  /** Primary color */
  primaryColor: string;
  /** Font size */
  fontSize: 'sm' | 'md' | 'lg';
  /** Accessibility preferences */
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    screenReader: boolean;
  };
}

/**
 * Browser/device information
 */
export interface DeviceInfo {
  /** User agent string */
  userAgent: string;
  /** Browser name */
  browser: string;
  /** Browser version */
  version: string;
  /** Operating system */
  os: string;
  /** Whether on mobile device */
  isMobile: boolean;
  /** Screen resolution */
  screenResolution: string;
  /** Viewport size */
  viewport: {
    width: number;
    height: number;
  };
}

/**
 * Generic event handler types
 */
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

/**
 * Utility types for better type safety
 */

/** Make specific properties required */
export type RequiredProps<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Make specific properties optional */
export type OptionalProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Extract property types */
export type PropertyType<T, K extends keyof T> = T[K];

/** Create a type with all properties optional except specified ones */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/** Recursive partial type */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Extract promise value type */
export type PromiseValue<T> = T extends Promise<infer U> ? U : T;

/** Function that returns a promise */
export type AsyncFunction<T extends any[] = any[], R = any> = (...args: T) => Promise<R>;

/** Non-empty array type */
export type NonEmptyArray<T> = [T, ...T[]];

/** String literal union to array */
export type StringLiteralArray<T extends readonly string[]> = T;

/** Extract string literal type */
export type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never;