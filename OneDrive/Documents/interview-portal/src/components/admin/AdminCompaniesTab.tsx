// src/components/admin/AdminCompaniesTab.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import AddCompanyModal from "./AddCompanyModal";
import CreateCompanyWithAdminModal, { CompanyWithAdminData } from "./CreateCompanyWithAdminModal";
import { companyService } from "@/services/companyService";
import { companyAdminService } from "@/services/companyAdminService";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Eye,
  Users,
  Briefcase,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building,
  Trash2,
  MapPin,
  Globe,
  Mail,
  Phone,
} from "lucide-react";
import { Company } from "./types";

interface AdminCompaniesTabProps {
  companies: Company[];
  onRefresh?: () => void;
}

export default function AdminCompaniesTab({
  companies,
  onRefresh,
}: AdminCompaniesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateWithAdminModal, setShowCreateWithAdminModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && company.isActive) ||
      (statusFilter === "inactive" && !company.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleAddCompany = async (companyData: any) => {
    try {
      console.log("Creating company:", companyData);
      
      // Create company using GraphQL service
      const newCompany = await companyService.createCompany({
        name: companyData.name,
        email: companyData.email,
        phone: companyData.phone || undefined,
        website: companyData.website || undefined,
        address: companyData.address || undefined,
        description: companyData.description || undefined,
        isActive: true // New companies are active by default
      });
      
      console.log("✅ Company created successfully:", newCompany);
      
      // Only refresh if this is not a mock company (to avoid additional API calls when GraphQL is broken)
      if (onRefresh && !newCompany.id.startsWith('mock-company-')) {
        onRefresh();
      } else if (newCompany.id.startsWith('mock-company-')) {
        console.log("🎭 Mock company created - skipping refresh to avoid API errors");
        // Show success message for mock company
        alert(`✅ Company "${newCompany.name}" created successfully!\n\n⚠️ Note: This is a demo company for testing purposes.`);
      }
    } catch (error: any) {
      console.error("❌ Error creating company:", error);
      console.error("❌ Error details:", JSON.stringify(error, null, 2));
      if (error.errors && error.errors.length > 0) {
        console.error("❌ GraphQL errors:", error.errors);
        error.errors.forEach((gqlError: any, index: number) => {
          console.error(`❌ GraphQL Error ${index + 1}:`, {
            message: gqlError.message,
            errorType: gqlError.errorType,
            path: gqlError.path,
            locations: gqlError.locations
          });
        });
      }
      throw error;
    }
  };

  const handleCreateCompanyWithAdmin = async (data: CompanyWithAdminData) => {
    try {
      console.log("Creating company with admin:", data);
      
      const result = await companyAdminService.createCompanyWithAdmin(data);
      
      console.log("✅ Company and admin created successfully:", result);
      
      // Show success message with temporary password
      const credentialsMessage = `✅ Company and admin created successfully!

📧 Admin Email: ${data.admin.email}
🔑 Temporary Password: ${result.tempPassword}
🌐 Login URL: ${window.location.origin}/login

⚠️  Important Notes:
• The admin must change this password on first login
• Please share these credentials securely with the admin
• You can also check the server console for the full welcome email content

💡 Tip: Copy this information before closing the alert!`;

      // Copy to clipboard for easy sharing
      try {
        navigator.clipboard.writeText(`Admin Login Details:
Email: ${data.admin.email}
Password: ${result.tempPassword}
Login URL: ${window.location.origin}/login`);
        
        alert(credentialsMessage + '\n\n✅ Credentials copied to clipboard!');
      } catch (e) {
        alert(credentialsMessage);
      }
      
      // Refresh the companies list
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error("❌ Error creating company with admin:", error);
      alert(`❌ Error creating company with admin: ${error.message}`);
      throw error;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Inactive
        </span>
      );
    }
  };

  const handleViewCompany = (company: Company) => {
    setSelectedCompany(company);
    setShowViewModal(true);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setShowEditModal(true);
  };

  const handleDeleteCompany = (company: Company) => {
    setSelectedCompany(company);
    setShowDeleteConfirm(true);
  };

  const handleToggleStatus = async (companyId: string, currentStatus: boolean) => {
    try {
      console.log(`Toggling company ${companyId} from ${currentStatus} to ${!currentStatus}`);
      
      await companyService.updateCompany({
        id: companyId,
        isActive: !currentStatus
      });
      
      console.log('✅ Company status updated successfully');
      
      // Refresh the companies list
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('❌ Error updating company status:', error);
      alert(`Error updating company status: ${error.message}`);
    }
  };

  const confirmDeleteCompany = async () => {
    if (!selectedCompany) return;
    
    try {
      console.log(`Deleting company ${selectedCompany.id}`);
      
      // Check if company has any admins or jobs first
      if (selectedCompany.adminCount > 0) {
        alert(`Cannot delete company "${selectedCompany.name}" because it has ${selectedCompany.adminCount} admin(s). Please remove or reassign the admins first.`);
        return;
      }
      
      if (selectedCompany.jobCount > 0) {
        alert(`Cannot delete company "${selectedCompany.name}" because it has ${selectedCompany.jobCount} job(s). Please delete the jobs first.`);
        return;
      }
      
      await companyService.deleteCompany(selectedCompany.id);
      
      console.log('✅ Company deleted successfully');
      
      // Close modal and refresh list
      setShowDeleteConfirm(false);
      setSelectedCompany(null);
      
      if (onRefresh) {
        onRefresh();
      }
      
      alert(`Company "${selectedCompany.name}" has been deleted successfully.`);
    } catch (error: any) {
      console.error('❌ Error deleting company:', error);
      alert(`Error deleting company: ${error.message}`);
    }
  };

  const handleEditSubmit = async (updatedData: any) => {
    if (!selectedCompany) return;
    
    try {
      console.log('Updating company:', updatedData);
      
      await companyService.updateCompany({
        id: selectedCompany.id,
        ...updatedData
      });
      
      console.log('✅ Company updated successfully');
      
      // Close modal and refresh list
      setShowEditModal(false);
      setSelectedCompany(null);
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('❌ Error updating company:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Companies Management
          </h2>
          <p className="text-gray-600">
            Manage registered companies and their settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddModal(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Company Only
          </Button>
          <Button onClick={() => setShowCreateWithAdminModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Company & Admin
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statistics
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Building className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {company.name}
                        </div>
                        {company.website && (
                          <div className="text-sm text-gray-500">
                            {company.website}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{company.email}</div>
                    {company.phone && (
                      <div className="text-sm text-gray-500">
                        {company.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {company.adminCount} admins
                      </div>
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-1" />
                        {company.jobCount} jobs
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {company.applicationCount} applications
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(company.isActive)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="View Details"
                        onClick={() => handleViewCompany(company)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Edit Company"
                        onClick={() => handleEditCompany(company)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleToggleStatus(company.id, company.isActive)
                        }
                        title={company.isActive ? "Deactivate" : "Activate"}
                      >
                        {company.isActive ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        title="Delete Company"
                        onClick={() => handleDeleteCompany(company)}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No companies found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Get started by adding your first company."}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <div className="mt-6">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Company
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Companies
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {companies.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Active Companies
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {companies.filter((c) => c.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {companies.reduce((sum, c) => sum + c.adminCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Company Modal */}
      <AddCompanyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddCompany}
      />

      {/* Create Company with Admin Modal */}
      <CreateCompanyWithAdminModal
        isOpen={showCreateWithAdminModal}
        onClose={() => setShowCreateWithAdminModal(false)}
        onSubmit={handleCreateCompanyWithAdmin}
      />

      {/* View Company Details Modal */}
      {showViewModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Company Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">{selectedCompany.name}</h4>
                  <div className="flex items-center mt-1">
                    {selectedCompany.isActive ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h5>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {selectedCompany.email}
                    </div>
                    {selectedCompany.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {selectedCompany.phone}
                      </div>
                    )}
                    {selectedCompany.website && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Globe className="h-4 w-4 mr-2" />
                        {selectedCompany.website}
                      </div>
                    )}
                    {selectedCompany.address && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {selectedCompany.address}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Statistics</h5>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      {selectedCompany.adminCount} Admins
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Briefcase className="h-4 w-4 mr-2" />
                      {selectedCompany.jobCount} Jobs
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {selectedCompany.applicationCount} Applications
                    </div>
                  </div>
                </div>
              </div>

              {selectedCompany.description && (
                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Description</h5>
                  <p className="text-sm text-gray-600">{selectedCompany.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm text-gray-500">
                <div>
                  <span className="font-medium">Created:</span> {new Date(selectedCompany.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Updated:</span> {new Date(selectedCompany.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <Button variant="outline" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setShowViewModal(false);
                handleEditCompany(selectedCompany);
              }}>
                Edit Company
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {showEditModal && selectedCompany && (
        <AddCompanyModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCompany(null);
          }}
          onSubmit={handleEditSubmit}
          initialData={{
            name: selectedCompany.name,
            email: selectedCompany.email,
            phone: selectedCompany.phone,
            website: selectedCompany.website,
            address: selectedCompany.address,
            description: selectedCompany.description
          }}
          title="Edit Company"
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Delete Company</h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete <strong>&quot;{selectedCompany.name}&quot;</strong>? 
                This action cannot be undone.
              </p>
              
              {(selectedCompany.adminCount > 0 || selectedCompany.jobCount > 0) && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> This company has {selectedCompany.adminCount} admin(s) 
                    and {selectedCompany.jobCount} job(s). You must remove these first before deleting.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedCompany(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDeleteCompany}
              >
                Delete Company
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
