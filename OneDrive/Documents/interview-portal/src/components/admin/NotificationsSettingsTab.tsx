// src/components/admin/NotificationsSettingsTab.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Settings,
  Users,
  Building,
  FileText,
  AlertCircle,
  CheckCircle,
  Save,
  RefreshCw,
} from "lucide-react";

interface NotificationSettings {
  email: {
    userRegistration: boolean;
    companySignup: boolean;
    applicationSubmitted: boolean;
    paymentReceived: boolean;
    systemAlerts: boolean;
    weeklyReports: boolean;
  };
  push: {
    criticalAlerts: boolean;
    newRegistrations: boolean;
    dailySummary: boolean;
  };
  sms: {
    securityAlerts: boolean;
    systemDowntime: boolean;
  };
}

export default function NotificationsSettingsTab() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      userRegistration: true,
      companySignup: true,
      applicationSubmitted: false,
      paymentReceived: true,
      systemAlerts: true,
      weeklyReports: true,
    },
    push: {
      criticalAlerts: true,
      newRegistrations: false,
      dailySummary: false,
    },
    sms: {
      securityAlerts: true,
      systemDowntime: true,
    },
  });

  const [loading, setLoading] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState({
    welcomeEmail: "Welcome to ABHH Interview Platform",
    approvalNotification: "Your account has been approved",
    rejectionNotification: "Account registration update",
  });

  const handleToggleSetting = (category: keyof NotificationSettings, setting: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !(prev[category] as any)[setting],
      },
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual settings save
      console.log("Saving notification settings:", settings);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const testNotification = async (type: string) => {
    console.log(`Testing ${type} notification`);
    // TODO: Implement test notification
  };

  const notificationCategories = [
    {
      id: "email",
      title: "Email Notifications",
      description: "Configure email notification preferences",
      icon: Mail,
      color: "blue",
      settings: [
        { key: "userRegistration", label: "New User Registrations", description: "Get notified when new users register" },
        { key: "companySignup", label: "New Company Signups", description: "Alerts for new company registrations" },
        { key: "applicationSubmitted", label: "Application Submitted", description: "Individual application notifications" },
        { key: "paymentReceived", label: "Payment Received", description: "Subscription and payment confirmations" },
        { key: "systemAlerts", label: "System Alerts", description: "Critical system notifications" },
        { key: "weeklyReports", label: "Weekly Reports", description: "Automated weekly summary reports" },
      ],
    },
    {
      id: "push",
      title: "Push Notifications",
      description: "Browser and mobile push notifications",
      icon: Bell,
      color: "green",
      settings: [
        { key: "criticalAlerts", label: "Critical Alerts", description: "High-priority system alerts" },
        { key: "newRegistrations", label: "New Registrations", description: "Real-time registration notifications" },
        { key: "dailySummary", label: "Daily Summary", description: "End-of-day platform summary" },
      ],
    },
    {
      id: "sms",
      title: "SMS Notifications",
      description: "Text message alerts for critical events",
      icon: Smartphone,
      color: "purple",
      settings: [
        { key: "securityAlerts", label: "Security Alerts", description: "Security-related notifications" },
        { key: "systemDowntime", label: "System Downtime", description: "Maintenance and downtime alerts" },
      ],
    },
  ];

  const getIconColor = (color: string) => {
    const colors = {
      blue: "text-blue-600",
      green: "text-green-600",
      purple: "text-purple-600",
    };
    return colors[color as keyof typeof colors];
  };

  const getBgColor = (color: string) => {
    const colors = {
      blue: "bg-blue-50",
      green: "bg-green-50",
      purple: "bg-purple-50",
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>
          <p className="text-gray-600">
            Manage platform notifications and communication preferences
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSaveSettings} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* Notification Categories */}
      <div className="space-y-6">
        {notificationCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getBgColor(category.color)}`}>
                  <category.icon className={`w-5 h-5 ${getIconColor(category.color)}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testNotification(category.id)}
              >
                Test
              </Button>
            </div>

            <div className="space-y-4">
              {category.settings.map((setting) => {
                const categorySettings = settings[category.id as keyof NotificationSettings] as any;
                const isEnabled = categorySettings[setting.key];
                
                return (
                  <div key={setting.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-sm font-medium text-gray-900">{setting.label}</h4>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
                    </div>
                    <div className="ml-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isEnabled}
                          onChange={() => handleToggleSetting(category.id as keyof NotificationSettings, setting.key)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Email Templates */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-orange-50">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Email Templates</h3>
              <p className="text-sm text-gray-600">Customize notification email templates</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Manage Templates
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(emailTemplates).map(([key, template]) => (
            <div key={key} className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h4>
              <p className="text-sm text-gray-600 mb-3">{template}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Last updated: 2024-01-15</span>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notification History */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-gray-50">
              <MessageSquare className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
              <p className="text-sm text-gray-600">Last 10 notifications sent</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>

        <div className="space-y-3">
          {[
            {
              type: "email",
              title: "New Company Registration",
              description: "TechCorp Solutions registered",
              time: "2 hours ago",
              status: "delivered",
            },
            {
              type: "push",
              title: "System Alert",
              description: "High CPU usage detected",
              time: "4 hours ago",
              status: "delivered",
            },
            {
              type: "email",
              title: "Weekly Report",
              description: "Platform statistics for week ending 2024-01-14",
              time: "1 day ago",
              status: "delivered",
            },
            {
              type: "sms",
              title: "Security Alert",
              description: "Failed login attempts detected",
              time: "2 days ago",
              status: "failed",
            },
          ].map((notification, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  notification.type === 'email' ? 'bg-blue-50' :
                  notification.type === 'push' ? 'bg-green-50' : 'bg-purple-50'
                }`}>
                  {notification.type === 'email' && <Mail className="w-4 h-4 text-blue-600" />}
                  {notification.type === 'push' && <Bell className="w-4 h-4 text-green-600" />}
                  {notification.type === 'sms' && <Smartphone className="w-4 h-4 text-purple-600" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                  <p className="text-sm text-gray-500">{notification.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">{notification.time}</span>
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                  notification.status === 'delivered' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {notification.status === 'delivered' ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <AlertCircle className="w-3 h-3 mr-1" />
                  )}
                  {notification.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Settings className="w-6 h-6 text-gray-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">
              Advanced Notification Features
            </h3>
            <div className="mt-2 text-sm text-gray-600">
              <ul className="list-disc list-inside space-y-1">
                <li>Custom notification rules and triggers</li>
                <li>Integration with Slack, Microsoft Teams, and Discord</li>
                <li>Advanced filtering and routing options</li>
                <li>Webhook support for external integrations</li>
                <li>Notification analytics and delivery reports</li>
              </ul>
            </div>
            <div className="mt-4">
              <Button size="sm" variant="outline">
                Configure Advanced Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}