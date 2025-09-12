// src/services/companyAdminService.ts

import { userService } from './userService';

interface CreateCompanyAdminData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyId: string;
}

interface CreateCompanyWithAdminData {
  company: {
    name: string;
    email: string;
    phone?: string;
    website?: string;
    address?: string;
    description?: string;
  };
  admin: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export class CompanyAdminService {

  async createCompanyWithAdmin(data: CreateCompanyWithAdminData): Promise<{ 
    companyId: string; 
    adminId: string; 
    tempPassword: string 
  }> {
    try {
      console.log('🔄 Client: Creating company with admin...');
      
      // Call the server-side API
      const response = await fetch('/api/admin/create-company-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create company and admin';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse JSON, use the status text
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        console.error('❌ Server responded with error:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create company and admin');
      }

      console.log('✅ Client: Company and admin created successfully');
      
      return result.data;

    } catch (error) {
      console.error('❌ Client error creating company with admin:', error);
      throw error;
    }
  }

  async assignAdminToCompany(adminId: string, companyId: string): Promise<void> {
    try {
      console.log('🔄 Assigning admin to company...');
      
      // Update user record to include company assignment
      await userService.updateUser({
        id: adminId,
        companyId
      });

      console.log('✅ Admin assigned to company');
    } catch (error) {
      console.error('❌ Error assigning admin to company:', error);
      throw error;
    }
  }

  async getCompanyAdmins(companyId: string) {
    try {
      // TODO: Implement getUsersByCompany in userService or use a different approach
      console.log('⚠️ getCompanyAdmins not fully implemented - returning empty array for now');
      return [];
    } catch (error) {
      console.error('❌ Error fetching company admins:', error);
      throw error;
    }
  }
}

export const companyAdminService = new CompanyAdminService();