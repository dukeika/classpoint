/**
 * Job Service - API interactions for job management
 */

import {
  Job,
  CreateJobRequest,
  UpdateJobRequest,
  JobFilters,
  Application,
  CreateApplicationRequest,
  UpdateApplicationStageRequest,
  JobStats
} from '../types/job';
import { PaginatedResponse, ApiResponse } from '../types/common';

class JobService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://04efp4qnv4.execute-api.us-west-1.amazonaws.com/prod';
    console.log('JobService initialized with baseUrl:', this.baseUrl);
  }

  /**
   * Get authorization headers with current user token
   */
  private async getAuthHeaders(): Promise<Headers> {
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    // Get token from different possible storage locations
    let token = null;

    // Check for stored tokens from AuthContext
    const storedTokens = localStorage.getItem('auth_tokens');
    if (storedTokens) {
      try {
        const parsed = JSON.parse(storedTokens);
        token = parsed.accessToken || parsed.idToken;
      } catch (e) {
        console.warn('Failed to parse stored auth tokens:', e);
      }
    }

    // Fallback to direct token storage
    if (!token) {
      token = localStorage.getItem('accessToken') ||
             localStorage.getItem('authToken') ||
             localStorage.getItem('id_token') ||
             localStorage.getItem('access_token');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      console.log('Added authorization header with token:', token.substring(0, 20) + '...');
    } else {
      console.warn('No authentication token found');
    }

    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Handle different error response formats
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } catch (e) {
        // If JSON parsing fails, use default error message
        console.warn('Failed to parse error response:', e);
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Handle API response wrapper format
    if (data.success !== undefined) {
      if (!data.success) {
        throw new Error(data.message || 'API request failed');
      }
      return data.data || data;
    }

    // Handle direct data response
    return data;
  }

  // ========================================
  // Job Management
  // ========================================

  /**
   * Get list of jobs with filters and pagination
   */
  async getJobs(filters: JobFilters = {}, page = 1, limit = 20): Promise<PaginatedResponse<Job>> {
    // Build search params, filtering out undefined values
    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    };

    // Add filters, ensuring we don't pass undefined values
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          params[key] = value.join(',');
        } else {
          params[key] = String(value);
        }
      }
    });

    const searchParams = new URLSearchParams(params);

    try {
      const response = await fetch(`${this.baseUrl}/jobs?${searchParams}`, {
        method: 'GET',
        headers: await this.getAuthHeaders(),
      });

      const result = await this.handleResponse<PaginatedResponse<Job>>(response);

      // Ensure proper response structure
      return {
        data: result.data || [],
        success: true,
        pagination: result.pagination || {
          totalCount: result.data?.length || 0,
          hasMore: false
        }
      };
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  }

  /**
   * Get a single job by ID
   */
  async getJob(jobId: string): Promise<Job> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    return this.handleResponse<Job>(response);
  }

  /**
   * Create a new job
   */
  async createJob(jobData: CreateJobRequest): Promise<Job> {
    const response = await fetch(`${this.baseUrl}/jobs`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(jobData),
    });

    return this.handleResponse<Job>(response);
  }

  /**
   * Update an existing job
   */
  async updateJob(jobId: string, updates: UpdateJobRequest): Promise<Job> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    return this.handleResponse<Job>(response);
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete job');
    }
  }

  /**
   * Publish a draft job
   */
  async publishJob(jobId: string): Promise<Job> {
    return this.updateJob(jobId, { status: 'published' });
  }

  /**
   * Close a published job
   */
  async closeJob(jobId: string): Promise<Job> {
    return this.updateJob(jobId, { status: 'closed' });
  }

  /**
   * Archive a job
   */
  async archiveJob(jobId: string): Promise<Job> {
    return this.updateJob(jobId, { status: 'archived' });
  }

  // ========================================
  // Application Management
  // ========================================

  /**
   * Get applications for a specific job
   */
  async getJobApplications(jobId: string, page = 1, limit = 20): Promise<PaginatedResponse<Application>> {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`${this.baseUrl}/jobs/${jobId}/applications?${searchParams}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    return this.handleResponse<PaginatedResponse<Application>>(response);
  }

  /**
   * Get all applications (admin only)
   */
  async getAllApplications(page = 1, limit = 20, filters: any = {}): Promise<PaginatedResponse<Application>> {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).map(([key, value]) => [key, String(value)]).filter(([, value]) => value !== 'undefined')
      ),
    });

    const response = await fetch(`${this.baseUrl}/applications?${searchParams}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    return this.handleResponse<PaginatedResponse<Application>>(response);
  }

  /**
   * Get applications for current user (applicant)
   */
  async getMyApplications(page = 1, limit = 20): Promise<PaginatedResponse<Application>> {
    const searchParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`${this.baseUrl}/my-applications?${searchParams}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    return this.handleResponse<PaginatedResponse<Application>>(response);
  }

  /**
   * Get a single application
   */
  async getApplication(applicationId: string): Promise<Application> {
    const response = await fetch(`${this.baseUrl}/applications/${applicationId}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    return this.handleResponse<Application>(response);
  }

  /**
   * Submit job application
   */
  async submitApplication(applicationData: CreateApplicationRequest): Promise<Application> {
    const response = await fetch(`${this.baseUrl}/applications`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(applicationData),
    });

    return this.handleResponse<Application>(response);
  }

  /**
   * Update application stage (admin only)
   */
  async updateApplicationStage(applicationId: string, stageUpdate: UpdateApplicationStageRequest): Promise<Application> {
    const response = await fetch(`${this.baseUrl}/applications/${applicationId}/stage`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(stageUpdate),
    });

    return this.handleResponse<Application>(response);
  }

  /**
   * Withdraw application (applicant only)
   */
  async withdrawApplication(applicationId: string): Promise<Application> {
    const response = await fetch(`${this.baseUrl}/applications/${applicationId}/withdraw`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
    });

    return this.handleResponse<Application>(response);
  }

  // ========================================
  // Analytics and Stats
  // ========================================

  /**
   * Get job statistics
   */
  async getJobStats(jobId: string): Promise<JobStats> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}/stats`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    return this.handleResponse<JobStats>(response);
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<{
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    pendingApplications: number;
    recentJobs: Job[];
    recentApplications: Application[];
  }> {
    const response = await fetch(`${this.baseUrl}/dashboard/stats`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  // ========================================
  // File Upload Helpers
  // ========================================

  /**
   * Get presigned URL for file upload
   */
  async getUploadUrl(fileName: string, fileType: string, fileSize: number): Promise<{
    uploadUrl: string;
    fileUrl: string;
    fileId: string;
  }> {
    const response = await fetch(`${this.baseUrl}/files/upload-url`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        fileName,
        fileType,
        fileSize,
      }),
    });

    return this.handleResponse(response);
  }

  /**
   * Upload file to S3 using presigned URL
   */
  async uploadFile(file: File, uploadUrl: string): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }
  }

  // ========================================
  // Search and Suggestions
  // ========================================

  /**
   * Search jobs with text query
   */
  async searchJobs(query: string, filters: JobFilters = {}, page = 1, limit = 20): Promise<PaginatedResponse<Job>> {
    return this.getJobs({ ...filters, search: query }, page, limit);
  }

  /**
   * Get job suggestions for autocomplete
   */
  async getJobSuggestions(query: string): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/jobs/suggestions?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    return this.handleResponse<string[]>(response);
  }

  /**
   * Get popular skills for suggestions
   */
  async getPopularSkills(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/jobs/skills`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    return this.handleResponse<string[]>(response);
  }
}

// Export singleton instance
export const jobService = new JobService();
export default jobService;