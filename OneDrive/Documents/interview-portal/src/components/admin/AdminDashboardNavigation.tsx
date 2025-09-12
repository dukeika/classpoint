// src/components/admin/AdminDashboardNavigation.tsx
"use client";

import { BarChart3, Building, Users, Settings, TrendingUp, FileText, Bell, Briefcase, UserCheck, PenTool, Video } from "lucide-react";
import { AdminTabType } from "./types";

interface AdminDashboardNavigationProps {
  activeTab: AdminTabType;
  setActiveTab: (tab: AdminTabType) => void;
}

export default function AdminDashboardNavigation({
  activeTab,
  setActiveTab,
}: AdminDashboardNavigationProps) {
  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "companies", label: "Companies", icon: Building },
    { id: "users", label: "Users", icon: Users },
    { id: "jobs", label: "Jobs", icon: Briefcase },
    { id: "applications", label: "Applications", icon: UserCheck },
    { id: "tests", label: "Tests", icon: PenTool },
    { id: "interviews", label: "Interviews", icon: Video },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  return (
    <div className="bg-white border-b border-abhh-teal-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTabType)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-abhh-yellow-500 text-abhh-teal-600 bg-abhh-yellow-50"
                  : "border-transparent text-abhh-teal-400 hover:text-abhh-teal-600 hover:border-abhh-teal-300"
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
