// src/components/admin/CreateAdminModal.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, UserPlus, User, Mail, Phone, Building, Eye, EyeOff } from "lucide-react";
import { Company } from "./types";

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (adminData: AdminFormData) => Promise<void>;
  companies: Company[];
  initialData?: Partial<AdminFormData>;
  title?: string;
}

interface AdminFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyId: string;
  temporaryPassword: string;
}

export default function CreateAdminModal({
  isOpen,
  onClose,
  onSubmit,
  companies,
  initialData,
  title = "Create Company Admin",
}: CreateAdminModalProps) {
  const [formData, setFormData] = useState<AdminFormData>({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    companyId: initialData?.companyId || "",
    temporaryPassword: initialData?.temporaryPassword || generateTemporaryPassword(),
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<AdminFormData>>({});
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  function generateTemporaryPassword(): string {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    // Ensure at least one character from each required type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // Uppercase
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // Lowercase
    password += "0123456789"[Math.floor(Math.random() * 10)]; // Number
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // Special character
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<AdminFormData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.companyId) {
      newErrors.companyId = "Please select a company";
    }

    if (!formData.temporaryPassword.trim()) {
      newErrors.temporaryPassword = "Temporary password is required";
    } else if (formData.temporaryPassword.length < 8) {
      newErrors.temporaryPassword = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error("Error creating admin:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      companyId: "",
      temporaryPassword: generateTemporaryPassword(),
    });
    setErrors({});
    setShowPassword(false);
    onClose();
  };

  const handleInputChange = (
    field: keyof AdminFormData,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const regeneratePassword = () => {
    const newPassword = generateTemporaryPassword();
    setFormData(prev => ({ ...prev, temporaryPassword: newPassword }));
    if (errors.temporaryPassword) {
      setErrors(prev => ({ ...prev, temporaryPassword: undefined }));
    }
  };

  const selectedCompany = companies.find(c => c.id === formData.companyId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <UserPlus className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className={`pl-10 pr-4 py-3 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter first name"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className={`pl-10 pr-4 py-3 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter last name"
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`pl-10 pr-4 py-3 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Company Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.companyId}
                  onChange={(e) => handleInputChange("companyId", e.target.value)}
                  className={`pl-10 pr-4 py-3 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 ${
                    errors.companyId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.companyId && (
                <p className="mt-1 text-sm text-red-600">{errors.companyId}</p>
              )}
              {selectedCompany && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Selected:</strong> {selectedCompany.name}
                  </p>
                  <p className="text-xs text-blue-600">{selectedCompany.email}</p>
                </div>
              )}
            </div>

            {/* Temporary Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temporary Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.temporaryPassword}
                  onChange={(e) => handleInputChange("temporaryPassword", e.target.value)}
                  className={`pr-20 pl-4 py-3 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400 ${
                    errors.temporaryPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Temporary password"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {errors.temporaryPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.temporaryPassword}</p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  The admin will be required to change this password on first login.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={regeneratePassword}
                >
                  Regenerate
                </Button>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Admin Setup Process
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>The admin will receive a <strong>welcome email</strong> with their temporary password</li>
                      <li>They can log in immediately at your application login page</li>
                      <li>They will be prompted to <strong>create a new password</strong> on first login</li>
                      <li>After setting up their password, they&apos;ll have full access to their company&apos;s data</li>
                      <li>No email verification required - they can start working right away!</li>
                    </ul>
                  </div>
                  <div className="mt-3 p-2 bg-white border border-blue-300 rounded text-xs">
                    <strong>Login URL:</strong><br />
                    <code className="text-blue-800">{window.location.origin}/login</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? "Creating..." : "Create Administrator"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}