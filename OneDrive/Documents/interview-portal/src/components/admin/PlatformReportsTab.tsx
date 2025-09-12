// src/components/admin/PlatformReportsTab.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  BarChart3,
  Users,
  Building,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
} from "lucide-react";

export default function PlatformReportsTab() {
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    {
      id: "user-activity",
      title: "User Activity Report",
      description: "Detailed analysis of user engagement and platform usage",
      icon: Activity,
      color: "blue",
    },
    {
      id: "company-metrics",
      title: "Company Performance Metrics",
      description: "Company registration, job postings, and hiring success rates",
      icon: Building,
      color: "green",
    },
    {
      id: "financial-overview",
      title: "Financial Overview",
      description: "Revenue, subscriptions, and payment analytics",
      icon: DollarSign,
      color: "purple",
    },
    {
      id: "candidate-insights",
      title: "Candidate Insights",
      description: "Application trends, test performance, and success rates",
      icon: Users,
      color: "orange",
    },
  ];

  const quickStats = [
    {
      title: "Total Revenue",
      value: "$124,523",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "green",
    },
    {
      title: "Active Companies",
      value: "847",
      change: "+8.2%",
      trend: "up",
      icon: Building,
      color: "blue",
    },
    {
      title: "Monthly Applications",
      value: "5,234",
      change: "-3.1%",
      trend: "down",
      icon: FileText,
      color: "red",
    },
    {
      title: "Platform Usage",
      value: "94.2%",
      change: "+2.8%",
      trend: "up",
      icon: BarChart3,
      color: "purple",
    },
  ];

  const handleGenerateReport = async (reportId: string) => {
    setLoading(true);
    try {
      console.log(`Generating report: ${reportId} for period: ${selectedPeriod} days`);
      // TODO: Implement actual report generation
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      console.log("Report generated successfully");
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIconColor = (color: string) => {
    const colors = {
      blue: "text-blue-600",
      green: "text-green-600",
      purple: "text-purple-600",
      orange: "text-orange-600",
      red: "text-red-600",
    };
    return colors[color as keyof typeof colors] || "text-gray-600";
  };

  const getBgColor = (color: string) => {
    const colors = {
      blue: "bg-blue-50",
      green: "bg-green-50",
      purple: "bg-purple-50",
      orange: "bg-orange-50",
      red: "bg-red-50",
    };
    return colors[color as keyof typeof colors] || "bg-gray-50";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Reports</h2>
          <p className="text-gray-600">
            Generate comprehensive reports and analytics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center mt-2">
                  {stat.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-full ${getBgColor(stat.color)}`}>
                <stat.icon className={`w-6 h-6 ${getIconColor(stat.color)}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Report Types */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Available Reports
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportTypes.map((report) => (
            <div
              key={report.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${getBgColor(report.color)}`}>
                    <report.icon className={`w-6 h-6 ${getIconColor(report.color)}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {report.title}
                    </h4>
                    <p className="text-gray-600 mt-1">{report.description}</p>
                    <div className="mt-4 flex space-x-3">
                      <Button
                        size="sm"
                        onClick={() => handleGenerateReport(report.id)}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {loading ? "Generating..." : "Generate PDF"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateReport(`${report.id}-excel`)}
                        disabled={loading}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Export Excel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Reports</h3>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
        <div className="space-y-4">
          {[
            {
              name: "Monthly User Activity Report",
              generatedAt: "2024-01-15 14:30",
              type: "PDF",
              size: "2.4 MB",
            },
            {
              name: "Company Performance Metrics",
              generatedAt: "2024-01-14 09:15",
              type: "Excel",
              size: "1.8 MB",
            },
            {
              name: "Financial Overview Q4 2023",
              generatedAt: "2024-01-12 16:45",
              type: "PDF",
              size: "3.1 MB",
            },
          ].map((report, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{report.name}</p>
                  <p className="text-sm text-gray-500">
                    Generated on {report.generatedAt} • {report.type} • {report.size}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Coming Soon Features */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <BarChart3 className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Advanced Analytics Coming Soon
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Real-time dashboard with live metrics</li>
                <li>Predictive analytics for hiring trends</li>
                <li>Custom report builder with drag-and-drop interface</li>
                <li>Automated report scheduling and email delivery</li>
                <li>Integration with external BI tools</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}