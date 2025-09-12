//src/app/company/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useCompanyData } from "@/hooks/useCompanyDataReal";
import DashboardHeader from "@/components/company/DashboardHeader";
import DashboardNavigation from "@/components/company/DashboardNavigation";
import OverviewTab from "@/components/company/OverviewTab";
import JobsTab from "@/components/company/JobsTab";
import EnhancedApplicationsTab from "@/components/admin/EnhancedApplicationsTab";
import NotificationSystem, { Notification } from "@/components/shared/NotificationSystem";
import AnalyticsTab from "@/components/company/AnalyticsTab";
import { TabType } from "@/components/company/types";

interface Company {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export default function CompanyDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const { jobs, applications, loading, createJob, updateJob, deleteJob, updateApplicationStage, company } = useCompanyData();

  // Auto-set selectedCompanyId when company data loads
  useEffect(() => {
    if (company && !selectedCompanyId) {
      setSelectedCompanyId(company.id);
      setSelectedCompany({
        id: company.id,
        name: company.name,
        email: company.email,
        isActive: company.isActive
      });
    }
  }, [company, selectedCompanyId]);

  const handleMarkNotificationRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(n => n.id !== notificationId)
    );
  };

  const handleNotificationAction = (notification: Notification) => {
    // Navigate to relevant application review section
    if (notification.applicationId) {
      setActiveTab("applications");
    }
  };

  const handleCompanyChange = (companyId: string, company: Company) => {
    console.log("Company changed:", company);
    setSelectedCompanyId(companyId);
    setSelectedCompany(company);
    // Here you could trigger data refresh for the new company
    // or pass the companyId to your data hooks
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab jobs={jobs} applications={applications} />;
      case "jobs":
        return <JobsTab jobs={jobs} onCreateJob={createJob} onUpdateJob={updateJob} onDeleteJob={deleteJob} />;
      case "applications":
        return <EnhancedApplicationsTab companyId={selectedCompanyId} />;
      case "analytics":
        return <AnalyticsTab applications={applications} />;
      default:
        return <OverviewTab jobs={jobs} applications={applications} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative">
        <DashboardHeader
          selectedCompanyId={selectedCompanyId}
          onCompanyChange={handleCompanyChange}
        />
        <div className="absolute top-4 right-8 z-50">
          <NotificationSystem
            notifications={notifications}
            onMarkAsRead={handleMarkNotificationRead}
            onMarkAllAsRead={handleMarkAllNotificationsRead}
            onDeleteNotification={handleDeleteNotification}
            onActionClick={handleNotificationAction}
            userRole="company_admin"
          />
        </div>
      </div>
      <DashboardNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveTab()}
      </div>
    </div>
  );
}
