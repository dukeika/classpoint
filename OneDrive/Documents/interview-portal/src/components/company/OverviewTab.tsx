// src/components/company/OverviewTab.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  FileText,
  Users,
  Calendar,
  TrendingUp,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Job, Application } from "./types";

interface OverviewTabProps {
  jobs: Job[];
  applications: Application[];
}

export default function OverviewTab({ jobs, applications }: OverviewTabProps) {
  const getStageDisplay = (stage: Application["stage"]) => {
    const stages = {
      applied: { label: "Applied", color: "bg-gray-100 text-gray-800" },
      written_test: {
        label: "Written Test",
        color: "bg-blue-100 text-blue-800",
      },
      video_test: {
        label: "Video Test",
        color: "bg-purple-100 text-purple-800",
      },
      interview: { label: "Interview", color: "bg-yellow-100 text-yellow-800" },
      completed: { label: "Completed", color: "bg-green-100 text-green-800" },
    };
    return stages[stage];
  };

  const getStatusIcon = (status: Application["status"]) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const statsCards = [
    {
      title: "Active Jobs",
      value: jobs.filter((j) => j.status === "active").length,
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Total Applications",
      value: applications.length,
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Interviews Scheduled",
      value: applications.filter((a) => a.stage === "interview").length,
      icon: Calendar,
      color: "text-purple-600",
    },
    {
      title: "Pending Reviews",
      value: applications.filter((a) => a.status === "pending").length,
      icon: TrendingUp,
      color: "text-yellow-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Applications
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.slice(0, 5).map((application) => {
                const stageInfo = getStageDisplay(application.stage);
                return (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {application.candidateName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.candidateEmail}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {application.jobTitle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stageInfo.color}`}
                      >
                        {stageInfo.label}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        Stage {application.currentStage} of{" "}
                        {application.totalStages}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(application.status)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">
                          {application.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(application.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
