// src/components/admin/SettingsTab.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Shield,
  Database,
  Globe,
  Mail,
  Key,
  Server,
  Users,
  Building,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react";

interface PlatformSettings {
  general: {
    platformName: string;
    supportEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
  };
  security: {
    passwordMinLength: number;
    requireSpecialChars: boolean;
    sessionTimeout: number;
    twoFactorRequired: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: string;
    smtpUsername: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
  storage: {
    maxFileSize: number;
    allowedFileTypes: string[];
    storageProvider: "aws" | "local";
  };
  billing: {
    currency: string;
    taxRate: number;
    freePlanApplications: number;
  };
}

export default function SettingsTab() {
  const [settings, setSettings] = useState<PlatformSettings>({
    general: {
      platformName: "ABHH Interview Platform",
      supportEmail: "support@abhh.com",
      maintenanceMode: false,
      registrationEnabled: true,
    },
    security: {
      passwordMinLength: 8,
      requireSpecialChars: true,
      sessionTimeout: 30,
      twoFactorRequired: false,
    },
    email: {
      smtpHost: "smtp.gmail.com",
      smtpPort: "587",
      smtpUsername: "noreply@abhh.com",
      smtpPassword: "••••••••••••",
      fromEmail: "noreply@abhh.com",
      fromName: "ABHH Interview Platform",
    },
    storage: {
      maxFileSize: 10,
      allowedFileTypes: ["pdf", "doc", "docx", "jpg", "png"],
      storageProvider: "aws",
    },
    billing: {
      currency: "USD",
      taxRate: 0,
      freePlanApplications: 10,
    },
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeSection, setActiveSection] = useState("general");

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      console.log("Saving platform settings:", settings);
      
      // Simulate API call to save settings
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      // Show success message
      alert('Settings saved successfully!');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmailSettings = async () => {
    console.log("Testing email configuration...");
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: settings.general.supportEmail,
          emailConfig: settings.email
        }),
      });
      
      if (response.ok) {
        alert('Test email sent successfully! Check your inbox.');
      } else {
        alert('Failed to send test email. Please check your email configuration.');
      }
    } catch (error) {
      console.error("Error testing email:", error);
      alert('Error testing email configuration.');
    }
  };

  const generateApiKey = () => {
    const key = `abhh_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`;
    navigator.clipboard.writeText(key);
    alert("New API key generated and copied to clipboard!");
  };

  const updateSetting = (section: keyof PlatformSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const sections = [
    { id: "general", label: "General", icon: Settings },
    { id: "security", label: "Security", icon: Shield },
    { id: "email", label: "Email", icon: Mail },
    { id: "storage", label: "Storage", icon: Database },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "api", label: "API Keys", icon: Key },
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Platform Name
          </label>
          <input
            type="text"
            value={settings.general.platformName}
            onChange={(e) => updateSetting("general", "platformName", e.target.value)}
            className="w-full px-3 py-2 border border-abhh-teal-200 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 focus:border-abhh-teal-500 text-gray-900 placeholder-gray-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Support Email
          </label>
          <input
            type="email"
            value={settings.general.supportEmail}
            onChange={(e) => updateSetting("general", "supportEmail", e.target.value)}
            className="w-full px-3 py-2 border border-abhh-teal-200 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 focus:border-abhh-teal-500 text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Maintenance Mode</h4>
            <p className="text-sm text-gray-500">Temporarily disable platform access</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.general.maintenanceMode}
              onChange={(e) => updateSetting("general", "maintenanceMode", e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-abhh-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-abhh-teal-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">User Registration</h4>
            <p className="text-sm text-gray-500">Allow new user registrations</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.general.registrationEnabled}
              onChange={(e) => updateSetting("general", "registrationEnabled", e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-abhh-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-abhh-teal-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Password Length
          </label>
          <input
            type="number"
            min="6"
            max="20"
            value={settings.security.passwordMinLength}
            onChange={(e) => updateSetting("security", "passwordMinLength", parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-abhh-teal-200 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 focus:border-abhh-teal-500 text-gray-900 placeholder-gray-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Timeout (minutes)
          </label>
          <input
            type="number"
            min="5"
            max="480"
            value={settings.security.sessionTimeout}
            onChange={(e) => updateSetting("security", "sessionTimeout", parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-abhh-teal-200 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 focus:border-abhh-teal-500 text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Special Characters Required</h4>
            <p className="text-sm text-gray-500">Require special characters in passwords</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.security.requireSpecialChars}
              onChange={(e) => updateSetting("security", "requireSpecialChars", e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-abhh-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-abhh-teal-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
            <p className="text-sm text-gray-500">Require 2FA for all admin accounts</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.security.twoFactorRequired}
              onChange={(e) => updateSetting("security", "twoFactorRequired", e.target.checked)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-abhh-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-abhh-teal-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div className="bg-abhh-yellow-50 border border-abhh-yellow-200 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-abhh-yellow-400 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-abhh-teal-800">Email Configuration</h3>
            <p className="text-sm text-abhh-teal-700 mt-1">
              Configure SMTP settings to enable automated notifications and alerts.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SMTP Host
          </label>
          <input
            type="text"
            value={settings.email.smtpHost}
            onChange={(e) => updateSetting("email", "smtpHost", e.target.value)}
            className="w-full px-3 py-2 border border-abhh-teal-200 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 focus:border-abhh-teal-500 text-gray-900 placeholder-gray-400"
            placeholder="smtp.gmail.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SMTP Port
          </label>
          <input
            type="text"
            value={settings.email.smtpPort}
            onChange={(e) => updateSetting("email", "smtpPort", e.target.value)}
            className="w-full px-3 py-2 border border-abhh-teal-200 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 focus:border-abhh-teal-500 text-gray-900 placeholder-gray-400"
            placeholder="587"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SMTP Username
          </label>
          <input
            type="email"
            value={settings.email.smtpUsername}
            onChange={(e) => updateSetting("email", "smtpUsername", e.target.value)}
            className="w-full px-3 py-2 border border-abhh-teal-200 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 focus:border-abhh-teal-500 text-gray-900 placeholder-gray-400"
            placeholder="noreply@abhh.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SMTP Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={settings.email.smtpPassword}
              onChange={(e) => updateSetting("email", "smtpPassword", e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-abhh-teal-200 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 focus:border-abhh-teal-500 text-gray-900 placeholder-gray-400"
              placeholder="••••••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Email
          </label>
          <input
            type="email"
            value={settings.email.fromEmail}
            onChange={(e) => updateSetting("email", "fromEmail", e.target.value)}
            className="w-full px-3 py-2 border border-abhh-teal-200 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 focus:border-abhh-teal-500 text-gray-900 placeholder-gray-400"
            placeholder="noreply@abhh.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Name
          </label>
          <input
            type="text"
            value={settings.email.fromName}
            onChange={(e) => updateSetting("email", "fromName", e.target.value)}
            className="w-full px-3 py-2 border border-abhh-teal-200 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 focus:border-abhh-teal-500 text-gray-900 placeholder-gray-400"
            placeholder="ABHH Interview Platform"
          />
        </div>
      </div>

      <div className="pt-4">
        <Button onClick={handleTestEmailSettings} className="bg-abhh-teal-600 hover:bg-abhh-teal-700 text-white">
          <Mail className="mr-2 h-4 w-4" />
          Send Test Email
        </Button>
      </div>
    </div>
  );

  const renderStorageSettings = () => (
    <div className="space-y-6">
      <div className="bg-abhh-yellow-50 border border-abhh-yellow-200 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-abhh-yellow-400 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-abhh-teal-800">File Storage Configuration</h3>
            <p className="text-sm text-abhh-teal-700 mt-1">
              Configure file upload limits and storage preferences for resumes and videos.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum File Size (MB)
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={settings.storage.maxFileSize}
            onChange={(e) => updateSetting("storage", "maxFileSize", parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-abhh-teal-200 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 focus:border-abhh-teal-500 text-gray-900 placeholder-gray-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Storage Provider
          </label>
          <select
            value={settings.storage.storageProvider}
            onChange={(e) => updateSetting("storage", "storageProvider", e.target.value as "aws" | "local")}
            className="w-full px-3 py-2 border border-abhh-teal-200 rounded-md focus:outline-none focus:ring-2 focus:ring-abhh-teal-500 focus:border-abhh-teal-500 text-gray-900"
          >
            <option value="aws">AWS S3</option>
            <option value="local">Local Storage</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Allowed File Types
        </label>
        <div className="flex flex-wrap gap-2">
          {["pdf", "doc", "docx", "jpg", "png", "mp4", "webm"].map((type) => (
            <label key={type} className="flex items-center">
              <input
                type="checkbox"
                checked={settings.storage.allowedFileTypes.includes(type)}
                onChange={(e) => {
                  const currentTypes = settings.storage.allowedFileTypes;
                  if (e.target.checked) {
                    updateSetting("storage", "allowedFileTypes", [...currentTypes, type]);
                  } else {
                    updateSetting("storage", "allowedFileTypes", currentTypes.filter(t => t !== type));
                  }
                }}
                className="sr-only peer"
              />
              <div className="relative flex items-center justify-center w-6 h-6 bg-white border-2 border-gray-300 rounded-md peer-checked:bg-abhh-teal-600 peer-checked:border-abhh-teal-600 peer-focus:ring-2 peer-focus:ring-abhh-teal-500">
                {settings.storage.allowedFileTypes.includes(type) && (
                  <CheckCircle className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="ml-2 text-sm text-gray-700 uppercase">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Storage Usage</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Total Files</p>
            <p className="text-lg font-semibold text-gray-900">1,247</p>
          </div>
          <div>
            <p className="text-gray-500">Storage Used</p>
            <p className="text-lg font-semibold text-gray-900">2.4 GB</p>
          </div>
          <div>
            <p className="text-gray-500">Available</p>
            <p className="text-lg font-semibold text-gray-900">47.6 GB</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApiSettings = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">API Access</h3>
            <p className="text-sm text-yellow-700 mt-1">
              These API keys provide full access to your platform data. Keep them secure and rotate them regularly.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Primary API Key</h4>
              <p className="text-sm text-gray-500">For production integrations</p>
            </div>
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-abhh-teal-100 text-abhh-teal-800">
              Active
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">
              abhh_pk_live_1234567890abcdef...
            </code>
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText("abhh_pk_live_1234567890abcdef...")}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Test API Key</h4>
              <p className="text-sm text-gray-500">For development and testing</p>
            </div>
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-abhh-yellow-100 text-abhh-teal-800">
              Test Mode
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">
              abhh_pk_test_0987654321fedcba...
            </code>
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText("abhh_pk_test_0987654321fedcba...")}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button onClick={generateApiKey} className="bg-abhh-teal-600 hover:bg-abhh-teal-700 text-white">
            <Key className="mr-2 h-4 w-4" />
            Generate New Key
          </Button>
          <Button variant="outline" className="border-abhh-teal-300 text-abhh-teal-600 hover:bg-abhh-teal-50">
            View API Documentation
          </Button>
        </div>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case "general":
        return renderGeneralSettings();
      case "security":
        return renderSecuritySettings();
      case "api":
        return renderApiSettings();
      case "email":
        return renderEmailSettings();
      case "storage":
        return renderStorageSettings();
      default:
        return (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700">
              {sections.find(s => s.id === activeSection)?.label} Settings
            </h3>
            <p className="text-gray-500 mt-2">
              Configuration options for this section coming soon...
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Platform Settings</h2>
          <p className="text-gray-600">
            Configure system-wide platform settings and preferences
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={loading} className="bg-abhh-teal-600 hover:bg-abhh-teal-700 text-white">
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Settings Navigation */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200">
            <nav className="p-4 space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeSection === section.id
                      ? 'bg-abhh-teal-100 text-abhh-teal-700 border border-abhh-teal-200'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <section.icon className="mr-3 h-5 w-5" />
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {renderActiveSection()}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Database", status: "healthy", icon: Database },
            { label: "File Storage", status: "healthy", icon: Server },
            { label: "Email Service", status: "healthy", icon: Mail },
            { label: "Authentication", status: "healthy", icon: Shield },
          ].map((service) => (
            <div key={service.label} className="flex items-center p-3 border border-gray-200 rounded-lg">
              <service.icon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">{service.label}</p>
                <div className="flex items-center mt-1">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600 capitalize">{service.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}