// src/components/candidate/CandidateDashboardHeader.tsx
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { User, LogOut, Bell } from "lucide-react";

export default function CandidateDashboardHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-abhh-yellow-500 rounded-lg flex items-center justify-center mr-3">
                <span className="text-abhh-teal-600 font-bold text-sm">AH</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-abhh-teal-600">
                  ABHH Careers
                </h1>
                <p className="text-xs text-gray-500">Candidate Portal</p>
              </div>
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-500 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {user?.attributes?.email || "Candidate"}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
