// src/components/admin/AdminDashboardHeader.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Bell, Brain, Heart, LogOut } from "lucide-react";

import { AdminTabType } from "./types";

interface AdminDashboardHeaderProps {
  onNavigateToTab?: (tab: AdminTabType) => void;
}

export default function AdminDashboardHeader({ onNavigateToTab }: AdminDashboardHeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="bg-white shadow-sm border-b border-abhh-teal-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-4">
            {/* Brand Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-abhh-yellow-500 rounded-lg flex items-center justify-center shadow-abhh">
                <div className="flex items-center space-x-0.5">
                  <Brain className="h-5 w-5 text-abhh-teal-600" />
                  <Heart className="h-3 w-3 text-abhh-teal-600" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-abhh-teal-600">
                  ABHH Platform
                </h1>
                <p className="text-xs text-abhh-teal-500">
                  Super Admin Dashboard
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              className="border-abhh-yellow-400 text-abhh-teal-600 hover:bg-abhh-yellow-50"
              onClick={() => {
                console.log("Notifications button clicked");
                console.log("onNavigateToTab function:", onNavigateToTab);
                onNavigateToTab?.('notifications');
              }}
            >
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </Button>
            <Button
              variant="secondary"
              className="bg-abhh-yellow-500 text-abhh-teal-600 hover:bg-abhh-yellow-400"
              onClick={() => {
                console.log("Add Company button clicked");
                console.log("onNavigateToTab function:", onNavigateToTab);
                onNavigateToTab?.('companies');
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Button>
            <Button
              variant="outline"
              className="border-abhh-teal-600 text-abhh-teal-600 hover:bg-abhh-teal-50"
              onClick={() => {
                console.log("Settings button clicked");
                console.log("onNavigateToTab function:", onNavigateToTab);
                onNavigateToTab?.('settings');
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>

            {/* User Profile Section */}
            <div className="border-l border-abhh-teal-200 pl-4">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-abhh-teal-700">
                    Super Administrator
                  </p>
                  <p className="text-xs text-abhh-teal-500">{user?.username}</p>
                </div>
                <div className="w-8 h-8 bg-abhh-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-abhh-teal-600">
                    {user?.username?.charAt(0)?.toUpperCase() || "A"}
                  </span>
                </div>
                <Button
                  onClick={signOut}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
