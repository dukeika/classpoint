// src/components/admin/CreateCompanyWithAdminModal.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Building, Mail, Phone, Globe, MapPin, FileText, User, Key, Eye, EyeOff } from "lucide-react";

interface CreateCompanyWithAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CompanyWithAdminData) => Promise<void>;
}

export interface CompanyWithAdminData {
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

export default function CreateCompanyWithAdminModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateCompanyWithAdminModalProps) {
  const [formData, setFormData] = useState<CompanyWithAdminData>({
    company: {
      name: "",
      email: "",
      phone: "",
      website: "",
      address: "",
      description: "",
    },
    admin: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    }
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [currentStep, setCurrentStep] = useState<'company' | 'admin'>('company');

  if (!isOpen) return null;

  const validateCompanyForm = (): boolean => {
    const newErrors: any = {};

    if (!formData.company.name.trim()) {
      newErrors.companyName = "Company name is required";
    }

    if (!formData.company.email.trim()) {
      newErrors.companyEmail = "Company email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.company.email)) {
      newErrors.companyEmail = "Please enter a valid email address";
    }

    if (formData.company.website && !formData.company.website.startsWith("http")) {
      newErrors.companyWebsite = "Website must start with http:// or https://";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAdminForm = (): boolean => {
    const newErrors: any = {};

    if (!formData.admin.firstName.trim()) {
      newErrors.adminFirstName = "First name is required";
    }

    if (!formData.admin.lastName.trim()) {
      newErrors.adminLastName = "Last name is required";
    }

    if (!formData.admin.email.trim()) {
      newErrors.adminEmail = "Admin email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin.email)) {
      newErrors.adminEmail = "Please enter a valid email address";
    }

    // Check if admin email is different from company email
    if (formData.admin.email === formData.company.email) {
      newErrors.adminEmail = "Admin email must be different from company email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCompanyForm()) {
      setCurrentStep('admin');
    }
  };

  const handleBack = () => {
    setCurrentStep('company');
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAdminForm()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error("Error creating company and admin:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      company: {
        name: "",
        email: "",
        phone: "",
        website: "",
        address: "",
        description: "",
      },
      admin: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      }
    });
    setErrors({});
    setCurrentStep('company');
    onClose();
  };

  const handleCompanyInputChange = (field: keyof CompanyWithAdminData['company'], value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      company: { ...prev.company, [field]: value }
    }));
    if (errors[`company${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      setErrors((prev: any) => ({ 
        ...prev, 
        [`company${field.charAt(0).toUpperCase() + field.slice(1)}`]: undefined 
      }));
    }
  };

  const handleAdminInputChange = (field: keyof CompanyWithAdminData['admin'], value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      admin: { ...prev.admin, [field]: value }
    }));
    if (errors[`admin${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      setErrors((prev: any) => ({ 
        ...prev, 
        [`admin${field.charAt(0).toUpperCase() + field.slice(1)}`]: undefined 
      }));
    }
  };

  const renderCompanyStep = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Building className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company Name *
        </label>
        <div className="relative">
          <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={formData.company.name}
            onChange={(e) => handleCompanyInputChange('name', e.target.value)}
            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
              errors.companyName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter company name"
          />
        </div>
        {errors.companyName && (
          <p className="text-sm text-red-600 mt-1">{errors.companyName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company Email *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="email"
            value={formData.company.email}
            onChange={(e) => handleCompanyInputChange('email', e.target.value)}
            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
              errors.companyEmail ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="company@example.com"
          />
        </div>
        {errors.companyEmail && (
          <p className="text-sm text-red-600 mt-1">{errors.companyEmail}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              value={formData.company.phone}
              onChange={(e) => handleCompanyInputChange('phone', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Website
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="url"
              value={formData.company.website}
              onChange={(e) => handleCompanyInputChange('website', e.target.value)}
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
                errors.companyWebsite ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="https://company.com"
            />
          </div>
          {errors.companyWebsite && (
            <p className="text-sm text-red-600 mt-1">{errors.companyWebsite}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={formData.company.address}
            onChange={(e) => handleCompanyInputChange('address', e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
            placeholder="Company address"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <textarea
            value={formData.company.description}
            onChange={(e) => handleCompanyInputChange('description', e.target.value)}
            rows={3}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
            placeholder="Brief description of the company"
          />
        </div>
      </div>
    </div>
  );

  const renderAdminStep = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <User className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Company Administrator</h3>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
        <div className="flex items-start">
          <Key className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Admin Account Setup</p>
            <p>A temporary password will be generated for the admin. They'll need to change it on first login.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            value={formData.admin.firstName}
            onChange={(e) => handleAdminInputChange('firstName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
              errors.adminFirstName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="First name"
          />
          {errors.adminFirstName && (
            <p className="text-sm text-red-600 mt-1">{errors.adminFirstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.admin.lastName}
            onChange={(e) => handleAdminInputChange('lastName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
              errors.adminLastName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Last name"
          />
          {errors.adminLastName && (
            <p className="text-sm text-red-600 mt-1">{errors.adminLastName}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Admin Email *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="email"
            value={formData.admin.email}
            onChange={(e) => handleAdminInputChange('email', e.target.value)}
            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
              errors.adminEmail ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="admin@example.com"
          />
        </div>
        {errors.adminEmail && (
          <p className="text-sm text-red-600 mt-1">{errors.adminEmail}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Admin Phone
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="tel"
            value={formData.admin.phone}
            onChange={(e) => handleAdminInputChange('phone', e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Create Company & Admin
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Step {currentStep === 'company' ? '1' : '2'} of 2: {currentStep === 'company' ? 'Company Details' : 'Admin Account'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={currentStep === 'company' ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit}>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {currentStep === 'company' ? renderCompanyStep() : renderAdminStep()}
          </div>

          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${currentStep === 'company' ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`w-2 h-2 rounded-full ${currentStep === 'admin' ? 'bg-blue-600' : 'bg-gray-300'}`} />
            </div>

            <div className="flex items-center space-x-3">
              {currentStep === 'admin' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating...
                  </div>
                ) : currentStep === 'company' ? (
                  'Next: Add Admin'
                ) : (
                  'Create Company & Admin'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}