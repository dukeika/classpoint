// File: src/components/candidate/CandidateDashboardNavigation.tsx
"use client";

import { CandidateTabType } from "./types";
import {
  Search,
  FileText,
  User,
  Bell,
  BookOpen,
  Video,
  Calendar,
} from "lucide-react";

interface CandidateDashboardNavigationProps {
  activeTab: CandidateTabType;
  setActiveTab: (tab: CandidateTabType) => void;
}

export default function CandidateDashboardNavigation({
  activeTab,
  setActiveTab,
}: CandidateDashboardNavigationProps) {
  const navItems = [
    {
      id: "browse" as CandidateTabType,
      label: "Browse Jobs",
      icon: Search,
    },
    {
      id: "applications" as CandidateTabType,
      label: "My Applications",
      icon: FileText,
    },
    {
      id: "test" as CandidateTabType,
      label: "Tests",
      icon: BookOpen,
    },
    {
      id: "video" as CandidateTabType,
      label: "Video Tests",
      icon: Video,
    },
    {
      id: "interview" as CandidateTabType,
      label: "Interviews",
      icon: Calendar,
    },
    {
      id: "profile" as CandidateTabType,
      label: "Profile",
      icon: User,
    },
    {
      id: "notifications" as CandidateTabType,
      label: "Notifications",
      icon: Bell,
    },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? "border-abhh-teal-600 text-abhh-teal-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
