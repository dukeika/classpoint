// src/components/company/CompanySelector.tsx
"use client";

import { useState, useEffect } from "react";
import { Building, ChevronDown, Check } from "lucide-react";
import { companyService } from "@/services/companyService";
import { userService } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";

interface Company {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

interface CompanySelectorProps {
  selectedCompanyId?: string;
  onCompanyChange: (companyId: string, company: Company) => void;
  className?: string;
}

export default function CompanySelector({ 
  selectedCompanyId, 
  onCompanyChange, 
  className = "" 
}: CompanySelectorProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  useEffect(() => {
    loadUserCompanies();
  }, [user]);

  useEffect(() => {
    if (selectedCompanyId && companies.length > 0) {
      const company = companies.find(c => c.id === selectedCompanyId);
      if (company) {
        setSelectedCompany(company);
      }
    } else if (!selectedCompanyId && companies.length === 1) {
      // If user has only one company, auto-select it
      const company = companies[0];
      setSelectedCompany(company);
      onCompanyChange(company.id, company);
    }
  }, [selectedCompanyId, companies, onCompanyChange]);

  const loadUserCompanies = async () => {
    try {
      if (!user?.userId) return;

      // Get user record to find their company assignments
      const userRecord = await userService.getUserBySub(user.userId);
      
      if (!userRecord?.companyId) {
        console.log("User has no company assignment");
        setLoading(false);
        return;
      }

      // For now, get the single assigned company
      // Later this can be enhanced to support multiple company assignments
      const company = await companyService.getCompanyById(userRecord.companyId);
      
      if (company) {
        setCompanies([{
          id: company.id,
          name: company.name,
          email: company.email,
          isActive: company.isActive
        }]);
      }
    } catch (error) {
      console.error("Error loading user companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setIsOpen(false);
    onCompanyChange(company.id, company);
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Building className="w-5 h-5 text-gray-400" />
        <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
        <Building className="w-5 h-5" />
        <span className="text-sm">No companies assigned</span>
      </div>
    );
  }

  if (companies.length === 1 && selectedCompany) {
    // Single company - show without dropdown
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Building className="w-5 h-5 text-blue-600" />
        <div>
          <div className="text-sm font-semibold text-gray-900">
            {selectedCompany.name}
          </div>
          <div className="text-xs text-gray-500">
            {selectedCompany.email}
          </div>
        </div>
      </div>
    );
  }

  // Multiple companies - show dropdown
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-[200px]"
      >
        <Building className="w-5 h-5 text-blue-600" />
        <div className="flex-1 text-left">
          {selectedCompany ? (
            <>
              <div className="text-sm font-semibold text-gray-900">
                {selectedCompany.name}
              </div>
              <div className="text-xs text-gray-500">
                {selectedCompany.email}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500">Select company...</div>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleCompanySelect(company)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                  selectedCompany?.id === company.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {company.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {company.email}
                    </div>
                  </div>
                </div>
                {selectedCompany?.id === company.id && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}