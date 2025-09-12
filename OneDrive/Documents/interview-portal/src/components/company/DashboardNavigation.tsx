// src/components/company/DashboardNavigation.tsx
"use client";

import { TrendingUp, FileText, Users } from "lucide-react";
import { TabType } from "./types";

interface DashboardNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function DashboardNavigation({
  activeTab,
  setActiveTab,
}: DashboardNavigationProps) {
  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "jobs", label: "Jobs", icon: FileText },
    { id: "applications", label: "Applications", icon: Users },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
  ] as const;

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
