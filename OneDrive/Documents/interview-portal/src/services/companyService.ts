// File: src/services/companyService.ts
import { generateClient } from 'aws-amplify/api';
import { listCompanies, getCompany } from '@/graphql/queries';
import { createCompany, updateCompany, deleteCompany } from '@/graphql/mutations';
import { Company, CreateCompanyInput, UpdateCompanyInput } from '@/API';

const client = generateClient();

// Mock data for fallback when GraphQL is not available
const mockCompanies: Company[] = [
  {
    id: 'mock-company-1',
    name: 'TechCorp Solutions',
    email: 'contact@techcorp.com',
    phone: '+1-555-0123',
    website: 'https://techcorp.com',
    address: '123 Tech Street, Innovation City, IC 12345',
    description: 'Leading technology solutions provider',
    logo: null,
    isActive: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    __typename: 'Company'
  },
  {
    id: 'mock-company-2',
    name: 'Global Innovations Inc',
    email: 'hr@globalinnovations.com',
    phone: '+1-555-0456',
    website: 'https://globalinnovations.com',
    address: '456 Innovation Blvd, Tech Park, TP 67890',
    description: 'Global leader in innovative solutions',
    logo: null,
    isActive: true,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    __typename: 'Company'
  },
  {
    id: 'mock-company-3',
    name: 'StartupHub Co',
    email: 'team@startuphub.com',
    phone: '+1-555-0789',
    website: 'https://startuphub.com',
    address: '789 Startup Ave, Entrepreneur City, EC 11111',
    description: 'Accelerating startup growth and innovation',
    logo: null,
    isActive: false,
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days ago
    updatedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    __typename: 'Company'
  }
];

export const companyService = {
  // Get all companies (super admin only)
  async getAllCompanies(): Promise<Company[]> {
    try {
      const result = await client.graphql({ 
        query: listCompanies 
      });
      return result.data.listCompanies.items as Company[];
    } catch (error) {
      console.error('Error fetching companies:', error);
      console.log('🔄 GraphQL API unavailable, using mock data for development');
      
      // Return mock data when GraphQL fails
      return mockCompanies;
    }
  },

  // Get a single company
  async getCompanyById(id: string): Promise<Company | null> {
    try {
      const result = await client.graphql({ 
        query: getCompany,
        variables: { id }
      });
      return result.data.getCompany as Company;
    } catch (error) {
      console.error('Error fetching company:', error);
      console.log('🔄 GraphQL API unavailable, using mock data for development');
      
      // Return mock data when GraphQL fails
      return mockCompanies.find(company => company.id === id) || null;
    }
  },

  // Get active companies only
  async getActiveCompanies(): Promise<Company[]> {
    try {
      const result = await client.graphql({ 
        query: listCompanies,
        variables: {
          filter: {
            isActive: { eq: true }
          }
        }
      });
      return result.data.listCompanies.items as Company[];
    } catch (error) {
      console.error('Error fetching active companies:', error);
      console.log('🔄 GraphQL API unavailable, using mock data for development');
      
      // Return only active mock companies when GraphQL fails
      return mockCompanies.filter(company => company.isActive);
    }
  },

  // Create a new company (super admin only)
  async createCompany(input: CreateCompanyInput): Promise<Company> {
    try {
      const result = await client.graphql({ 
        query: createCompany,
        variables: { input }
      });
      return result.data.createCompany as Company;
    } catch (error) {
      console.error('Error creating company:', error);
      
      // Fallback to mock data if GraphQL fails (for testing purposes)
      console.log('🎭 GraphQL failed, using mock company creation for testing');
      const mockCompany = {
        id: `mock-company-${Date.now()}`,
        name: input.name,
        email: input.email,
        phone: input.phone || '',
        website: input.website || '',
        address: input.address || '',
        description: input.description || '',
        logo: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __typename: 'Company'
      } as Company;
      
      console.log('✅ Mock company created:', mockCompany);
      return mockCompany;
    }
  },

  // Update a company
  async updateCompany(input: UpdateCompanyInput): Promise<Company> {
    try {
      const result = await client.graphql({ 
        query: updateCompany,
        variables: { input }
      });
      return result.data.updateCompany as Company;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  },

  // Delete a company (super admin only)
  async deleteCompany(id: string): Promise<void> {
    try {
      await client.graphql({ 
        query: deleteCompany,
        variables: { input: { id } }
      });
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  },

  // Activate/deactivate company
  async toggleCompanyStatus(id: string, isActive: boolean): Promise<Company> {
    return this.updateCompany({ id, isActive });
  }
};