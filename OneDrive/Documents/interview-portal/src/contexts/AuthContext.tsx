"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, getCurrentUser, fetchAuthSession } from "aws-amplify/auth";

// Import Amplify config to ensure it's loaded
import "../lib/amplify-config";

interface User {
  username: string;
  email: string;
  groups: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check for existing user session
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      console.log("🔍 Checking for existing user session...");
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      
      // Get user groups from JWT token
      const accessToken = session.tokens?.accessToken;
      const groups = (accessToken?.payload['cognito:groups'] as string[]) || [];
      
      console.log("✅ User found:", currentUser.username);
      console.log("🏷️ User groups:", groups);
      
      const userInfo: User = {
        username: currentUser.username,
        email: currentUser.signInDetails?.loginId || currentUser.username,
        groups: groups
      };
      
      setUser(userInfo);
      
      // Simple redirect logic based on groups
      if (typeof window !== "undefined" && (window.location.pathname === "/" || window.location.pathname === "/login")) {
        if (groups.includes('SuperAdmins')) {
          console.log("🚀 Redirecting SuperAdmin to admin dashboard");
          router.push("/admin/dashboard");
        } else if (groups.includes('CompanyAdmins')) {
          console.log("🚀 Redirecting CompanyAdmin to company dashboard");
          router.push("/company/dashboard");
        } else {
          console.log("🚀 Redirecting to candidate dashboard");
          router.push("/candidate/dashboard");
        }
      }
      
    } catch (error) {
      console.log("ℹ️ No authenticated user found");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    try {
      console.log("🔐 Signing in:", email);
      await signIn({ username: email, password });
      console.log("✅ Sign in successful");
      await checkUser(); // This will handle the redirect
    } catch (error) {
      console.error("❌ Sign in failed:", error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      console.log("✅ Signed out successfully");
      router.push("/login");
    } catch (error) {
      console.error("❌ Sign out failed:", error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};