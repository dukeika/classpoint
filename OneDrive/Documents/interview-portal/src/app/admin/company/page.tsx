"use client";

import { useState } from "react";
import { useCompanyData } from "@/hooks/useCompanyDataReal";
import DashboardHeader from "@/components/company/DashboardHeader";
import DashboardNavigation from "@/components/company/DashboardNavigation";
import OverviewTab from "@/components/company/OverviewTab";
import JobsTab from "@/components/company/JobsTab";
import ApplicationsTab from "@/components/company/ApplicationsTab";
import AnalyticsTab from "@/components/company/AnalyticsTab";
import { TabType } from "@/components/company/types";

export default function CompanyDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const { jobs, applications, loading } = useCompanyData();

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
        return <JobsTab jobs={jobs} />;
      case "applications":
        return <ApplicationsTab applications={applications} />;
      case "analytics":
        return <AnalyticsTab applications={applications} />;
      default:
        return <OverviewTab jobs={jobs} applications={applications} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveTab()}
      </div>
    </div>
  );
}
