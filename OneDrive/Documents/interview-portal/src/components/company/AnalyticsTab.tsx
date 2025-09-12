// File: src/components/company/AnalyticsTab.tsx
"use client";

import { useState, useMemo } from "react";
import { Application } from "./types";
import {
  TrendingUp,
  Users,
  Clock,
  Target,
  Filter,
  Calendar,
  Download,
  BarChart3,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnalyticsTabProps {
  applications: Application[];
}

export default function AnalyticsTab({ applications }: AnalyticsTabProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [selectedMetric, setSelectedMetric] = useState<"applications" | "conversion" | "time">("applications");

  // Calculate analytics data
  const analytics = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const filteredApplications = applications.filter(
      (app) => new Date(app.appliedAt) >= startDate
    );

    // Calculate funnel metrics
    const totalApplications = filteredApplications.length;
    const writtenTestCount = filteredApplications.filter(
      (app) => app.currentStage >= 2
    ).length;
    const videoTestCount = filteredApplications.filter(
      (app) => app.currentStage >= 3
    ).length;
    const interviewCount = filteredApplications.filter(
      (app) => app.currentStage >= 4
    ).length;
    const completedCount = filteredApplications.filter(
      (app) => app.stage === "completed"
    ).length;

    // Calculate conversion rates
    const writtenTestRate = totalApplications > 0 ? (writtenTestCount / totalApplications) * 100 : 0;
    const videoTestRate = writtenTestCount > 0 ? (videoTestCount / writtenTestCount) * 100 : 0;
    const interviewRate = videoTestCount > 0 ? (interviewCount / videoTestCount) * 100 : 0;
    const completionRate = interviewCount > 0 ? (completedCount / interviewCount) * 100 : 0;

    // Calculate stage distribution
    const stageDistribution = {
      applied: filteredApplications.filter((app) => app.stage === "applied").length,
      written_test: filteredApplications.filter((app) => app.stage === "written_test").length,
      video_test: filteredApplications.filter((app) => app.stage === "video_test").length,
      interview: filteredApplications.filter((app) => app.stage === "interview").length,
      completed: filteredApplications.filter((app) => app.stage === "completed").length,
    };

    // Calculate time-based metrics
    const averageTimeToHire = 14; // Mock data - would calculate from real timestamps
    const averageResponseTime = 2; // Mock data

    return {
      totalApplications,
      writtenTestCount,
      videoTestCount,
      interviewCount,
      completedCount,
      writtenTestRate,
      videoTestRate,
      interviewRate,
      completionRate,
      stageDistribution,
      averageTimeToHire,
      averageResponseTime,
    };
  }, [applications, timeRange]);

  const keyMetrics = [
    {
      title: "Total Applications",
      value: analytics.totalApplications,
      change: "+12%",
      changeType: "positive" as const,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Conversion Rate",
      value: `${analytics.completionRate.toFixed(1)}%`,
      change: "+2.1%",
      changeType: "positive" as const,
      icon: Target,
      color: "text-green-600",
    },
    {
      title: "Avg Time to Hire",
      value: `${analytics.averageTimeToHire}d`,
      change: "-3d",
      changeType: "positive" as const,
      icon: Clock,
      color: "text-purple-600",
    },
    {
      title: "Interview Rate",
      value: `${analytics.interviewRate.toFixed(1)}%`,
      change: "+5.2%",
      changeType: "positive" as const,
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recruitment Analytics</h2>
          <p className="text-gray-600">Track your hiring performance and optimize your process</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {keyMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <metric.icon className={`h-8 w-8 ${metric.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`text-sm font-medium ${
                    metric.changeType === "positive" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {metric.change}
                </span>
                <p className="text-xs text-gray-500">vs prev period</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recruitment Funnel */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recruitment Funnel</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {[
              { label: "Applications", count: analytics.totalApplications, percentage: 100 },
              { label: "Written Test", count: analytics.writtenTestCount, percentage: analytics.writtenTestRate },
              { label: "Video Test", count: analytics.videoTestCount, percentage: analytics.videoTestRate },
              { label: "Interview", count: analytics.interviewCount, percentage: analytics.interviewRate },
              { label: "Hired", count: analytics.completedCount, percentage: analytics.completionRate },
            ].map((stage, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-600 rounded-full opacity-80" style={{ opacity: 1 - index * 0.15 }}></div>
                  <span className="font-medium text-gray-900">{stage.label}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{stage.count}</div>
                    <div className="text-sm text-gray-500">{stage.percentage.toFixed(1)}%</div>
                  </div>
                  <div className="w-24 h-2 bg-gray-200 rounded-full">
                    <div 
                      className="h-2 bg-blue-600 rounded-full transition-all"
                      style={{ width: `${stage.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stage Distribution */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Current Stage Distribution</h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {Object.entries(analytics.stageDistribution).map(([stage, count], index) => {
              const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-red-500"];
              const percentage = analytics.totalApplications > 0 ? (count / analytics.totalApplications) * 100 : 0;
              
              return (
                <div key={stage} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 ${colors[index]} rounded-full`}></div>
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {stage.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">{count}</span>
                    <span className="text-sm text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Insights</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Top Performing Jobs */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Top Performing Jobs</h4>
            <div className="space-y-2">
              {applications
                .reduce((acc, app) => {
                  const existing = acc.find(item => item.jobTitle === app.jobTitle);
                  if (existing) {
                    existing.count++;
                  } else {
                    acc.push({ jobTitle: app.jobTitle, count: 1 });
                  }
                  return acc;
                }, [] as { jobTitle: string; count: number }[])
                .sort((a, b) => b.count - a.count)
                .slice(0, 3)
                .map((job, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700 truncate">{job.jobTitle}</span>
                    <span className="text-sm font-semibold text-gray-900">{job.count}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Conversion Insights */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Conversion Insights</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Written Test Pass Rate</span>
                <span className="text-sm font-semibold text-gray-900">
                  {analytics.writtenTestRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Video Test Pass Rate</span>
                <span className="text-sm font-semibold text-gray-900">
                  {analytics.videoTestRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Interview Success Rate</span>
                <span className="text-sm font-semibold text-gray-900">
                  {analytics.completionRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Time Metrics */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Time Metrics</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Time to Hire</span>
                <span className="text-sm font-semibold text-gray-900">
                  {analytics.averageTimeToHire} days
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Response Time</span>
                <span className="text-sm font-semibold text-gray-900">
                  {analytics.averageResponseTime} days
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Applications</span>
                <span className="text-sm font-semibold text-gray-900">
                  {applications.filter(app => app.status === "pending").length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-yellow-900 mb-2">Optimization Opportunities</h4>
            <ul className="space-y-1 text-yellow-800">
              <li>• Consider reviewing written test difficulty - {analytics.writtenTestRate.toFixed(1)}% pass rate</li>
              <li>• Video test performance is {analytics.videoTestRate > 70 ? "strong" : "below average"}</li>
              <li>• Interview conversion rate could be improved with better screening</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-yellow-900 mb-2">Process Improvements</h4>
            <ul className="space-y-1 text-yellow-800">
              <li>• Automate more screening steps to reduce time to hire</li>
              <li>• Set up email templates for faster candidate communication</li>
              <li>• Consider structured interviews for better consistency</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}