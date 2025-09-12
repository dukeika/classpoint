//src/components/admin/SuperAdminDashboard.tsx
"use client";

import { useState } from "react";
import { useAdminDataReal } from "@/hooks/useAdminDataReal";
import AdminDashboardHeader from "@/components/admin/AdminDashboardHeader";
import AdminDashboardNavigation from "@/components/admin/AdminDashboardNavigation";
import AdminOverviewTab from "@/components/admin/AdminOverviewTab";
import AdminCompaniesTab from "@/components/admin/AdminCompaniesTab";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import JobsTab from "@/components/admin/JobsTab";
import EnhancedApplicationsTab from "@/components/admin/EnhancedApplicationsTab";
import NotificationSystem, { Notification } from "@/components/shared/NotificationSystem";
import PlatformReportsTab from "@/components/admin/PlatformReportsTab";
import AnalyticsTab from "@/components/admin/AnalyticsTab";
import NotificationsSettingsTab from "@/components/admin/NotificationsSettingsTab";
import SettingsTab from "@/components/admin/SettingsTab";
import { AdminTabType } from "@/components/admin/types";

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTabType>("overview");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const handleTabChange = (tab: AdminTabType) => {
    console.log(`🔄 handleTabChange called - Switching from ${activeTab} to ${tab}`);
    setActiveTab(tab);
    console.log(`✅ Tab state updated to: ${tab}`);
  };
  const { companies, companyAdmins, platformStats, recentActivity, loading, refreshData } =
    useAdminDataReal();
  

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-abhh-teal-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-abhh-yellow-500 rounded-xl flex items-center justify-center mb-4 mx-auto shadow-abhh animate-pulse">
            <div className="w-8 h-8 border-2 border-abhh-teal-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-abhh-teal-600 font-medium">
            Loading ABHH Platform...
          </p>
        </div>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case "overview":
        return (
          <AdminOverviewTab
            stats={platformStats}
            recentActivity={recentActivity}
            onNavigateToTab={setActiveTab}
          />
        );
      case "companies":
        return <AdminCompaniesTab companies={companies} onRefresh={refreshData} />;
      case "users":
        return (
          <AdminUsersTab 
            companyAdmins={companyAdmins} 
            companies={companies}
            onRefresh={refreshData}
          />
        );
      case "jobs":
        return <JobsTab onRefresh={refreshData} />;
      case "applications":
        return <EnhancedApplicationsTab onRefresh={refreshData} />;
      case "tests":
        return (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Written Tests Management</h2>
            <p className="text-gray-600">Coming soon - Create and manage written tests for Stage 2</p>
          </div>
        );
      case "interviews":
        return (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Interview Management</h2>
            <p className="text-gray-600">Coming soon - Schedule and manage video interviews for Stage 4</p>
          </div>
        );
      case "reports":
        return <PlatformReportsTab />;
      case "analytics":
        return <AnalyticsTab />;
      case "notifications":
        return <NotificationsSettingsTab />;
      case "settings":
        return <SettingsTab />;
      default:
        return (
          <AdminOverviewTab
            stats={platformStats}
            recentActivity={recentActivity}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-abhh-teal-50 to-white">
      <div className="relative">
        <AdminDashboardHeader onNavigateToTab={handleTabChange} />
        <div className="absolute top-4 right-8 z-50">
          <NotificationSystem
            notifications={notifications}
            onMarkAsRead={handleMarkNotificationRead}
            onMarkAllAsRead={handleMarkAllNotificationsRead}
            onDeleteNotification={handleDeleteNotification}
            onActionClick={handleNotificationAction}
            userRole="super_admin"
          />
        </div>
      </div>
      <AdminDashboardNavigation
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveTab()}
      </div>
    </div>
  );
}
