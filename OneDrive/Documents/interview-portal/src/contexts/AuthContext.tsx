"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, signUp, getCurrentUser, fetchAuthSession } from "aws-amplify/auth";

// Import Amplify config to ensure it's loaded
import "../lib/amplify-config";

interface User {
  username: string;
  email: string;
  groups: string[];
  userId: string;
  sub: string;
  attributes: {
    email: string;
    given_name?: string;
    family_name?: string;
    [key: string]: any;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, attributes?: any) => Promise<void>;
  userRole: string | null;
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
      let groups = (accessToken?.payload['cognito:groups'] as string[]) || [];
      
      console.log("✅ User found:", currentUser.username);
      console.log("🏷️ User groups from JWT:", groups);
      
      // If no groups found in JWT token, use direct fallback
      if (groups.length === 0) {
        console.log("🔄 No groups in JWT, using fallback detection...");
        
        // Direct fallback: Check if this is the known super admin email
        const userEmail = currentUser.signInDetails?.loginId || currentUser.username;
        console.log("🔍 Checking email for fallback:", userEmail);
        
        if (userEmail === 'dukeika@gmail.com') {
          console.log("🎯 Fallback: Recognized super admin email, assigning SuperAdmins group");
          groups = ['SuperAdmins'];
        } else {
          console.log("🔍 Unknown user, defaulting to Candidates group");
          groups = ['Candidates'];
        }
      }
      
      console.log("🏆 Final groups assigned:", groups);
      
      const userInfo: User = {
        username: currentUser.username,
        email: currentUser.signInDetails?.loginId || currentUser.username,
        groups: groups,
        userId: currentUser.userId,
        sub: currentUser.userId,
        attributes: {
          email: currentUser.signInDetails?.loginId || currentUser.username,
          given_name: '',
          family_name: ''
        }
      };
      
      setUser(userInfo);
      
      // Simple redirect logic based on groups
      if (typeof window !== "undefined" && (window.location.pathname === "/" || window.location.pathname === "/login")) {
        console.log("🎯 REDIRECT LOGIC - Current path:", window.location.pathname);
        console.log("🎯 REDIRECT LOGIC - Groups to check:", groups);
        console.log("🎯 REDIRECT LOGIC - Checking SuperAdmins:", groups.includes('SuperAdmins'));
        console.log("🎯 REDIRECT LOGIC - Checking CompanyAdmins:", groups.includes('CompanyAdmins'));
        
        if (groups.includes('SuperAdmins')) {
          console.log("🚀 Redirecting SuperAdmin to admin dashboard");
          router.push("/admin/dashboard");
        } else if (groups.includes('CompanyAdmins')) {
          console.log("🚀 Redirecting CompanyAdmin to company dashboard");
          router.push("/company/dashboard");
        } else {
          console.log("🚀 Redirecting to candidate dashboard (default)");
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

  const handleSignUp = async (email: string, password: string, attributes: any = {}) => {
    try {
      console.log("📝 Signing up:", email);
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            ...attributes
          }
        }
      });
      console.log("✅ Sign up successful");
    } catch (error) {
      console.error("❌ Sign up failed:", error);
      throw error;
    }
  };

  // Calculate user role based on groups
  const userRole = user?.groups.includes('SuperAdmins') ? 'super_admin' : 
                  user?.groups.includes('CompanyAdmins') ? 'company_admin' : 
                  user?.groups.includes('Candidates') ? 'candidate' : null;

  const value: AuthContextType = {
    user,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    signUp: handleSignUp,
    userRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};