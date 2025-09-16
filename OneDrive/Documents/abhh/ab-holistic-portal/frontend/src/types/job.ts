export interface Job {
  jobId: string;
  title: string;
  description: string;
  requirements: string[];
  status: 'draft' | 'published' | 'closed';
  createdBy: string;
  createdAt: string;
  deadline?: string;
  writtenTestId?: string;
  videoTestId?: string;
  location?: string;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  department?: string;
  salary?: string;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  deadline?: string;
  location?: string;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  department?: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
}

export interface JobFilters {
  status?: Job['status'];
  search?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

export interface JobStats {
  total: number;
  draft: number;
  published: number;
  closed: number;
  totalApplications: number;
}