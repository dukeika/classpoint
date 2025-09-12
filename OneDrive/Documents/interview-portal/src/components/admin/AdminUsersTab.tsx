// src/components/admin/AdminUsersTab.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import CreateAdminModal from "./CreateAdminModal";
import { userService } from "@/services/userService";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Eye,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Building,
} from "lucide-react";
import { CompanyAdmin } from "./types";

interface AdminUsersTabProps {
  companyAdmins: CompanyAdmin[];
  companies: any[];
  onRefresh?: () => void;
}

export default function AdminUsersTab({
  companyAdmins,
  companies,
  onRefresh,
}: AdminUsersTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<CompanyAdmin | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const filteredAdmins = companyAdmins.filter((admin) => {
    const matchesSearch =
      admin.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && admin.isActive) ||
      (statusFilter === "inactive" && !admin.isActive);
    const matchesCompany =
      companyFilter === "all" || admin.companyId === companyFilter;
    return matchesSearch && matchesStatus && matchesCompany;
  });

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

  const getLastLoginDisplay = (lastLoginAt?: string) => {
    if (!lastLoginAt) {
      return (
        <span className="inline-flex items-center text-xs text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          Never
        </span>
      );
    }

    const lastLogin = new Date(lastLoginAt);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60)
    );

    let timeAgo;
    if (diffInHours < 1) timeAgo = "Just now";
    else if (diffInHours < 24) timeAgo = `${diffInHours}h ago`;
    else if (diffInHours < 48) timeAgo = "Yesterday";
    else timeAgo = lastLogin.toLocaleDateString();

    return (
      <span className="inline-flex items-center text-xs text-gray-500">
        <Clock className="w-3 h-3 mr-1" />
        {timeAgo}
      </span>
    );
  };

  const handleCreateAdmin = async (adminData: any) => {
    try {
      console.log("Creating admin:", adminData);
      
      // Create the admin user with Cognito account and database record
      const newAdmin = await userService.createAdminUser({
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        email: adminData.email,
        phone: adminData.phone || undefined,
        companyId: adminData.companyId,
        temporaryPassword: adminData.temporaryPassword
      });
      
      console.log("✅ Admin created successfully:", newAdmin);
      
      // Show success message with important information
      const verifyUrl = `${window.location.origin}/verify?email=${encodeURIComponent(adminData.email)}`;
      
      alert(`✅ Admin user created successfully!

📧 Email: ${adminData.email}
🔑 Password: ${adminData.temporaryPassword}

⚠️ IMPORTANT NEXT STEPS:
1. The admin user will receive a verification email with a 6-digit code
2. They should visit: ${verifyUrl}
3. Enter their email and the verification code
4. After verification, they can login with the provided credentials

📬 Verification email will arrive shortly.

💡 After email verification, they can log in with their credentials and will be prompted to change their password.`);
      
      // Refresh the admin list to show the new admin
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error("❌ Error creating admin:", error);
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

  const handleViewAdmin = (admin: CompanyAdmin) => {
    setSelectedAdmin(admin);
    setShowViewModal(true);
  };

  const handleEditAdmin = (admin: CompanyAdmin) => {
    setSelectedAdmin(admin);
    setShowEditModal(true);
  };

  const handleDeleteAdmin = (admin: CompanyAdmin) => {
    setSelectedAdmin(admin);
    setShowDeleteConfirm(true);
  };

  const handleToggleStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      console.log(`Toggling admin ${adminId} from ${currentStatus} to ${!currentStatus}`);
      
      await userService.updateUser({
        id: adminId,
        isActive: !currentStatus
      });
      
      console.log('✅ Admin status updated successfully');
      
      // Refresh the admin list
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('❌ Error updating admin status:', error);
      alert(`Error updating admin status: ${error.message}`);
    }
  };

  const confirmDeleteAdmin = async () => {
    if (!selectedAdmin) return;
    
    try {
      console.log(`Deleting admin ${selectedAdmin.id}`);
      
      // For safety, we'll just deactivate the admin instead of hard delete
      await userService.updateUser({
        id: selectedAdmin.id,
        isActive: false
      });
      
      console.log('✅ Admin deactivated successfully');
      
      // Close modal and refresh list
      setShowDeleteConfirm(false);
      setSelectedAdmin(null);
      
      if (onRefresh) {
        onRefresh();
      }
      
      alert(`Admin "${selectedAdmin.firstName} ${selectedAdmin.lastName}" has been deactivated.`);
    } catch (error: any) {
      console.error('❌ Error deactivating admin:', error);
      alert(`Error deactivating admin: ${error.message}`);
    }
  };

  const handleEditSubmit = async (updatedData: any) => {
    if (!selectedAdmin) return;
    
    try {
      console.log('Updating admin:', updatedData);
      
      await userService.updateUser({
        id: selectedAdmin.id,
        firstName: updatedData.firstName,
        lastName: updatedData.lastName,
        email: updatedData.email,
        phone: updatedData.phone
      });
      
      console.log('✅ Admin updated successfully');
      
      // Close modal and refresh list
      setShowEditModal(false);
      setSelectedAdmin(null);
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('❌ Error updating admin:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Users Management</h2>
          <p className="text-gray-600">
            Manage company administrators and their permissions
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Admin
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search users..."
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
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            >
              <option value="all">All Companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
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
              {filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {admin.firstName} {admin.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {admin.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {admin.companyName}
                    </div>
                    <div className="text-sm text-gray-500">Company Admin</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="h-3 w-3 mr-1" />
                        {admin.email}
                      </div>
                      {admin.phone && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="h-3 w-3 mr-1" />
                          {admin.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(admin.isActive)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getLastLoginDisplay(admin.lastLoginAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="View Details"
                        onClick={() => handleViewAdmin(admin)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Edit User"
                        onClick={() => handleEditAdmin(admin)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleToggleStatus(admin.id, admin.isActive)
                        }
                        title={admin.isActive ? "Deactivate" : "Activate"}
                      >
                        {admin.isActive ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        title="Delete User"
                        onClick={() => handleDeleteAdmin(admin)}
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

        {filteredAdmins.length === 0 && (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No users found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== "all" || companyFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Get started by creating your first company admin."}
            </p>
            {!searchTerm &&
              statusFilter === "all" &&
              companyFilter === "all" && (
                <div className="mt-6">
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Admin
                  </Button>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {companyAdmins.length}
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
              <p className="text-sm font-medium text-gray-500">Active Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {companyAdmins.filter((a) => a.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Recent Logins</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  companyAdmins.filter(
                    (a) =>
                      a.lastLoginAt &&
                      new Date(a.lastLoginAt) >
                        new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Plus className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                New This Month
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  companyAdmins.filter(
                    (a) =>
                      new Date(a.createdAt) >
                      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Admin Modal */}
      <CreateAdminModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateAdmin}
        companies={companies}
      />

      {/* View Admin Details Modal */}
      {showViewModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Admin Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-gray-600" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">
                    {selectedAdmin.firstName} {selectedAdmin.lastName}
                  </h4>
                  <p className="text-sm text-gray-600">{selectedAdmin.email}</p>
                  <div className="flex items-center mt-1">
                    {selectedAdmin.isActive ? (
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
                      {selectedAdmin.email}
                    </div>
                    {selectedAdmin.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {selectedAdmin.phone}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Company & Role</h5>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="h-4 w-4 mr-2" />
                      {selectedAdmin.companyName}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Shield className="h-4 w-4 mr-2" />
                      Company Administrator
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm text-gray-500">
                <div>
                  <span className="font-medium">Created:</span> {new Date(selectedAdmin.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Last Login:</span> {
                    selectedAdmin.lastLoginAt 
                      ? new Date(selectedAdmin.lastLoginAt).toLocaleDateString()
                      : 'Never'
                  }
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <Button variant="outline" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setShowViewModal(false);
                handleEditAdmin(selectedAdmin);
              }}>
                Edit Admin
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <CreateAdminModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAdmin(null);
          }}
          onSubmit={handleEditSubmit}
          companies={companies}
          initialData={{
            firstName: selectedAdmin.firstName,
            lastName: selectedAdmin.lastName,
            email: selectedAdmin.email,
            phone: selectedAdmin.phone,
            companyId: selectedAdmin.companyId
          }}
          title="Edit Company Admin"
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Deactivate Admin</h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Are you sure you want to deactivate <strong>&quot;{selectedAdmin.firstName} {selectedAdmin.lastName}&quot;</strong>? 
                They will no longer be able to access the admin dashboard.
              </p>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This will deactivate the admin account rather than permanently deleting it. 
                  You can reactivate it later if needed.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedAdmin(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmDeleteAdmin}
              >
                Deactivate Admin
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
