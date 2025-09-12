// src/components/admin/AdminOverviewTab.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Building,
  Users,
  FileText,
  TrendingUp,
  Activity,
  Plus,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { PlatformStats, ActivityLog, AdminTabType } from "./types";

interface AdminOverviewTabProps {
  stats: PlatformStats;
  recentActivity: ActivityLog[];
  onNavigateToTab?: (tab: AdminTabType) => void;
}

export default function AdminOverviewTab({
  stats,
  recentActivity,
  onNavigateToTab,
}: AdminOverviewTabProps) {
  const statsCards = [
    {
      title: "Total Companies",
      value: stats.totalCompanies,
      icon: Building,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+12%",
      changeType: "positive" as const,
    },
    {
      title: "Active Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+8%",
      changeType: "positive" as const,
    },
    {
      title: "Total Applications",
      value: stats.totalApplications,
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "+23%",
      changeType: "positive" as const,
    },
    {
      title: "Platform Growth",
      value: `${stats.recentSignups}`,
      icon: TrendingUp,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      change: "+15%",
      changeType: "positive" as const,
      subtitle: "New signups this month",
    },
  ];

  const getActivityIcon = (type: ActivityLog["type"]) => {
    switch (type) {
      case "company_created":
        return <Building className="h-4 w-4 text-blue-600" />;
      case "user_created":
        return <Users className="h-4 w-4 text-green-600" />;
      case "company_activated":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "company_deactivated":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value.toLocaleString()}
                  </p>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.subtitle}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-medium ${
                    stat.changeType === "positive"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {stat.change}
                </span>
                <p className="text-xs text-gray-500">vs last month</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            className="justify-start h-auto p-4 flex-col items-start"
            onClick={() => onNavigateToTab?.('companies')}
          >
            <Plus className="h-5 w-5 mb-2" />
            <span className="font-medium">Add Company</span>
            <span className="text-xs opacity-70">Register new company</span>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto p-4 flex-col items-start"
            onClick={() => onNavigateToTab?.('users')}
          >
            <Users className="h-5 w-5 mb-2" />
            <span className="font-medium">Create Admin</span>
            <span className="text-xs opacity-70">Add company admin</span>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto p-4 flex-col items-start"
            onClick={() => onNavigateToTab?.('reports')}
          >
            <FileText className="h-5 w-5 mb-2" />
            <span className="font-medium">Platform Report</span>
            <span className="text-xs opacity-70">Generate analytics</span>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto p-4 flex-col items-start"
            onClick={() => onNavigateToTab?.('analytics')}
          >
            <TrendingUp className="h-5 w-5 mb-2" />
            <span className="font-medium">View Analytics</span>
            <span className="text-xs opacity-70">Detailed insights</span>
          </Button>
        </div>
      </div>

      {/* Platform Health & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Health */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Platform Health
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">System Status</span>
              </div>
              <span className="text-sm font-medium text-green-600">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Database</span>
              </div>
              <span className="text-sm font-medium text-green-600">
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">File Storage</span>
              </div>
              <span className="text-sm font-medium text-yellow-600">
                85% Capacity
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Email Service</span>
              </div>
              <span className="text-sm font-medium text-green-600">Active</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentActivity.slice(0, 6).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <Button variant="ghost" size="sm" className="w-full">
              View All Activity
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
