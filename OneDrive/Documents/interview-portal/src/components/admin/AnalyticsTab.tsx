// src/components/admin/AnalyticsTab.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Building,
  FileText,
  Clock,
  Target,
  Activity,
  RefreshCw,
  Calendar,
} from "lucide-react";

export default function AnalyticsTab() {
  const [timeRange, setTimeRange] = useState("30d");
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual data refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error refreshing analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const metricsCards = [
    {
      title: "Platform Growth",
      value: "156.2%",
      change: "+23.4%",
      trend: "up",
      description: "Year-over-year user growth",
      icon: TrendingUp,
      color: "green",
    },
    {
      title: "Conversion Rate",
      value: "12.8%",
      change: "+2.1%",
      trend: "up",
      description: "Application to hire ratio",
      icon: Target,
      color: "blue",
    },
    {
      title: "Avg. Time to Hire",
      value: "18 days",
      change: "-5 days",
      trend: "up",
      description: "From application to offer",
      icon: Clock,
      color: "purple",
    },
    {
      title: "Platform Usage",
      value: "94.7%",
      change: "+1.2%",
      trend: "up",
      description: "Daily active user rate",
      icon: Activity,
      color: "orange",
    },
  ];

  const chartData = [
    { month: "Jan", users: 1200, companies: 45, applications: 890 },
    { month: "Feb", users: 1350, companies: 52, applications: 1020 },
    { month: "Mar", users: 1580, companies: 61, applications: 1350 },
    { month: "Apr", users: 1750, companies: 68, applications: 1580 },
    { month: "May", users: 1920, companies: 75, applications: 1820 },
    { month: "Jun", users: 2150, companies: 82, applications: 2100 },
  ];

  const topPerformingCompanies = [
    { name: "TechCorp Solutions", applications: 234, hires: 28, rate: "12.0%" },
    { name: "Innovation Labs", applications: 189, hires: 31, rate: "16.4%" },
    { name: "Digital Dynamics", applications: 156, hires: 19, rate: "12.2%" },
    { name: "Future Systems", applications: 143, hires: 22, rate: "15.4%" },
    { name: "Smart Solutions", applications: 98, hires: 14, rate: "14.3%" },
  ];

  const getIconColor = (color: string) => {
    const colors = {
      green: "text-green-600",
      blue: "text-blue-600",
      purple: "text-purple-600",
      orange: "text-orange-600",
    };
    return colors[color as keyof typeof colors];
  };

  const getBgColor = (color: string) => {
    const colors = {
      green: "bg-green-50",
      blue: "bg-blue-50",
      purple: "bg-purple-50",
      orange: "bg-orange-50",
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">
            Comprehensive platform analytics and insights
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 3 months</option>
              <option value="1y">Last year</option>
            </select>
          </div>
          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsCards.map((metric) => (
          <div key={metric.title} className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                <div className="flex items-center mt-2">
                  {metric.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className="text-sm font-medium text-green-600">
                    {metric.change}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
              </div>
              <div className={`p-3 rounded-full ${getBgColor(metric.color)}`}>
                <metric.icon className={`w-6 h-6 ${getIconColor(metric.color)}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Platform Growth</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {chartData.map((data, index) => (
              <div key={data.month} className="flex items-center space-x-4">
                <div className="w-12 text-sm font-medium text-gray-600">
                  {data.month}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Users</span>
                    <span className="font-medium">{data.users.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(data.users / 2500) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Company Performance */}
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Companies</h3>
            <Building className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {topPerformingCompanies.map((company, index) => (
              <div key={company.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{company.name}</p>
                    <p className="text-xs text-gray-500">
                      {company.applications} applications • {company.hires} hires
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">
                    {company.rate}
                  </div>
                  <div className="text-xs text-gray-500">success rate</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Detailed Platform Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              User Metrics
            </h4>
            <div className="space-y-3">
              {[
                { label: "Total Registered Users", value: "12,847" },
                { label: "Monthly Active Users", value: "8,234" },
                { label: "New Registrations (30d)", value: "1,456" },
                { label: "User Retention Rate", value: "78.5%" },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between text-sm">
                  <span className="text-gray-600">{stat.label}</span>
                  <span className="font-medium text-gray-900">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Building className="w-5 h-5 mr-2 text-green-600" />
              Company Metrics
            </h4>
            <div className="space-y-3">
              {[
                { label: "Active Companies", value: "847" },
                { label: "Premium Subscriptions", value: "234" },
                { label: "Average Jobs per Company", value: "12.3" },
                { label: "Company Satisfaction", value: "4.6/5" },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between text-sm">
                  <span className="text-gray-600">{stat.label}</span>
                  <span className="font-medium text-gray-900">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-600" />
              Application Metrics
            </h4>
            <div className="space-y-3">
              {[
                { label: "Total Applications", value: "45,623" },
                { label: "Applications This Month", value: "3,789" },
                { label: "Average Applications/Job", value: "28.4" },
                { label: "Application Success Rate", value: "14.2%" },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between text-sm">
                  <span className="text-gray-600">{stat.label}</span>
                  <span className="font-medium text-gray-900">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              AI-Powered Insights & Recommendations
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>User engagement is 23% higher on weekdays between 9 AM - 11 AM</li>
                <li>Companies with complete profiles receive 40% more quality applications</li>
                <li>Video interviews have a 15% higher completion rate than traditional ones</li>
                <li>Consider implementing automated follow-up emails to increase response rates</li>
              </ul>
            </div>
            <div className="mt-4">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                View Full Analysis
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}