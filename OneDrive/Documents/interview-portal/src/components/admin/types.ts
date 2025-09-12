// src/components/admin/types.ts

import { UserRole } from "@/API";

export interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  logo?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  adminCount: number;
  jobCount: number;
  applicationCount: number;
}

export interface CompanyAdmin {
  id: string;
  cognitoId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  companyId: string;
  companyName: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface PlatformStats {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  totalApplications: number;
  totalJobs: number;
  recentSignups: number;
}

export interface ActivityLog {
  id: string;
  type:
    | "company_created"
    | "user_created"
    | "company_activated"
    | "company_deactivated"
    | "admin_login";
  description: string;
  userId?: string;
  companyId?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}


export type AdminTabType =
  | "overview"
  | "companies"
  | "users"
  | "jobs"
  | "applications"
  | "tests"
  | "interviews"
  | "reports"
  | "analytics"
  | "notifications"
  | "settings";
