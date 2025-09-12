"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useRoleProtection(requiredRoles: string[] = []) {
  const { user, loading, userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (!loading && user && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => 
        user.groups.includes(role) || 
        (role === "super_admin" && user.groups.includes("SuperAdmins")) ||
        (role === "company_admin" && user.groups.includes("CompanyAdmins")) ||
        (role === "candidate" && user.groups.includes("Candidates"))
      );
      
      if (!hasRequiredRole) {
        router.push("/unauthorized");
        return;
      }
    }
  }, [user, loading, router, requiredRoles]);

  return { user, userRole, loading };
}

interface RouteProtectionProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
}

export function RouteProtection({ 
  children, 
  requiredRoles = [], 
  redirectTo = "/login" 
}: RouteProtectionProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
      return;
    }

    if (!loading && user && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => 
        user.groups.includes(role)
      );
      
      if (!hasRequiredRole) {
        router.push("/unauthorized");
        return;
      }
    }
  }, [user, loading, router, requiredRoles, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => 
      user.groups.includes(role)
    );
    
    if (!hasRequiredRole) {
      return null;
    }
  }

  return <>{children}</>;
}

export default RouteProtection;