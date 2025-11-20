/**
 * API Client for ClassPoint Backend
 * Handles all HTTP requests to the NestJS API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export class ApiClientError extends Error {
  statusCode: number;
  error?: string;

  constructor(message: string, statusCode: number, error?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.error = error;
  }
}

/**
 * Get authentication token from storage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  // Get token from localStorage (Cognito stores it there)
  const idToken = localStorage.getItem('CognitoIdentityServiceProvider.idToken');
  if (idToken) return idToken;

  // Fallback to sessionStorage
  const sessionToken = sessionStorage.getItem('authToken');
  return sessionToken;
}

/**
 * Build request headers with authentication
 */
function buildHeaders(customHeaders?: HeadersInit): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ApiError;

    try {
      errorData = await response.json();
    } catch {
      errorData = {
        message: response.statusText || 'An error occurred',
        statusCode: response.status,
      };
    }

    throw new ApiClientError(
      errorData.message,
      errorData.statusCode,
      errorData.error
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Make API request
 */
async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: buildHeaders(options?.headers),
  };

  try {
    const response = await fetch(url, config);
    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    // Network or other errors
    throw new ApiClientError(
      error instanceof Error ? error.message : 'Network error occurred',
      0
    );
  }
}

/**
 * API Client methods
 */
export const apiClient = {
  /**
   * GET request
   */
  get: <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  /**
   * POST request
   */
  post: <T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> => {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PUT request
   */
  put: <T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> => {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * PATCH request
   */
  patch: <T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> => {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /**
   * DELETE request
   */
  delete: <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};

/**
 * API endpoints by entity
 */
export const apiEndpoints = {
  // Authentication
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/auth/me',
  },

  // Tenants/Schools
  tenants: {
    list: '/tenants',
    get: (id: string) => `/tenants/${id}`,
    create: '/tenants',
    update: (id: string) => `/tenants/${id}`,
    delete: (id: string) => `/tenants/${id}`,
  },

  // Students
  students: {
    list: '/students',
    get: (id: string) => `/students/${id}`,
    create: '/students',
    update: (id: string) => `/students/${id}`,
    delete: (id: string) => `/students/${id}`,
  },

  // Teachers
  teachers: {
    list: '/teachers',
    get: (id: string) => `/teachers/${id}`,
    create: '/teachers',
    update: (id: string) => `/teachers/${id}`,
    delete: (id: string) => `/teachers/${id}`,
  },

  // Parents
  parents: {
    list: '/parents',
    get: (id: string) => `/parents/${id}`,
    create: '/parents',
    update: (id: string) => `/parents/${id}`,
    delete: (id: string) => `/parents/${id}`,
  },

  // Classes
  classes: {
    list: '/classes',
    get: (id: string) => `/classes/${id}`,
    create: '/classes',
    update: (id: string) => `/classes/${id}`,
    delete: (id: string) => `/classes/${id}`,
  },

  // Enrollments
  enrollments: {
    list: '/enrollments',
    get: (id: string) => `/enrollments/${id}`,
    create: '/enrollments',
    update: (id: string) => `/enrollments/${id}`,
    delete: (id: string) => `/enrollments/${id}`,
    byClass: (classId: string) => `/enrollments/class/${classId}`,
    byStudent: (studentId: string) => `/enrollments/student/${studentId}`,
  },

  // Assignments
  assignments: {
    list: '/assignments',
    get: (id: string) => `/assignments/${id}`,
    create: '/assignments',
    update: (id: string) => `/assignments/${id}`,
    delete: (id: string) => `/assignments/${id}`,
    byClass: (classId: string) => `/assignments/class/${classId}`,
  },

  // Announcements
  announcements: {
    list: '/announcements',
    get: (id: string) => `/announcements/${id}`,
    create: '/announcements',
    update: (id: string) => `/announcements/${id}`,
    delete: (id: string) => `/announcements/${id}`,
  },

  // Attendance
  attendance: {
    list: '/attendance',
    get: (id: string) => `/attendance/${id}`,
    create: '/attendance',
    update: (id: string) => `/attendance/${id}`,
    delete: (id: string) => `/attendance/${id}`,
    byClass: (classId: string, date: string) => `/attendance/class/${classId}/${date}`,
    byStudent: (studentId: string) => `/attendance/student/${studentId}`,
  },

  // Calendar
  calendar: {
    list: '/calendar',
    get: (id: string) => `/calendar/${id}`,
    create: '/calendar',
    update: (id: string) => `/calendar/${id}`,
    delete: (id: string) => `/calendar/${id}`,
    byDate: (date: string) => `/calendar/date/${date}`,
  },

  // Fee Status
  feeStatus: {
    list: '/fee-status',
    get: (id: string) => `/fee-status/${id}`,
    create: '/fee-status',
    update: (id: string) => `/fee-status/${id}`,
    delete: (id: string) => `/fee-status/${id}`,
    byStudent: (studentId: string) => `/fee-status/student/${studentId}`,
  },

  // Household
  households: {
    list: '/households',
    get: (id: string) => `/households/${id}`,
    create: '/households',
    update: (id: string) => `/households/${id}`,
    delete: (id: string) => `/households/${id}`,
    byParent: (parentId: string) => `/households/parent/${parentId}`,
  },
};
